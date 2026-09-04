import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnboardingCard } from "../components/OnboardingCard";

export default function Next4Page() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCard
        heroImage={require("../../assets/images/5.jpeg")}
        onBack={() => router.push("/next3")}
        progressActive={3}
        footer={
          <View style={styles.bottomArea}>
            <Pressable
              style={styles.button}
              onPress={() => router.push("/next5")}
            >
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        }
        desktop={{
          title: "MAINTAIN\nCONTROL",
          features: [
            {
              icon: "body-outline",
              text: "Maintain proper buoyancy at all times",
            },
            {
              icon: "footsteps-outline",
              text: "Avoid kicking or stirring the seabed",
            },
            { icon: "lock-closed-outline", text: "Secure loose equipment" },
          ],
          closing:
            "Uncontrolled movements can damage reefs and disturb marine life.",
          ctaLabel: "Next",
          onCta: () => router.push("/next5"),
        }}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>MAINTAIN CONTROL</Text>
          <Text style={styles.body}>
            • Maintain proper buoyancy at all times{"\n"}• Avoid kicking or
            stirring the seabed{"\n"}• Secure loose equipment
          </Text>
          <Text style={styles.closing}>
            Uncontrolled movements can damage reefs and disturb marine life.
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
    fontSize: 28,
    fontWeight: "700",
    color: "#0f304f",
    textAlign: "center",
    letterSpacing: 0.3,
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
