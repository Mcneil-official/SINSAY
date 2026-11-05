import { Stack, useRouter } from "expo-router";
import React from "react";
import EcoOnboarding from "../components/EcoOnboarding";
import { safeBack } from "../lib/navigation";

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
        onNext={() => router.push("/next3")}
        onBack={() => safeBack(router, "/next")}
        onSkip={() => router.replace("/(tabs)")}
      />
    </>
  );
}
