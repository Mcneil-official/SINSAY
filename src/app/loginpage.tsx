import { Image } from "expo-image";
import { Stack, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { CheckCircle, Eye, EyeSlash, WarningCircle } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthLayout } from "../components";
import AuthFooter from "../components/AuthFooter";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import {
  isGoogleGisConfigured,
  mountGoogleOverlayButton,
} from "../lib/googleAuth";
import {
  clearFirstTimeTutorialPending,
  isFirstTimeTutorialPending,
  markFirstTimeTutorialPending,
} from "../lib/onboarding";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { checkPasswordRules, validatePasswordForSignup } from "../lib/password";

type AuthMode = "login" | "signup";

function isDuplicateEmailError(message: string): boolean {
  return /already\s+(?:been\s+)?registered|already\s+(?:in use|exists|taken)|email_exists/i.test(
    message
  );
}

function isInvalidLoginCredentialsError(message: string): boolean {
  return /invalid\s+login\s+credentials|invalid\s+email\s+or\s+password|user\s+not\s+found|no\s+account/i.test(
    message
  );
}

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{
    error?: string;
    mode?: string;
    reset?: string;
  }>();
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGoogleIdToken,
    requestPasswordReset,
    user,
    profile,
    isOperator,
    viewAsTourist,
    isLoading,
    roleReady,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(() =>
    params.mode === "signup" ? "signup" : "login"
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRules = checkPasswordRules(password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(() =>
    typeof params.error === "string" ? params.error : ""
  );
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [focusedField, setFocusedField] = useState<
    "fullName" | "email" | "password" | null
  >(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [fade] = useState(() => new Animated.Value(1));
  const switching = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const googleOverlayRef = useRef<View>(null);

  // Already signed in (e.g. after GIS ID token sign-in or back-nav after OAuth): route by role.
  useEffect(() => {
    if (pathname !== "/loginpage" && pathname !== "/signup") return;
    if (loading || googleLoading || isLoading || !roleReady || !user) return;
    if (
      mode === "signup" ||
      isFirstTimeTutorialPending(user.id) ||
      (profile && profile.onboarding_completed === false)
    ) {
      router.replace("/next");
      return;
    }
    if (router.canDismiss()) router.dismissAll();
    router.replace(isOperator && !viewAsTourist ? "/(operator-tabs)" : "/(tabs)");
  }, [
    pathname,
    loading,
    googleLoading,
    isLoading,
    roleReady,
    user,
    profile,
    mode,
    isOperator,
    viewAsTourist,
    router,
  ]);

  useEffect(() => {
    if (!isGoogleGisConfigured || !isSupabaseConfigured) return;
    const node = googleOverlayRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.appendChild !== "function") return;

    void mountGoogleOverlayButton(node, async (result) => {
      if (result.cancelled) return;
      if (result.error) {
        setGoogleLoading(false);
        setError(result.error);
        return;
      }
      if (!result.idToken) return;
      setGoogleLoading(true);
      setError("");
      const { error: authError } = await signInWithGoogleIdToken(
        result.idToken,
        result.rawNonce
      );
      setGoogleLoading(false);
      if (authError) {
        setError(authError);
      }
    });
  }, [signInWithGoogleIdToken]);

  const isSignup = mode === "signup";

  function switchMode(next: AuthMode) {
    if (next === mode || switching.current || resetLoading) return;
    switching.current = true;
    setError("");
    setSuccess(false);
    setShowPassword(false);
    setFieldErrors({});
    setResetSent(false);
    setResetEmail("");
    Animated.timing(fade, {
      toValue: 0,
      duration: 100,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) {
        switching.current = false;
        return;
      }
      setMode(next);
      router.setParams({ mode: next });
      Animated.timing(fade, {
        toValue: 1,
        duration: 160,
        useNativeDriver: false,
      }).start(() => {
        switching.current = false;
      });
    });
  }

  function clearFieldError(field: "fullName" | "email" | "password") {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError("");
  }

  async function handleForgotPassword() {
    if (loading || googleLoading || resetLoading) return;
    if (!isSupabaseConfigured) {
      setError("Backend not configured for this preview build.");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError("");
      setResetSent(false);
      setFieldErrors({ email: "Enter your email" });
      emailRef.current?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("");
      setResetSent(false);
      setFieldErrors({ email: "Enter a valid email" });
      emailRef.current?.focus();
      return;
    }
    setResetLoading(true);
    setError("");
    setResetSent(false);
    const { error: resetError } = await requestPasswordReset(trimmed);
    setResetLoading(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    setResetEmail(trimmed);
    setResetSent(true);
    setFieldErrors({});
  }

  function validate(): boolean {
    const next: {
      fullName?: string;
      email?: string;
      password?: string;
    } = {};
    if (isSignup && !fullName.trim()) {
      next.fullName = "Enter your full name";
    }
    if (!email.trim()) {
      next.email = "Enter your email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "Enter a valid email";
    }
    if (!password) {
      next.password = "Enter your password";
    } else if (isSignup) {
      const pwErr = validatePasswordForSignup(password);
      if (pwErr) next.password = pwErr;
    }
    setFieldErrors(next);
    return !next.fullName && !next.email && !next.password;
  }

  async function handleSubmit() {
    if (resetLoading) return;
    if (!isSupabaseConfigured) {
      setError("Backend not configured for this preview build.");
      return;
    }
    if (!validate()) {
      setError("");
      return;
    }
    setError("");
    if (mode === "login") {
      setLoading(true);
      const { error: authError, isOperator: signedInOperator } = await signIn(
        email.trim(),
        password
      );
      setLoading(false);
      if (authError) {
        if (isInvalidLoginCredentialsError(authError)) {
          const friendlyMsg =
            "No account found with this email, or incorrect password. Tap Sign Up if you're new.";
          setError(friendlyMsg);
          setFieldErrors((prev) => ({
            ...prev,
            email: "Account not found or wrong password",
          }));
          showToast(
            "Account not found or incorrect password. New to SINSAY? Please Sign Up first.",
            {
              tone: "error",
              duration: 5000,
              action: {
                label: "Sign Up",
                onPress: () => switchMode("signup"),
              },
            }
          );
        } else {
          setError(authError);
          showToast(authError, { tone: "error", duration: 4500 });
        }
        return;
      }
      const {
        data: { session: loginSession },
      } = await supabase.auth.getSession();
      if (loginSession?.user?.id) {
        clearFirstTimeTutorialPending(loginSession.user.id);
      }
      router.replace(signedInOperator ? "/(operator-tabs)" : "/(tabs)");
      return;
    }
    setLoading(true);
    const { error: authError } = await signUp(
      email.trim(),
      password,
      fullName.trim()
    );
    setLoading(false);
    if (authError) {
      if (isDuplicateEmailError(authError)) {
        setFieldErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists",
        }));
        return;
      }
      setError(authError);
      return;
    }
    // Email confirmation is off: signUp returns a live session, so go
    // straight home. If no session exists (confirmation still required),
    // fall back to telling the user to confirm via email first.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      markFirstTimeTutorialPending(session.user.id);
      // New accounts must complete onboarding (/next) before reaching home
      router.replace("/next");
      return;
    }
    setSuccess(true);
  }

  async function handleGoogle() {
    if (resetLoading) return;
    if (!isSupabaseConfigured) {
      setError("Backend not configured for this preview build.");
      return;
    }
    setGoogleLoading(true);
    setError("");
    // Web PWA: redirects to Google; on return the session restores via
    // onAuthStateChange and the gates route by role. This only resolves
    // when the redirect can't start (e.g. provider not enabled).
    const { error: authError } = await signInWithGoogle();
    setGoogleLoading(false);
    if (authError) {
      setError(authError);
    }
  }

  function renderFieldLabel(
    label: string,
    field: "fullName" | "email" | "password"
  ) {
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
      <AuthLayout activeTab={mode} onTabPress={switchMode}>
        <Animated.View style={{ opacity: fade }}>
          <View style={[styles.form, isSignup && styles.formCompact]}>
            {isSignup && (
              <View style={[styles.field, styles.fieldCompact]}>
                {renderFieldLabel("Full Name", "fullName")}
                <TextInput
                  style={[
                    styles.input,
                    focusedField === "fullName" && styles.inputFocused,
                    fieldErrors.fullName && styles.inputError,
                  ]}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    clearFieldError("fullName");
                  }}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Juan Dela Cruz"
                  placeholderTextColor="#9b9b9b"
                  keyboardType="default"
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            )}

            <View style={[styles.field, isSignup && styles.fieldCompact]}>
              {renderFieldLabel("Email", "email")}
              <TextInput
                ref={emailRef}
                style={[
                  styles.input,
                  focusedField === "email" && styles.inputFocused,
                  fieldErrors.email && styles.inputError,
                ]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearFieldError("email");
                  setResetSent(false);
                  setResetEmail("");
                }}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                autoFocus={params.reset === "1"}
                placeholder="juandelacruz@gmail.com"
                placeholderTextColor="#9b9b9b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={[styles.field, isSignup && styles.fieldCompact]}>
              {renderFieldLabel(
                isSignup ? "Set Password" : "Password",
                "password"
              )}
              <View
                style={[
                  styles.passwordRow,
                  focusedField === "password" && styles.passwordRowFocused,
                  fieldErrors.password && styles.passwordRowError,
                ]}
              >
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    clearFieldError("password");
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  placeholderTextColor="#9b9b9b"
                  secureTextEntry={!showPassword}
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeSlash size={20} color="#1f1a17" />
                  ) : (
                    <Eye size={20} color="#1f1a17" />
                  )}
                </Pressable>
              </View>

              {isSignup && (
                <View style={styles.passwordRulesContainer}>
                  <View style={styles.passwordRulesHeader}>
                    <Text style={styles.passwordRulesHeaderText}>Requirements</Text>
                    <Text
                      style={[
                        styles.passwordRulesCounter,
                        passwordRules.isValid && styles.passwordRulesCounterComplete,
                      ]}
                    >
                      {[passwordRules.hasMinLength, passwordRules.hasUppercase, passwordRules.hasNumber].filter(Boolean).length}/3 Met
                    </Text>
                  </View>

                  <View style={styles.rulesList}>
                    {/* Rule 1: Min 8 chars */}
                    <View style={styles.ruleItem}>
                      {passwordRules.hasMinLength ? (
                        <CheckCircle size={13} color="#10B981" weight="fill" />
                      ) : (
                        <View style={styles.ruleDotUnmet} />
                      )}
                      <Text
                        style={[
                          styles.ruleText,
                          passwordRules.hasMinLength && styles.ruleTextMet,
                        ]}
                      >
                        At least 8 characters
                      </Text>
                    </View>

                    {/* Rule 2: 1 Capital letter */}
                    <View style={styles.ruleItem}>
                      {passwordRules.hasUppercase ? (
                        <CheckCircle size={13} color="#10B981" weight="fill" />
                      ) : (
                        <View style={styles.ruleDotUnmet} />
                      )}
                      <Text
                        style={[
                          styles.ruleText,
                          passwordRules.hasUppercase && styles.ruleTextMet,
                        ]}
                      >
                        At least 1 capital letter (A–Z)
                      </Text>
                    </View>

                    {/* Rule 3: 1 Number */}
                    <View style={styles.ruleItem}>
                      {passwordRules.hasNumber ? (
                        <CheckCircle size={13} color="#10B981" weight="fill" />
                      ) : (
                        <View style={styles.ruleDotUnmet} />
                      )}
                      <Text
                        style={[
                          styles.ruleText,
                          passwordRules.hasNumber && styles.ruleTextMet,
                        ]}
                      >
                        At least 1 number (0–9)
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {(error || !isSignup || resetSent || resetLoading) && (
              <View style={styles.actionRow}>
                <View style={styles.inlineErrorWrap}>
                  {resetLoading ? (
                    <>
                      <ActivityIndicator size="small" color="#176FF2" />
                      <Text style={styles.inlineInfo}>Sending reset link…</Text>
                    </>
                  ) : resetSent ? (
                    <>
                      <CheckCircle size={13} color="#10B981" weight="fill" />
                      <Text
                        style={styles.inlineSuccess}
                        numberOfLines={2}
                        accessibilityLiveRegion="polite"
                      >
                        Reset link sent to {resetEmail}.
                      </Text>
                    </>
                  ) : error ? (
                    <>
                      <WarningCircle size={13} color="#EF4444" weight="fill" />
                      <Text style={styles.inlineError} numberOfLines={2}>
                        {error}
                      </Text>
                    </>
                  ) : null}
                </View>
                {!isSignup ? (
                  <Pressable
                    onPress={handleForgotPassword}
                    disabled={resetLoading || loading || googleLoading}
                    hitSlop={8}
                    style={styles.forgotPressable}
                    accessibilityRole="link"
                    accessibilityState={{
                      disabled: resetLoading || loading || googleLoading,
                      busy: resetLoading,
                    }}
                  >
                    <Text
                      style={[
                        styles.forgotText,
                        (resetLoading || loading || googleLoading) &&
                          styles.forgotTextDisabled,
                      ]}
                    >
                      {resetLoading
                        ? "Sending…"
                        : resetSent
                          ? "Resend"
                          : "Forgot Password?"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {isSignup && success ? (
              <Text style={styles.successText}>
                Registration successful! Check your email to confirm your
                account, then log in.
              </Text>
            ) : null}

            <Pressable
              style={styles.button}
              onPress={handleSubmit}
              disabled={loading || resetLoading}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading || resetLoading }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignup ? "Register" : "Log In"}
                </Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialButtonWrap}>
              <Pressable
                style={[
                  styles.socialButton,
                  (googleLoading || loading || resetLoading) &&
                    styles.socialButtonDisabled,
                ]}
                onPress={handleGoogle}
                disabled={googleLoading || loading || resetLoading}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#1f1a17" />
                ) : (
                  <>
                    <Image
                      source={require("../../assets/images/search.png")}
                      style={styles.socialIcon}
                    />
                    <Text
                      style={[
                        styles.socialText,
                        (googleLoading || loading || resetLoading) &&
                          styles.socialTextDisabled,
                      ]}
                    >
                      Continue with Google
                    </Text>
                  </>
                )}
              </Pressable>
              {isGoogleGisConfigured &&
                isSupabaseConfigured &&
                !googleLoading &&
                !loading &&
                !resetLoading && (
                  <View
                    ref={googleOverlayRef}
                    style={styles.googleOverlay}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                )}
            </View>

            <AuthFooter
              mode={mode}
              compact={isSignup}
              onSwitch={() => switchMode(isSignup ? "login" : "signup")}
            />
          </View>
        </Animated.View>
      </AuthLayout>
    </>
  );
}

