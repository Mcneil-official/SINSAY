import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Eye, EyeSlash } from "phosphor-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthLayout } from "../components";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    const { error: authError } = await signUp(email, password, fullName);
    setLoading(false);
    if (authError) {
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
      router.replace("/(tabs)");
      return;
    }
    setSuccess(true);
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthLayout activeTab="signup">
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Juan Dela Cruz"
              placeholderTextColor="#9b9b9b"
              keyboardType="default"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="juandelacruz@gmail.com"
              placeholderTextColor="#9b9b9b"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Set Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9b9b9b"
                secureTextEntry={!showPassword}
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
          </View>

          {success && (
            <Text style={styles.successText}>
              Registration successful! Check your email to confirm your account,
              then log in.
            </Text>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={styles.socialButton} onPress={() => {}}>
            <Image
              source={require("../../assets/images/search.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>Continue with Google</Text>
          </Pressable>

          <Pressable style={styles.socialButton} onPress={() => {}}>
            <Image
              source={require("../../assets/images/facebook.png")}
              style={styles.socialIcon}
            />
            <Text style={styles.socialText}>Continue with Facebook</Text>
          </Pressable>
        </ScrollView>
      </AuthLayout>
    </>
  );
}

const styles = StyleSheet.create({
  formScroll: {
    flex: 1,
  },
  formContent: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: "#5f554d",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3ded5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f1a17",
    backgroundColor: "#ffffff",
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
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1f1a17",
  },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e3ded5",
  },
  dividerText: {
    fontSize: 13,
    color: "#9b9b9b",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e3ded5",
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: "#ffffff",
  },
  socialIcon: {
    width: 20,
    height: 20,
  },
  socialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f1a17",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },
  successText: {
    color: "#10B981",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
