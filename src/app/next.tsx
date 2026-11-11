import { Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import EcoOnboarding from "../components/EcoOnboarding";
import { useAuth } from "../hooks/useAuth";
import { markUserOnboardingCompleted } from "../lib/onboarding";

export default function NextPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isOperator, viewAsTourist, isLoading, roleReady } =
    useAuth();

  // If user is already authenticated and has already completed onboarding, bounce directly to Home
  useEffect(() => {
    if (pathname !== "/next") return;
    if (isLoading || !roleReady || !user) return;
    if (profile?.onboarding_completed === true) {
      if (router.canDismiss()) router.dismissAll();
      router.replace(
        isOperator && !viewAsTourist ? "/(operator-tabs)" : "/(tabs)"
      );
    }
  }, [pathname, isLoading, roleReady, user, profile, isOperator, viewAsTourist, router]);

  const handleSkip = async () => {
    if (user) {
      await markUserOnboardingCompleted(user.id);
    }
    if (router.canDismiss()) router.dismissAll();
    router.replace(
      isOperator && !viewAsTourist ? "/(operator-tabs)" : "/(tabs)"
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <EcoOnboarding
        illustration={require("../../assets/onboarding/marine-life transparent.png")}
        nextIllustration={require("../../assets/onboarding/protect-the-ocean transparent.png")}
        illustrationAlt="A diver observing a sea turtle and fish underwater"
        title={"Respect\nMarine Life"}
        description={
          "Look, don't touch. Mabini enforces a strict no-touch and no-take policy for all corals and marine life under Municipal Ordinance No. 031-2023."
        }
        index={0}
        wave="marine-life"
        onNext={() => router.push("/next2")}
        onSkip={handleSkip}
      />
    </>
  );
}
