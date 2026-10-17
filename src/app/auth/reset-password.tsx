import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Eye, EyeSlash } from "phosphor-react-native";
import { ContentContainer } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { validateNewPassword } from "../../lib/password";

// Pre-auth + shell-less (see PRE_AUTH_PATHS in AppShell). Landing target of
// the Supabase recovery email (resetPasswordForEmail redirectTo). Verifies
// the recovery session (PKCE ?code exchange + implicit #token fallback),
// then lets the user set a new password. Deliberately does NOT route by
// role: the recovery session exists only to set the password.
type Phase = "verifying" | "ready" | "invalid" | "done";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const { updatePassword, signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [problem, setProblem] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        // Provider-side error (expired link, already used, revoked).
        const errParam = typeof params.error === "string" ? params.error : undefined;
        if (errParam) {
          const desc =
            typeof params.error_description === "string"
              ? decodeURIComponent(params.error_description.replace(/\+/g, " "))
              : "This reset link is invalid or has expired.";
          setProblem(desc);
          setPhase("invalid");
          return;
        }
        // PKCE flow (?code): exchange explicitly so failures surface here
        // instead of silently landing unauthenticated.
        const code =
          typeof params.code === "string"
            ? params.code
            : typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("code")
              : null;
        if (code) {
          const { error: exError } = await supabase.auth.exchangeCodeForSession(code);
          if (exError) throw exError;
        }
        // Implicit flow (#access_token) is picked up by the client from the
        // URL fragment on init — just read the resulting session.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setProblem(
            "This reset link is invalid or has expired. Request a fresh one and open it on this device."
          );
          setPhase("invalid");
          return;
        }
        // Scrub the one-time code/token from the address bar.
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", window.location.pathname);
        }
        setPhase("ready");
      } catch (e) {
        setProblem(
          e instanceof Error ? e.message : "Couldn't verify this reset link."
        );
        setPhase("invalid");
      }
    })();
  }, [params.error, params.error_description, params.code]);

  async function handleSave() {
    const validation = validateNewPassword(password, confirm);
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError("");
    const { error: upError } = await updatePassword(password);
    setSaving(false);
    if (upError) {
      setError(upError);
      return;
    }
    // Recovery session has served its purpose: end it so the account is
    // only reachable with the new password from here on.
    await signOut();
    setPhase("done");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.root}>
        <ContentContainer maxWidth={480}>
          <Text style={styles.title}>Set a new password</Text>

          {phase === "verifying" && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#176FF2" />
              <Text style={styles.body}>Verifying your reset link…</Text>
            </View>
          )}

          {phase === "invalid" && (
            <>
              <Text style={styles.body}>{problem}</Text>
              <Pressable style={styles.button} onPress={() => router.replace("/auth/forgot-password")}>
                <Text style={styles.buttonText}>Request a New Link</Text>
              </Pressable>
              <Pressable style={styles.ghost} onPress={() => router.replace("/loginpage")}>
                <Text style={styles.ghostText}>Back to Log In</Text>
              </Pressable>
            </>
          )}

          {phase === "ready" && (
            <>
              <Text style={styles.body}>Choose a password with at least 8 characters.</Text>
              <Text style={styles.label}>New password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (error) setError("");
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#9b9b9b"
                  secureTextEntry={!showPw}
                  autoComplete="new-password"
                />
                <Pressable onPress={() => setShowPw((p) => !p)} hitSlop={8}>
                  {showPw ? <EyeSlash size={20} color="#1f1a17" /> : <Eye size={20} color="#1f1a17" />}
                </Pressable>
              </View>
              <Text style={[styles.label, { marginTop: 12 }]}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  if (error) setError("");
                }}
                placeholder="••••••••"
                placeholderTextColor="#9b9b9b"
                secureTextEntry={!showPw}
                autoComplete="new-password"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Pressable style={styles.button} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Save New Password</Text>
                )}
              </Pressable>
            </>
          )}

          {phase === "done" && (
            <>
              <Text style={styles.body}>
                Your password was updated. Log in with your new password to continue.
              </Text>
              <Pressable style={styles.button} onPress={() => router.replace("/loginpage")}>
                <Text style={styles.buttonText}>Back to Log In</Text>
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
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  body: { fontSize: 14, color: "#475569", lineHeight: 21, marginBottom: 16 },
  center: { alignItems: "center", gap: 12, marginTop: 32 },
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
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e3ded5",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: "#1f1a17" },
  button: {
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  ghost: { alignItems: "center", paddingVertical: 12, marginTop: 4 },
  ghostText: { fontSize: 14, fontWeight: "600", color: "#176FF2" },
  errorText: { color: "#EF4444", fontSize: 13, textAlign: "center", marginTop: 8 },
});
