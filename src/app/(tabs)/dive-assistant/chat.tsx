import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { push } from "expo-router/build/global-state/router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AssistantChatPanel, ContentContainer } from "../../../components";
import { colors } from "../../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ initialQuery?: string }>();

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
        <KeyboardAvoidingView style={[styles.flex, { paddingBottom: Math.max(insets.bottom, 8) }]} behavior="padding">
          <ContentContainer
            maxWidth={720}
            paddingH={0}
            style={styles.flexInner}
          >
            <AssistantChatPanel
              variant="screen"
              initialMessage={params.initialQuery}
            />
          </ContentContainer>
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.flex, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <ContentContainer
            maxWidth={720}
            paddingH={0}
            style={styles.flexInner}
          >
            <AssistantChatPanel
              variant="screen"
              initialMessage={params.initialQuery}
            />
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
  // Docked BottomNav reserves its own height in layout flow; only a small
  // bottom breathing room is needed below the composer.
  flex: {
    flex: 1,
    paddingBottom: 8,
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
});
