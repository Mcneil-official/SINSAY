import { Stack, useRouter } from "expo-router";
import React from "react";
import EcoOnboarding from "../components/EcoOnboarding";

export default function Next2Page() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EcoOnboarding
        illustration={require("../../assets/onboarding/protect-the-ocean.png")}
        illustrationAlt="Illustration for protecting the ocean"
        title={"Protect the\nOcean"}
        description={
          "Keep the Verde Island Passage clean. Strictly no single-use plastics on dive boats and only use reef-safe sunscreen."
        }
        index={1}
        wave="protect"
        titleGap={8}
        headerOffsetY={-10}
        illustrationAspect={960 / 1280}
        illustrationOffsetY={52}
        onNext={() => router.push("/next3")}
        onBack={() => router.back()}
        onSkip={() => router.replace("/(tabs)")}
      />
    </>
  );
}
