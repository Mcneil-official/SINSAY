import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLayout } from "../context/LayoutContext";
import WaveDivider from "./WaveDivider";

interface AuthLayoutProps {
  activeTab: "login" | "signup";
  children: React.ReactNode;
}

export function AuthLayout({ activeTab, children }: AuthLayoutProps) {
  const router = useRouter();
  const { isTablet, isDesktop } = useLayout();
  const isWide = isTablet || isDesktop;

  const tabRow = (
    <View style={styles.tabRow} accessibilityRole="tablist">
      <Pressable
        style={styles.tabButton}
        onPress={() => router.replace("/loginpage")}
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
        onPress={() => router.replace("/signup")}
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
  );

  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        <View style={styles.wideCard}>
          <View style={styles.wideLeft}>
            <WaveDivider width={84} />
            <View style={styles.wideHeaderRow}>
              <Pressable
                onPress={() => router.push("/next5")}
                hitSlop={12}
                style={styles.wideBackRow}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={18} color="#0F172A" />
                <Text style={styles.wideBackLabel}>Back</Text>
              </Pressable>

              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.wideLogo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.wideSubtitle}>Tara, Sinsay na sa Mabini!</Text>

            {tabRow}

            <View style={styles.wideFormWrap}>{children}</View>
          </View>
          <View style={styles.wideRight}>
            <Image
              source={require("../../assets/images/1.png")}
              style={styles.wideImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>
    );
  }

  // ── MOBILE ──
  return (
    <SafeAreaView style={styles.mobileSafe}>
      <View style={styles.mobileContainer}>
        <View style={styles.mobileHeader}>
          <Pressable
            onPress={() => router.push("/next5")}
            hitSlop={12}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.subtitle}>Tara, Sinsay na sa Mabini!</Text>
          {tabRow}
        </View>
        <View style={styles.mobileBody}>{children}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── mobile ──
  mobileSafe: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 24,
  },
  mobileHeader: {
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: "#1f1a17",
    fontWeight: "400",
  },
  logo: { width: 220, height: 54, marginTop: 4 },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 2,
    alignSelf: "center",
    width: "100%",
  },
  tabRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 32,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabButton: { alignItems: "center", gap: 6, paddingBottom: 12 },
  tabText: { fontSize: 15, fontWeight: "600", color: "#94A3B8" },
  tabTextActive: { color: "#0F172A" },
  tabUnderline: {
    height: 2.5,
    width: "100%",
    backgroundColor: "#005EEC",
    borderRadius: 2,
  },
  mobileBody: {
    flex: 1,
    marginTop: 12,
  },

  // ── desktop / wide ──
  wideRoot: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 0,
    margin: 0,
    width: "100%",
    height: "100%",
  },
  wideCard: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 0,
    overflow: "hidden",
  },
  wideLeft: {
    width: "45%",
    maxWidth: 580,
    backgroundColor: "#ffffff",
    paddingHorizontal: 56,
    paddingVertical: 40,
    gap: 16,
    justifyContent: "center",
    zIndex: 2,
    position: "relative",
  },
  wideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  wideBackRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  wideBackLabel: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  wideLogo: { width: 140, height: 34 },
  wideSubtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
  },
  wideFormWrap: { marginTop: 12, gap: 12, flex: 1 },
  wideRight: { flex: 1, height: "100%" },
  wideImage: { width: "100%", height: "100%" },
});
