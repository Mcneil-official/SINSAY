import "../../global.css";

import { Quicksand_400Regular } from "@expo-google-fonts/quicksand/400Regular";
import { Quicksand_500Medium } from "@expo-google-fonts/quicksand/500Medium";
import { Quicksand_600SemiBold } from "@expo-google-fonts/quicksand/600SemiBold";
import { Quicksand_700Bold } from "@expo-google-fonts/quicksand/700Bold";
import { Asset } from "expo-asset";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppShell from "../components/AppShell";
import PWAInstallBanner from "../components/PWAInstallBanner";
import PWAInstallModal from "../components/PWAInstallModal";
import { AuthProvider } from "../context/AuthContext";
import { LayoutProvider } from "../context/LayoutContext";
import { PWAProvider } from "../context/PWAContext";
import { ScreenTransitionProvider } from "../context/ScreenTransitionContext";
import { registerServiceWorker } from "../lib/registerSW";

function RootLayoutInner() {
  return (
    <View style={styles.root}>
      <AppShell>
        <PWAInstallBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <PWAInstallModal />
      </AppShell>
    </View>
  );
}

export default function RootLayout() {
  useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    registerServiceWorker();

    const logoUris = [
      Asset.fromModule(require("../../assets/sinsay-blue-home.webp")).uri,
      Asset.fromModule(require("../../assets/sinsay-white-home.webp")).uri,
    ];
    void Image.prefetch(logoUris, "memory-disk").catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LayoutProvider>
          <PWAProvider>
            <ScreenTransitionProvider>
              <RootLayoutInner />
            </ScreenTransitionProvider>
          </PWAProvider>
        </LayoutProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8EDF2",
  },
});
