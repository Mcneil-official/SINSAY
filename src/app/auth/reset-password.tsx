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
import {
  CheckCircle,
  Eye,
  EyeSlash,
  WarningCircle,
} from "phosphor-react-native";
import { AuthLayout } from "../../components";
import { useScreenTransition } from "../../context/ScreenTransitionContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { validateNewPassword } from "../../lib/password";

// Landing target of the Supabase recovery email (resetPasswordForEmail
// redirectTo). Verifies the recovery session (PKCE ?code exchange + implicit
// #token fallback), then lets the user set a new password. Deliberately does
// NOT route by role: the recovery session exists only to set the password.
type Phase = "verifying" | "ready" | "invalid" | "done";
type ResetField = "password" | "confirm";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { runTransition } = useScreenTransition();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const { updatePassword, signOut } = useAuth();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [problem, setProblem] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [focusedField, setFocusedField] = useState<ResetField | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        // Provider-side error (expired link, already used, revoked).
        const errParam =
          typeof params.error === "string" ? params.error : undefined;
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
          const { error: exError } =
            await supabase.auth.exchangeCodeForSession(code);
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

  function clearFieldError(field: ResetField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError("");
  }

  async function handleSave() {
    if (saving) return;
    const validation = validateNewPassword(password, confirm);
    if (validation) {
      const field: ResetField = /confirm|match/i.test(validation)
        ? "confirm"
        : "password";
      setFieldErrors({ [field]: validation });
      setError("");
      return;
    }
    setSaving(true);
    setError("");
    setFieldErrors({});
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

  function goToLogin() {
    runTransition(() => router.replace("/loginpage"));
  }

  function requestNewLink() {
    runTransition(() =>
      router.replace({ pathname: "/loginpage", params: { reset: "1" } })
    );
  }

  function renderFieldLabel(label: string, field: ResetField) {
    const fieldError = fieldErrors[field];
    return (
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          {fieldError ? (
            <WarningCircle size={12} color="#EF4444" weight="fill" />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        {fieldError ? (
          <Text
            style={styles.fieldErrorText}
            numberOfLines={2}
            accessibilityLiveRegion="polite"
          >
            {fieldError}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthLayout showTabs={false}>
        <View style={styles.content}>
          {phase === "verifying" && (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#176FF2" />
              <Text style={styles.body}>Verifying your reset link…</Text>
            </View>
          )}

          {phase === "invalid" && (
            <>
              <Text style={styles.title}>Reset link invalid</Text>
              <Text style={styles.body}>{problem}</Text>
              <Pressable style={styles.button} onPress={requestNewLink}>
                <Text style={styles.buttonText}>Request a New Link</Text>
              </Pressable>
              <Pressable style={styles.ghost} onPress={goToLogin}>
                <Text style={styles.ghostText}>Back to Log In</Text>
              </Pressable>
            </>
          )}

          {phase === "ready" && (
            <>
              <Text style={styles.title}>Set a new password</Text>
              <Text style={styles.body}>
                Choose a password with at least 8 characters.
              </Text>

              <View style={styles.form}>
                <View style={styles.field}>
                  {renderFieldLabel("New password", "password")}
                  <View
                    style={[
                      styles.passwordRow,
                      focusedField === "password" &&
                        styles.passwordRowFocused,
                      fieldErrors.password && styles.passwordRowError,
                    ]}
                  >
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        clearFieldError("password");
                      }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      placeholderTextColor="#9b9b9b"
                      secureTextEntry={!showPw}
                      autoComplete="new-password"
                    />
                    <Pressable
                      onPress={() => setShowPw((p) => !p)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPw ? "Hide password" : "Show password"
                      }
                    >
                      {showPw ? (
                        <EyeSlash size={20} color="#1f1a17" />
                      ) : (
                        <Eye size={20} color="#1f1a17" />
                      )}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.field}>
                  {renderFieldLabel("Confirm password", "confirm")}
                  <TextInput
                    style={[
                      styles.input,
                      focusedField === "confirm" && styles.inputFocused,
                      fieldErrors.confirm && styles.inputError,
                    ]}
                    value={confirm}
                    onChangeText={(v) => {
                      setConfirm(v);
                      clearFieldError("confirm");
                    }}
                    onFocus={() => setFocusedField("confirm")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    placeholderTextColor="#9b9b9b"
                    secureTextEntry={!showPw}
                    autoComplete="new-password"
                  />
                </View>

                {error ? (
                  <View style={styles.inlineErrorWrap}>
                    <WarningCircle size={13} color="#EF4444" weight="fill" />
                    <Text style={styles.inlineError} numberOfLines={2}>
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={styles.button}
                  onPress={handleSave}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: saving }}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>Save New Password</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {phase === "done" && (
            <View style={styles.done}>
              <CheckCircle size={40} color="#10B981" weight="fill" />
              <Text style={[styles.title, styles.centerText]}>
                Password updated
              </Text>
              <Text style={[styles.body, styles.centerText]}>
                Your password was updated. Log in with your new password to
                continue.
              </Text>
              <Pressable
                style={styles.button}
                onPress={goToLogin}
                accessibilityRole="button"
              >
                <Text style={styles.buttonText}>Back to Log In</Text>
              </Pressable>
            </View>
          )}
        </View>
      </AuthLayout>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingTop: 4,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: "Quicksand_700Bold",
    color: "#111827",
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  center: {
    alignItems: "center",
    gap: 12,
    paddingTop: 28,
  },
  form: {
    gap: 9,
    marginTop: 2,
  },
  field: {
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#5f554d",
  },
  fieldErrorText: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    fontSize: 11,
    lineHeight: 14,
    fontFamily: "Quicksand_500Medium",
    color: "#EF4444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3ded5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#111827",
    backgroundColor: "#ffffff",
    outlineStyle: "none" as any,
  },
  inputFocused: {
    borderColor: "#005AF1",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
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
  passwordRowFocused: {
    borderColor: "#005AF1",
  },
  passwordRowError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#111827",
    outlineStyle: "none" as any,
  },
  inlineErrorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 18,
    marginTop: 2,
  },
  inlineError: {
    flex: 1,
    minWidth: 0,
    color: "#EF4444",
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
  },
  button: {
    alignSelf: "stretch",
    height: 38,
    backgroundColor: "#176FF2",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Quicksand_600SemiBold",
  },
  ghost: {
    alignItems: "center",
    paddingVertical: 8,
  },
  ghostText: {
    fontSize: 13,
    fontFamily: "Quicksand_600SemiBold",
    color: "#176FF2",
  },
  done: {
    alignItems: "center",
    gap: 10,
    paddingTop: 16,
  },
  centerText: {
    textAlign: "center",
  },
});
