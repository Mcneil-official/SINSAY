import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { push } from "expo-router/build/global-state/router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ContentContainer, MarkdownText } from "../../../components";
import { colors } from "../../../constants/colors";
import { chatWithGemini } from "../../../lib/gemini";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
  failed?: boolean;
}

const getTime = () => {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m} ${ampm}`;
};

const QUICK_PROMPTS = [
  "Best dive site for beginners?",
  "Dive safety tips",
  "What is an Eco-Dive ID?",
];

function TypingDots() {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anims = [d1, d2, d3].map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(v, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [d1, d2, d3]);
  return (
    <View style={styles.typingRow}>
      {[d1, d2, d3].map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.typingDot,
            {
              opacity: v.interpolate({
                inputRange: [0, 1],
                outputRange: [0.25, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

export default function ChatScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      text: "Hi! I'm your SINSAY dive assistant. Ask me anything about dive sites, safety, marine life, or your Eco-Dive ID!",
      time: getTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });

  useEffect(() => {
    scrollToEnd();
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      text,
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      const reply = await chatWithGemini(history, text);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: reply,
        time: getTime(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsgId ? { ...m, failed: true } : m)),
      );
      // gemini.ts throws user-safe messages (rate-limit, unavailable) —
      // show them instead of a generic line so the user knows what to do.
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text:
          e instanceof Error
            ? e.message
            : "Sorry, I couldn't process that request. Please try again.",
        time: getTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    await sendMessage(text);
  };

  const showNudge = !loading && messages.length > 1 && !nudgeDismissed;

  const chatContent = (
    <>
      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.role === "user"
                ? styles.messageRowUser
                : styles.messageRowAssistant,
            ]}
          >
            {msg.role === "assistant" && (
              <View style={styles.assistantAvatar}>
                <Ionicons name="bulb" size={12} color={colors.primaryBlue} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === "user"
                  ? styles.bubbleUser
                  : styles.bubbleAssistant,
              ]}
            >
              {msg.role === "user" ? (
                <Text style={[styles.bubbleText, styles.bubbleTextUser]}>
                  {msg.text}
                </Text>
              ) : (
                <MarkdownText
                  text={msg.text}
                  color={colors.darkText}
                  fontSize={14}
                />
              )}
              <View style={styles.bubbleFooter}>
                <Text
                  style={[
                    styles.bubbleTime,
                    msg.role === "user"
                      ? styles.bubbleTimeUser
                      : styles.bubbleTimeAssistant,
                  ]}
                >
                  {msg.time}
                </Text>
                {msg.failed && !loading && (
                  <TouchableOpacity
                    style={styles.retryInline}
                    onPress={() => sendMessage(msg.text)}
                    accessibilityLabel="Retry sending message"
                    accessibilityRole="button"
                  >
                    <Ionicons name="refresh" size={12} color={colors.red} />
                    <Text style={styles.retryInlineText}>Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.messageRow, styles.messageRowAssistant]}>
            <View style={styles.assistantAvatar}>
              <Ionicons name="bulb" size={12} color={colors.primaryBlue} />
            </View>
            <View style={[styles.bubble, styles.bubbleAssistant]}>
              <TypingDots />
            </View>
          </View>
        )}

        {showNudge && (
          <View style={styles.suggestionRow}>
            <View style={styles.suggestionCard}>
              <TouchableOpacity
                style={styles.nudgeClose}
                onPress={() => setNudgeDismissed(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Dismiss trip planner suggestion"
              >
                <Ionicons name="close" size={13} color={colors.gray} />
              </TouchableOpacity>
              <Ionicons
                name="map-outline"
                size={16}
                color={colors.primaryBlue}
              />
              <Text style={styles.suggestionText}>
                Want a full dive itinerary?
              </Text>
              <TouchableOpacity
                style={styles.suggestionBtn}
                onPress={() => router.push("/dive-assistant/planner")}
                accessibilityLabel="Go to dive plan generator"
                accessibilityRole="button"
              >
                <Text style={styles.suggestionBtnText}>Plan Your Trip</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick prompts (empty state) */}
      {!loading && messages.length <= 1 && (
        <View style={styles.chipsRow}>
          {QUICK_PROMPTS.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.chip}
              onPress={() => sendMessage(q)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Ask: ${q}`}
            >
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Composer */}
      <View style={styles.composer}>
        <TextInput
          style={styles.composerInput}
          placeholder="Write a message"
          placeholderTextColor={colors.gray}
          value={input}
          onChangeText={setInput}
          editable={!loading}
          multiline
          maxLength={1000}
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!input.trim() || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!input.trim() || loading}
        >
          <Ionicons
            name="send"
            size={16}
            color={input.trim() && !loading ? colors.white : colors.gray}
          />
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => push("/dive-assistant")}
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SINSAY AI</Text>
          <Text style={styles.headerSubtitle}>Dive Assistant</Text>
        </View>
        <TouchableOpacity
          style={styles.planPill}
          onPress={() => router.push("/dive-assistant/planner")}
        >
          <Text style={styles.planPillText}>Plan Your Trip</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.livechatLabel}>Livechat</Text>

      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <ContentContainer
            maxWidth={720}
            paddingH={0}
            style={styles.flexInner}
          >
            {chatContent}
          </ContentContainer>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.flex}>
          <ContentContainer
            maxWidth={720}
            paddingH={0}
            style={styles.flexInner}
          >
            {chatContent}
          </ContentContainer>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Single bottom offset clearing the floating BottomNav (was doubled on
  // both flex + flexInner, squeezing the message list).
  flex: {
    flex: 1,
    paddingBottom: 100,
  },
  flexInner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.darkText,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.gray,
  },
  planPill: {
    borderRadius: 100,
    backgroundColor: colors.primaryBlue,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  planPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
  },
  livechatLabel: {
    fontSize: 11,
    color: colors.gray,
    textAlign: "center",
    marginBottom: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
    maxWidth: "85%",
  },
  messageRowUser: {
    alignSelf: "flex-end",
  },
  messageRowAssistant: {
    alignSelf: "flex-start",
  },
  assistantAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#EBF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexShrink: 1,
  },
  bubbleUser: {
    backgroundColor: colors.primaryBlue,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#F0F4FF",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: colors.white,
  },
  bubbleTime: {
    fontSize: 9,
    marginTop: 6,
    textAlign: "right",
  },
  bubbleTimeUser: {
    color: "rgba(255,255,255,0.7)",
  },
  bubbleTimeAssistant: {
    color: colors.gray,
  },
  typingRow: {
    flexDirection: "row",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
  },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 6,
  },
  retryInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  retryInlineText: {
    fontSize: 11,
    color: colors.red,
    fontWeight: "600",
  },
  suggestionRow: {
    alignItems: "center",
    marginVertical: 12,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF2FF",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    maxWidth: "90%",
  },
  nudgeClose: {
    padding: 4,
    marginLeft: -4,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.darkText,
    flex: 1,
  },
  suggestionBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 100,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  suggestionBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryBlue,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grayLight,
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.darkText,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.grayLight,
  },
});
