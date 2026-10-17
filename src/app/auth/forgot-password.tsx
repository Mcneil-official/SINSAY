import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ContentContainer } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail } from "../../lib/password";
import { isSupabaseConfigured } from "../../lib/supabase";

// Pre-auth + shell-less (see PRE_AUTH_PATHS in AppShell): email entry point
// of the password-reset flow. Sends the Supabase recovery link, which lands
// on /auth/reset-password (must be allowlisted in Supabase Auth → Redirects).
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!isSupabaseConfigured) {
      setError("Backend not configured for this preview build.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    // Always show the same success copy (even for unknown emails) so the
    // screen never reveals whether an address is registered.
    const { error: reqError } = await requestPasswordReset(email);
    setLoading(false);
    if (reqError) {
      setError(reqError);
      return;
    }
    setSent(true);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <ContentContainer maxWidth={480}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backRow}>
            <Text style={styles.backArrow}>‹</Text>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Forgot password?</Text>
          {sent ? (
            <>
              <Text style={styles.body}>
                If an account exists for {email.trim()}, a reset link is on its
                way. It expires in about an hour — check spam too.
              </Text>
              <Pressable style={styles.button} onPress={() => router.replace("/loginpage")}>
                <Text style={styles.buttonText}>Back to Log In</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.body}>
                Enter your registered email and we&apos;ll send you a link to
                set a new password.
              </Text>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (error) setError("");
                }}
                placeholder="juandelacruz@gmail.com"
                placeholderTextColor="#9b9b9b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable style={styles.button} onPress={handleSend} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </Pressable>
            </>
          )}
        </ContentContainer>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 24, paddingTop: 48 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 20 },
  backArrow: { fontSize: 22, color: "#16145A" },
  backLabel: { fontSize: 14, fontWeight: "600", color: "#16145A" },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  body: { fontSize: 14, color: "#475569", lineHeight: 21, marginBottom: 16 },
  label: { fontSize: 13, color: "#5f554d", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e3ded5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f1a17",
    backgroundColor: "#ffffff",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  errorText: { color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 8 },
});
