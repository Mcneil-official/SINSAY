import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AuthFooterProps {
  mode: "login" | "signup";
  compact?: boolean;
  onSwitch?: () => void;
}

export default function AuthFooter({ mode, compact, onSwitch }: AuthFooterProps) {
  const router = useRouter();
  const isLogin = mode === "login";

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Text style={styles.prompt}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Text
          style={styles.promptLink}
          onPress={
            onSwitch ??
            (() => router.replace(isLogin ? "/signup" : "/loginpage"))
          }
          accessibilityRole="link"
        >
          {isLogin ? "Sign Up" : "Log In"}
        </Text>
      </Text>

      <Text style={styles.disclaimer} numberOfLines={2}>
        By continuing, you agree to our{" "}
        <Text
          style={styles.termsLink}
          onPress={() => router.push("/terms")}
          accessibilityRole="link"
        >
          Terms
        </Text>{" "}
        and{" "}
        <Text
          style={styles.termsLink}
          onPress={() => router.push("/privacy")}
          accessibilityRole="link"
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 12,
  },
  containerCompact: {
    marginTop: 10,
  },
  prompt: {
    fontSize: 13,
    fontFamily: "Quicksand_400Regular",
    color: "#64748B",
    textAlign: "center",
  },
  promptLink: {
    fontFamily: "Quicksand_600SemiBold",
    color: "#176FF2",
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "Quicksand_400Regular",
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  termsLink: {
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
    textDecorationLine: "underline",
  },
});
