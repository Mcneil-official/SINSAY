import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnboardingCard } from "../components/OnboardingCard";

export default function NextPage() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCard
        heroImage={require("../../assets/images/2.jpeg")}
        onBack={() => router.push("/")}
        progressActive={0}
        totalSteps={5}
        desktop={{
          title: "WELCOME TO\nMABINI!",
          intro: "Before you dive, there's something important.",
          features: [
            {
              icon: "shield-checkmark-outline",
              text: "Mabini's waters are home to fragile marine life.",
            },
            {
              icon: "leaf-outline",
              text: "To protect it, all divers are required to follow these Eco-Dive Regulations.",
            },
          ],
          closing: "Let's keep our ocean alive — together.",
          closingHighlight: "ocean alive",
          ctaLabel: "Next",
          onCta: () => router.push("/next2"),
        }}
        footer={
          <View style={styles.bottomArea}>
            <Pressable
              style={styles.button}
              onPress={() => router.push("/next2")}
            >
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        }
      >
        <View style={styles.copy}>
          <Text style={styles.title}>WELCOME TO MABINI!</Text>
          <Text style={styles.intro}>
            Before you dive, there's something important.
          </Text>
          <Text style={styles.body}>
            Mabini's waters are home to fragile marine life.{"\n"}
            {"\n"}
            To protect it, all divers are required to follow these Eco-Dive
            Regulations.
          </Text>
          <Text style={styles.closing}>
            Let's keep our ocean alive — together.
          </Text>
        </View>
      </OnboardingCard>
    </>
  );
}

const styles = StyleSheet.create({
  copy: {
    gap: 12,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0f304f",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  intro: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#3a342e",
    textAlign: "center",
  },
  body: { fontSize: 15, lineHeight: 22, color: "#3a342e", textAlign: "center" },
  closing: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#3a342e",
    textAlign: "center",
  },
  bottomArea: { gap: 16 },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
