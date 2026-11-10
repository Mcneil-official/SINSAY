import { Stack, useRouter } from "expo-router";
import React from "react";
import EcoOnboarding from "../components/EcoOnboarding";
import { safeBack } from "../lib/navigation";
import { useAuth } from "../hooks/useAuth";
import { markUserOnboardingCompleted } from "../lib/onboarding";

export default function Next2Page() {
  const router = useRouter();
  const { user, isOperator, viewAsTourist } = useAuth();

  const handleSkip = async () => {
    if (user) {
      await markUserOnboardingCompleted(user.id);
    }
    router.replace(
      isOperator && !viewAsTourist ? "/(operator-tabs)" : "/(tabs)"
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EcoOnboarding
        illustration={require("../../assets/onboarding/protect-the-ocean transparent.png")}
        illustrationAlt="Illustration for protecting the ocean"
        title={"Protect the\nOcean"}
        description={
          "Keep the Verde Island Passage clean. Strictly no single-use plastics on dive boats and only use reef-safe sunscreen."
        }
        index={1}
        wave="protect"
        onNext={() => router.push("/next3")}
        onBack={() => safeBack(router, "/next")}
        onSkip={handleSkip}
      />
    </>
  );
}
