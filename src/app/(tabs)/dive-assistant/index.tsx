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
  View,
} from "react-native";
import { Button } from "../../../components/Button";
import ContentContainer from "../../../components/ContentContainer";
import { colors } from "../../../constants/colors";

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
    paddingTop: 48,
    paddingBottom: 120,
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
});
