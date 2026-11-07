import "../../global.css";

import { Quicksand_400Regular } from "@expo-google-fonts/quicksand/400Regular";
import { Quicksand_500Medium } from "@expo-google-fonts/quicksand/500Medium";
import { Quicksand_600SemiBold } from "@expo-google-fonts/quicksand/600SemiBold";
import { Quicksand_700Bold } from "@expo-google-fonts/quicksand/700Bold";
import { Asset } from "expo-asset";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { Stack, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppShell from "../components/AppShell";
import PWAInstallBanner from "../components/PWAInstallBanner";
import PWAInstallModal from "../components/PWAInstallModal";
import { SystemBarsSync } from "../components/SystemBarsSync";
import { AnnouncementDetailModal, NotificationsModal } from "../components";
import { AuthProvider } from "../context/AuthContext";
import { LayoutProvider, useLayout } from "../context/LayoutContext";
import { NotificationModalProvider, useNotificationModal } from "../context/NotificationModalContext";
import { PWAProvider } from "../context/PWAContext";
import { ScreenTransitionProvider } from "../context/ScreenTransitionContext";
import { ToastProvider } from "../context/ToastContext";
import { ENABLE_DESKTOP_LAYOUT } from "../constants/layout";
import UnsupportedDeviceScreen from "../components/UnsupportedDeviceScreen";
import { registerServiceWorker } from "../lib/registerSW";

function RootLayoutInner() {
  const { isDesktop } = useLayout();
  const pathname = usePathname();
  const { selectedAnnouncement, closeAnnouncementModal } = useNotificationModal();

  // OAuth must be allowed to settle its session before the device fallback
  // takes over the authenticated app route.
  const isAuthCallback = pathname === "/auth/callback";

  if (isDesktop && !ENABLE_DESKTOP_LAYOUT && !isAuthCallback) {
    return <UnsupportedDeviceScreen />;
  }

  return (
    <View style={styles.root}>
      <SystemBarsSync />
      <AppShell>
        <PWAInstallBanner />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
        <PWAInstallModal />
        <NotificationsModal />
        <AnnouncementDetailModal
          visible={Boolean(selectedAnnouncement)}
          announcement={selectedAnnouncement}
          onClose={closeAnnouncementModal}
        />
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
      Asset.fromModule(require("../../assets/SINSAY blue logo.png")).uri,
    ];
    void Image.prefetch(logoUris, "memory-disk").catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LayoutProvider>
          <PWAProvider>
            <ScreenTransitionProvider>
              <ToastProvider>
                <NotificationModalProvider>
                  <RootLayoutInner />
                </NotificationModalProvider>
              </ToastProvider>
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
    backgroundColor: "#FFFFFF",
  },
});
