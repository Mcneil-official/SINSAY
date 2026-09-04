import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnboardingCard } from "../components/OnboardingCard";

export default function Next2Page() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCard
        heroImage={require("../../assets/images/3.png")}
        onBack={() => router.push("/next")}
        progressActive={1}
        footer={
          <View style={styles.bottomArea}>
            <Pressable
              style={styles.button}
              onPress={() => router.push("/next3")}
            >
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        }
        desktop={{
          title: "RESPECT\nMARINE LIFE",
          intro: "Look, don't touch.",
          features: [
            {
              icon: "hand-left-outline",
              text: "Corals are alive — even a small touch can damage them.",
            },
            {
              icon: "paw-outline",
              text: "Feeding or disturbing marine life is not allowed.",
            },
          ],
          closing: "Violations may result in penalties.",
          ctaLabel: "Next",
          onCta: () => router.push("/next3"),
        }}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>RESPECT MARINE LIFE</Text>
          <Text style={styles.intro}>Look, don't touch.</Text>
          <Text style={styles.body}>
            Corals are alive — even a small touch can damage them.{"\n"}
            {"\n"}
            Feeding or disturbing marine life is not allowed.
          </Text>
          <Text style={styles.closing}>
            Violations may result in penalties.
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
