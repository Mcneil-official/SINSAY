import "../../global.css";

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { LayoutProvider } from "../context/LayoutContext";
import { useLayout } from "../context/LayoutContext";
import { registerServiceWorker } from "../lib/registerSW";

function RootLayoutInner() {
  const { mode, sidebarWidth, headerHeight } = useLayout();

  return (
    <View style={styles.root}>
      {mode === "desktop" ? (
        <View
          style={[
            styles.container,
            {
              marginLeft: sidebarWidth,
              marginTop: headerHeight,
              backgroundColor: "#FFFFFF",
            },
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </View>
      ) : (
        <View style={[styles.container, styles.mobileContainer]}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <AuthProvider>
      <LayoutProvider>
        <RootLayoutInner />
      </LayoutProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8EDF2",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mobileContainer: {
    width: "100%",
  },
});