const styles = StyleSheet.create({
  form: { gap: 13 },
  formCompact: { gap: 8 },
  field: { gap: 5 },
  fieldCompact: { gap: 4 },
  label: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#5f554d",
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    minHeight: 18,
    marginTop: 6,
    marginBottom: 4,
  },
  inlineErrorWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  inlineError: {
    flex: 1,
    minWidth: 0,
    color: "#EF4444",
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
  },
  inlineInfo: {
    flex: 1,
    minWidth: 0,
    color: "#64748B",
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
  },
  inlineSuccess: {
    flex: 1,
    minWidth: 0,
    color: "#059669",
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
  },
  forgotPressable: { flexShrink: 0 },
  forgotText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#176FF2",
  },
  forgotTextDisabled: {
    color: "#94A3B8",
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: -2,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e3ded5" },
  dividerText: {
    fontSize: 12,
    fontFamily: "Quicksand_400Regular",
    color: "#9b9b9b",
  },
  socialButtonWrap: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e3ded5",
    borderRadius: 14,
    height: 38,
    backgroundColor: "#ffffff",
  },
  googleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  socialButtonDisabled: { opacity: 0.5 },
  socialIcon: { width: 20, height: 20 },
  socialText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#1f1a17",
  },
  socialTextDisabled: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#9b9b9b",
  },
  successText: {
    color: "#10B981",
    fontSize: 13,
    fontFamily: "Quicksand_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  passwordRulesContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  passwordRulesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  passwordRulesHeaderText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  passwordRulesCounter: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#94A3B8",
  },
  passwordRulesCounterComplete: {
    color: "#10B981",
  },
  rulesList: {
    gap: 4,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  ruleDotUnmet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    marginLeft: 3.5,
    marginRight: 3.5,
  },
  ruleText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  ruleTextMet: {
    color: "#059669",
    fontFamily: "Quicksand_700Bold",
  },
});
