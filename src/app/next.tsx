import { Stack, useRouter } from "expo-router";
import React from "react";
import EcoOnboarding from "../components/EcoOnboarding";

export default function NextPage() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EcoOnboarding
        illustration={require("../../assets/onboarding/marine-life.png")}
        illustrationAlt="A diver observing a sea turtle and fish underwater"
        title={"Respect\nMarine Life"}
        description={
          "Look, don't touch. Mabini enforces a strict no-touch and no-take policy for all corals and marine life under Municipal Ordinance No. 031-2023."
        }
        index={0}
        wave="marine-life"
        titleGap={8}
        illustrationOffsetY={52}
        onNext={() => router.push("/next2")}
        onSkip={() => router.replace("/(tabs)")}
      />
    </>
  );
}
