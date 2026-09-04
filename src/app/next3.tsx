import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnboardingCard } from "../components/OnboardingCard";

export default function Next3Page() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCard
        heroImage={require("../../assets/images/4.jpeg")}
        onBack={() => router.push("/next2")}
        progressActive={2}
        footer={
          <View style={styles.bottomArea}>
            <Pressable
              style={styles.button}
              onPress={() => router.push("/next4")}
            >
              <Text style={styles.buttonText}>Next</Text>
            </Pressable>
          </View>
        }
        desktop={{
          title: "PROTECT\nTHE OCEAN",
          intro: "What you bring, you take back",
          features: [
            {
              icon: "trash-outline",
              text: "No trash or waste disposal in the water",
            },
            { icon: "restaurant-outline", text: "Do not feed marine animals" },
            { icon: "sunny-outline", text: "Use reef-safe sunscreen" },
          ],
          closing: "You are part of the conservation.",
          ctaLabel: "Next",
          onCta: () => router.push("/next4"),
        }}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>PROTECT THE OCEAN</Text>
          <Text style={styles.intro}>What you bring, you take back</Text>
          <Text style={styles.body}>
            • No trash or waste disposal in the water{"\n"}• Do not feed marine
            animals{"\n"}• Use reef-safe sunscreen
          </Text>
          <Text style={styles.closing}>You are part of the conservation.</Text>
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
