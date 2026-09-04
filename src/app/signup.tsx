import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { Eye, EyeSlash } from "phosphor-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLayout } from "../context/LayoutContext";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { isTablet, isDesktop } = useLayout();
  const isWide = isTablet || isDesktop;
  const activeTab = "signup" as "login" | "signup"; // reflects this screen; navigation happens via router
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
    setSuccess(true);
  }

  return (
    <ImageBackground
      source={require("../../assets/images/1.png")}
      style={[styles.container, isWide && styles.containerWide]}
    >
      <View style={styles.content}>
        <Stack.Screen options={{ headerShown: false }} />
        <Pressable
          onPress={() => router.push("/next5")}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.subtitle}>Tara, Sinsay na sa Mabini!</Text>

        <View style={styles.tabRow}>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.replace("/loginpage")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "login" && styles.tabTextActive,
              ]}
            >
              Log In
            </Text>
            {activeTab === "login" && <View style={styles.tabUnderline} />}
          </Pressable>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.replace("/signup")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "signup" && styles.tabTextActive,
              ]}
            >
              Sign Up
            </Text>
            {activeTab === "signup" && <View style={styles.tabUnderline} />}
          </Pressable>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.oval, isWide && styles.ovalWide]}
      />

      <View style={styles.footer}>
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={[
            styles.bottomSection,
            isWide && styles.bottomSectionWide,
          ]}
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

          {error && <Text style={styles.errorText}>{error}</Text>}

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
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 50,
    paddingBottom: 32,
    backgroundColor: "#f7f3ea",
  },
  containerWide: {
    justifyContent: "center",
  },
  content: {
    gap: 0,
  },
  backButton: {
    padding: 0,
  },
  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: "#1f1a17",
    fontWeight: "400",
    left: -32,
    top: -6,
  },
  logo: {
    width: 250,
    height: 60,
  },
  oval: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "76%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    elevation: 8,
  },
  ovalWide: {
    left: "50%",
    right: "auto",
    bottom: 40,
    top: 40,
    width: 480,
    marginLeft: -240,
    borderRadius: 40,
    height: "auto",
  },
  bottomSection: {
    width: "100%",
    gap: 12,
  },
  bottomSectionWide: {
    width: 420,
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#000000",
    textAlign: "center",
    fontWeight: "700",
    marginTop: -8,
  },
  tabRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 32,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  tabButton: {
    alignItems: "center",
    gap: 8,
    paddingBottom: 40,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#9b9b9b",
  },
  tabTextActive: {
    color: "#1f1a17",
  },
  tabUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: "#1f1a17",
    borderRadius: 1,
  },
  footer: {
    alignSelf: "stretch",
    gap: 10,
    zIndex: 1,
    flex: 1,
  },
  formScroll: {
    flex: 1,
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
  eyeIcon: {
    fontSize: 16,
  },
  forgotWrap: {
    alignSelf: "flex-end",
    marginTop: 6,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    color: "#176FF2",
    fontWeight: "500",
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
