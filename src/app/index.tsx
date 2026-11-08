import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useLayout } from "../context/LayoutContext";
import AuthWelcome from "../components/AuthWelcome";
import SplashScreen from "../components/SplashScreen";
import WaveDivider from "../components/WaveDivider";
import { ENABLE_DESKTOP_LAYOUT } from "../constants/layout";
import { useAuth } from "../hooks/useAuth";

export default function Index() {
  const router = useRouter();
  const { isTablet, isDesktop } = useLayout();
  const isWide = ENABLE_DESKTOP_LAYOUT && (isTablet || isDesktop);
  const { user, isOperator, viewAsTourist, isLoading, roleReady } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const authSettled = !isLoading && roleReady;

  // When already authenticated and role is resolved, route immediately to Home
  useEffect(() => {
    if (!authSettled) return;

    if (user && !showSplash) {
      router.replace(
        isOperator && !viewAsTourist ? "/(operator-tabs)" : "/(tabs)"
      );
    }
  }, [authSettled, showSplash, user, isOperator, viewAsTourist, router]);

  if (isWide) {
    if (user && roleReady) {
      return (
        <View style={styles.mobileRoot}>
          <StatusBar style="light" />
          <Stack.Screen options={{ headerShown: false }} />
        </View>
      );
    }

    if (!authSettled) {
      return (
        <View style={styles.mobileRoot}>
          <StatusBar style="light" />
          <Stack.Screen options={{ headerShown: false }} />
          <SplashScreen isReady={authSettled} onFinish={() => setShowSplash(false)} />
        </View>
      );
    }

    return (
      <View style={styles.wideRoot}>
        <StatusBar style="dark" />
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.wideCard}>
          <View style={styles.wideLeft}>
            <WaveDivider width={84} />
            <View style={styles.wideHero}>
              <Image
                source={require("../../assets/SINSAY blue logo.png")}
                style={styles.wideLogo}
                contentFit="contain"
              />
              <Text style={styles.wideSubtitle}>
                Tara, Sinsay na sa Mabini!
              </Text>
              <Pressable
                style={styles.wideCta}
                onPress={() => router.push("/next")}
                accessibilityRole="button"
                accessibilityLabel="Explore"
              >
                <Text style={styles.wideCtaText}>Explore</Text>
              </Pressable>
              <Text style={styles.wideNote}>
                {"Before you explore, learn how to protect Mabini's marine ecosystem."}
              </Text>
            </View>
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

  const shouldShowWelcome = !showSplash && !user && authSettled;

  return (
    <View style={styles.mobileRoot}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      <AuthWelcome active={shouldShowWelcome} />
      {showSplash && (
        <SplashScreen
          isReady={authSettled}
          onFinish={() => {
            setShowSplash(false);
            if (user) {
              router.replace(
                isOperator && !viewAsTourist ? "/(operator-tabs)" : "/(tabs)"
              );
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.splashBlue,
  },
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f7f3ea",
  },
  desktopLeft: {
    flex: 1,
    overflow: "hidden",
  },
  desktopHeroImage: {
    width: "100%",
    height: "100%",
  },
  desktopRight: {
    width: 480,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 16,
  },
  desktopFooter: {
    width: "100%",
    gap: 10,
    marginTop: 24,
  },
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
    width: "46%",
    maxWidth: 600,
    backgroundColor: "#ffffff",
    paddingHorizontal: 48,
    paddingVertical: 48,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    position: "relative",
  },
  wideHero: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    gap: 16,
  },
  wideLogo: {
    width: 210,
    height: 52,
    marginBottom: 4,
  },
  wideSubtitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    lineHeight: 30,
  },
  wideCta: {
    width: "100%",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#176FF2",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  wideCtaText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  wideNote: {
    fontSize: 12,
    lineHeight: 18,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  wideRight: { flex: 1, height: "100%" },
  wideImage: { width: "100%", height: "100%" },
});
