import { Stack, useRouter } from "expo-router";
import React from "react";
import EcoOnboarding from "../components/EcoOnboarding";
import { safeBack } from "../lib/navigation";

export default function Next3Page() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EcoOnboarding
        illustration={require("../../assets/onboarding/maintain-control.png")}
        illustrationAlt="Illustration for maintaining control underwater"
        title={"Maintain\nControl"}
        description={
          "Master your neutral buoyancy. Keep gauges clipped and never ground your fins on silt beds or fragile reefs."
        }
        index={2}
        wave="control"
        titleGap={8}
        illustrationAspect={960 / 1280}
        onBack={() => safeBack(router, "/next2")}
        onFinish={() => router.replace("/(tabs)")}
      />
    </>
  );
}
