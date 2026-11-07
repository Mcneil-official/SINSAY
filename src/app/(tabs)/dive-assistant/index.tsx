import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../../components/Button";
import ContentContainer from "../../../components/ContentContainer";
import { colors } from "../../../constants/colors";
import { AI_TRIVIA_STARTERS } from "../../../constants/didYouKnowData";

export default function DiveAssistantScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <ContentContainer maxWidth={720}>
          {/* Mascot illustration */}
          <View style={styles.mascotWrap}>
            <View style={styles.mascotCircle}>
              <Image
                source={require("../../../../assets/robot.jpg")}
                style={styles.mascotImage}
              />
            </View>
            <View style={styles.bubbleLeft}>
              <View style={styles.bubbleDot} />
            </View>
            <View style={styles.bubbleRight}>
              <View style={styles.bubbleDot} />
            </View>
          </View>

          {/* Header */}
          <Text style={styles.title}>AI Dive Assistant</Text>
          <Text style={styles.subtitle}>
            Plan your perfect dive and get instant answers about Mabini.
          </Text>

          {/* Action buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="Ask AI Dive Questions"
              onPress={() => router.push("/dive-assistant/chat")}
              icon={
                <Ionicons
                  name="chatbubble-ellipses"
                  size={18}
                  color={colors.white}
                />
              }
            />
            <Text style={styles.buttonCaption}>
              Ask about dive sites, safety tips, or rules
            </Text>

            <View style={{ height: 16 }} />

            <Button
              title="Generate Dive Plan"
              onPress={() => router.push("/dive-assistant/planner")}
              variant="outline"
              icon={
                <Ionicons
                  name="map-outline"
                  size={18}
                  color={colors.primaryBlue}
                />
              }
            />
            <Text style={styles.buttonCaption}>
              Get a personalized dive itinerary
            </Text>
          </View>

          {/* Did You Know Starters */}
          <View style={styles.didYouKnowCard}>
            <Text style={styles.didYouKnowTitle}>Did you know?</Text>
            <Text style={styles.didYouKnowSub}>
              Tap a topic to explore Mabini with the AI dive assistant:
            </Text>
            <View style={styles.startersWrap}>
              {AI_TRIVIA_STARTERS.map((s) => (
                <TouchableOpacity
                  key={s.label}
                  style={styles.starterPill}
                  onPress={() =>
                    router.push({
                      pathname: "/dive-assistant/chat",
                      params: { initialQuery: s.query },
                    })
                  }
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={s.label}
                >
                  <Text style={styles.starterPillText}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
    alignItems: "center",
  },
  mascotWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    position: "relative",
  },
  mascotCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#EBF2FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  mascotImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: "cover",
  },
  bubbleLeft: {
    position: "absolute",
    bottom: 6,
    left: -10,
  },
  bubbleRight: {
    position: "absolute",
    top: 10,
    right: -10,
  },
  bubbleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#DBEAFE",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.darkText,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  buttonGroup: {
    width: "100%",
    marginTop: 40,
  },
  buttonCaption: {
    fontSize: 11,
    color: colors.gray,
    textAlign: "center",
    marginTop: 6,
  },
  didYouKnowCard: {
    width: "100%",
    marginTop: 36,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
  },
  didYouKnowTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "italic",
    color: colors.primaryBlue,
    marginBottom: 4,
  },
  didYouKnowSub: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
    lineHeight: 18,
  },
  startersWrap: {
    gap: 8,
  },
  starterPill: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  starterPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
    lineHeight: 17,
  },
});
