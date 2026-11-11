import { Stack, useRouter } from "expo-router";
import React from "react";
import EcoOnboarding from "../components/EcoOnboarding";
import { safeBack } from "../lib/navigation";
import { useAuth } from "../hooks/useAuth";
import { markUserOnboardingCompleted } from "../lib/onboarding";

export default function Next3Page() {
  const router = useRouter();
  const { user, isOperator, viewAsTourist } = useAuth();

  const handleFinish = async () => {
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
        illustration={require("../../assets/onboarding/maintain-control transparent.png")}
        illustrationAlt="Illustration for maintaining control underwater"
        title={"Maintain\nControl"}
        description={
          "Master your neutral buoyancy. Keep gauges clipped and never ground your fins on silt beds or fragile reefs."
        }
        index={2}
        wave="control"
        onBack={() => safeBack(router, "/next2")}
        onFinish={handleFinish}
      />
    </>
  );
}
