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

  const tabRow = (
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
  );

  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        <View style={styles.wideCard}>
          <View style={styles.wideLeft}>
            <Pressable
              onPress={() => router.push("/next5")}
              hitSlop={12}
              style={styles.wideBackRow}
              accessibilityRole="button"
            >
              <Text style={styles.wideBackArrow}>‹</Text>
              <Text style={styles.wideBackLabel}>Back</Text>
            </Pressable>

            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.wideLogo}
              contentFit="contain"
            />
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

  // ── MOBILE — unchanged ──
  return (
    <ImageBackground
      source={require("../../assets/images/1.png")}
      style={styles.container}
    >
      <View style={styles.content}>
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
        {tabRow}
      </View>
      <View pointerEvents="none" style={styles.oval} />
      <View style={styles.footer}>
        <View style={styles.bottomSection}>{children}</View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // ── mobile (unchanged) ──
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 50,
    paddingBottom: 32,
    backgroundColor: "#f7f3ea",
  },
  content: { gap: 0 },
  backButton: { padding: 0 },
  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: "#1f1a17",
    fontWeight: "400",
    left: -32,
    top: -6,
  },
  logo: { width: 250, height: 60 },
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
  tabButton: { alignItems: "center", gap: 8, paddingBottom: 40 },
  tabText: { fontSize: 15, fontWeight: "600", color: "#9b9b9b" },
  tabTextActive: { color: "#1f1a17" },
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
    height: "76%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  footer: { alignSelf: "stretch", gap: 10, zIndex: 1 },
  bottomSection: { width: "100%", gap: 12 },

  // ── desktop (new — matches reference) ──
  wideRoot: {
    flex: 1,
    backgroundColor: "#DCEBFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  wideCard: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 1280,
    height: "100%",
    maxHeight: 780,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  wideLeft: {
    width: "42%",
    backgroundColor: "#fff",
    borderTopRightRadius: 160,
    borderBottomRightRadius: 160,
    paddingHorizontal: 48,
    paddingVertical: 40,
    gap: 16,
    zIndex: 2,
  },
  wideBackRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  wideBackArrow: { fontSize: 20, color: "#16145A", fontWeight: "400" },
  wideBackLabel: { fontSize: 14, fontWeight: "600", color: "#16145A" },
  wideLogo: { width: 140, height: 36, alignSelf: "flex-start", marginTop: 4 },
  wideSubtitle: { fontSize: 14, fontWeight: "700", color: "#000" },
  wideFormWrap: { marginTop: 8, gap: 12 },
  wideRight: { flex: 1 },
  wideImage: { width: "100%", height: "100%" },
});
