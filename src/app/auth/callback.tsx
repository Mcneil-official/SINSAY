import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { isSupabaseConfigured } from "../../lib/supabase";

// OAuth landing: Supabase redirects here after Google sign-in (see
// signInWithGoogle). Shows a spinner until the session + role data settle,
// then routes by role. Kept separate from the splash so cold-start
// onboarding behavior is unchanged.
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ error?: string; error_description?: string }>();
  const { user, profile, operatorApplication, isOperator, isLoading, roleReady, refreshProfile } = useAuth();
  const navigated = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const oauthError =
    (typeof params.error === "string" ? params.error : Array.isArray(params.error) ? params.error[0] : undefined) ??
    null;
  const oauthErrorDescription =
    (typeof params.error_description === "string"
      ? params.error_description
      : Array.isArray(params.error_description)
        ? params.error_description[0]
        : undefined) ?? null;

  useEffect(() => {
    if (navigated.current) return;
    // Explicit provider/consent errors: surface them, never silently bounce.
    if (oauthError) return;
    if (isLoading || !roleReady || !user) return;
    const roleSettled = profile !== null || operatorApplication !== null;
    if (roleSettled) {
      navigated.current = true;
      router.replace(isOperator ? "/(operator-tabs)" : "/(tabs)");
      return;
    }
    const t = setTimeout(() => {
      setTimedOut(true);
    }, 8000);
    return () => clearTimeout(t);
  }, [isLoading, roleReady, user, profile, operatorApplication, isOperator, oauthError, router]);

  if (!isSupabaseConfigured) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.root}>
          <Text style={styles.title}>Backend not configured</Text>
          <Text style={styles.sub}>Missing EXPO_PUBLIC_SUPABASE_URL / ANON_KEY for this preview build.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/loginpage")}>
            <Text style={styles.btnText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (oauthError) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.root}>
          <Text style={styles.title}>Sign-in failed</Text>
          <Text style={styles.sub}>
            {oauthErrorDescription
              ? decodeURIComponent(oauthErrorDescription.replace(/\+/g, " "))
              : oauthError === "access_denied"
                ? "Google sign-in was cancelled."
                : "The provider returned an error. Please try again."}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace("/loginpage")}>
            <Text style={styles.btnText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  if (timedOut && !navigated.current) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.root}>
          <Text style={styles.title}>Taking longer than expected</Text>
          <Text style={styles.sub}>Your session is ready but role data hasn&apos;t loaded yet.</Text>
          <TouchableOpacity
            style={styles.btn}
            disabled={retrying}
            onPress={async () => {
              setRetrying(true);
              try {
                await refreshProfile();
              } finally {
                setRetrying(false);
              }
            }}
          >
            {retrying ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.btnText}>Retry</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => {
              navigated.current = true;
              router.replace("/(tabs)");
            }}
          >
            <Text style={styles.ghostText}>Continue as tourist</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

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
    paddingHorizontal: 32,
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0F172A", textAlign: "center" },
  sub: { fontSize: 13, color: "#64748B", textAlign: "center", lineHeight: 19 },
  btn: {
    marginTop: 8,
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 15, fontWeight: "700", color: colors.white },
  ghostBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  ghostText: { fontSize: 14, fontWeight: "600", color: colors.primaryBlue },
});
