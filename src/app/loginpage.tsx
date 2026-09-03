import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Eye, EyeSlash } from "phosphor-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthLayout } from "../components";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    const { error: authError } = await signIn(email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthLayout activeTab="login">
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
          <Text style={styles.label}>Password</Text>
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

        <Pressable
          onPress={() =>
            Alert.alert(
              "Password Reset Coming Soon",
              "This feature isn't available yet. Contact tourism@sinsay.gov.ph for help accessing your account.",
            )
          }
          style={styles.forgotWrap}
        >
          <Text style={styles.forgotText}>Forgot Password ?</Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={[styles.socialButton, styles.socialButtonDisabled]}>
          <Image
            source={require("../../assets/images/search.png")}
            style={styles.socialIcon}
          />
          <Text style={styles.socialTextDisabled}>
            Continue with Google (coming soon)
          </Text>
        </View>

        <View style={[styles.socialButton, styles.socialButtonDisabled]}>
          <Image
            source={require("../../assets/images/facebook.png")}
            style={styles.socialIcon}
          />
          <Text style={styles.socialTextDisabled}>
            Continue with Facebook (coming soon)
          </Text>
        </View>
      </AuthLayout>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, color: "#5f554d" },
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
  forgotWrap: { alignSelf: "flex-end", marginTop: 6, marginBottom: 4 },
  forgotText: { fontSize: 13, color: "#176FF2", fontWeight: "500" },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 6,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e3ded5" },
  dividerText: { fontSize: 13, color: "#9b9b9b" },
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
  socialButtonDisabled: { opacity: 0.5 },
  socialIcon: { width: 20, height: 20 },
  socialTextDisabled: { fontSize: 13, fontWeight: "600", color: "#9b9b9b" },
  errorText: { color: "#EF4444", fontSize: 13, textAlign: "center" },
});
