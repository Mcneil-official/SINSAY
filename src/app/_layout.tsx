import "../../global.css";

import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppShell from "../components/AppShell";
import { AuthProvider } from "../context/AuthContext";
import { LayoutProvider } from "../context/LayoutContext";
import { registerServiceWorker } from "../lib/registerSW";

function RootLayoutInner() {
  return (
    <View style={styles.root}>
      <AppShell>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </AppShell>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LayoutProvider>
          <RootLayoutInner />
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
