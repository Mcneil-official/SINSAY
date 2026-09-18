import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";

// OAuth landing: Supabase redirects here after Google sign-in (see
// signInWithGoogle). Shows a spinner until the session + role data settle,
// then routes by role. Kept separate from the splash so cold-start
// onboarding behavior is unchanged.
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { user, profile, operatorApplication, isOperator, isLoading } = useAuth();
  const navigated = useRef(false);

  useEffect(() => {
    if (isLoading || !user || navigated.current) return;
    // Role data loads right after the session; waiting avoids flashing the
    // tourist home for operators. The timeout falls back to /(tabs) and
    // TouristGate finishes the job once the role resolves.
    const roleReady = profile !== null || operatorApplication !== null;
    if (roleReady) {
      navigated.current = true;
      router.replace(isOperator ? "/(operator-tabs)" : "/(tabs)");
      return;
    }
    const t = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      router.replace("/(tabs)");
    }, 5000);
    return () => clearTimeout(t);
  }, [isLoading, user, profile, operatorApplication, isOperator, router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
});
