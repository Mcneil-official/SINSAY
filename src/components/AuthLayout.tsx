import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useLayout } from "../context/LayoutContext";

interface AuthLayoutProps {
  activeTab: "login" | "signup";
  children: React.ReactNode;
}

export function AuthLayout({ activeTab, children }: AuthLayoutProps) {
  const router = useRouter();
  const { isTablet, isDesktop } = useLayout();
  const isWide = isTablet || isDesktop;

  return (
    <ImageBackground
      source={require("../../assets/images/1.png")}
      style={[styles.container, isWide && styles.containerWide]}
    >
      <View style={styles.content}>
        <Pressable
          onPress={() => router.push("/next5")}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.subtitle}>Tara, Sinsay na sa Mabini!</Text>

        <View style={styles.tabRow} accessibilityRole="tablist">
          <Pressable
            style={styles.tabButton}
            onPress={() => router.push("/loginpage")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "login" }}
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
            onPress={() => router.push("/signup")}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "signup" }}
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
        <View
          style={[styles.bottomSection, isWide && styles.bottomSectionWide]}
        >
          {children}
        </View>
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
  oval: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "83%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
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
  footer: {
    alignSelf: "stretch",
    gap: 10,
    zIndex: 1,
  },
  bottomSection: {
    width: "100%",
    gap: 12,
  },
  bottomSectionWide: {
    width: 420,
    alignSelf: "center",
  },
});
