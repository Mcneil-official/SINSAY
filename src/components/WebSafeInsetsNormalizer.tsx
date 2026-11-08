import React, { useMemo } from "react";
import { Platform } from "react-native";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/**
 * Normalizes safe area insets on web platforms.
 *
 * Ensures insets.bottom is always clamped to 0 so components do not
 * create an unwanted white chin at the bottom of screens, modals, and wizards,
 * while preserving insets.top for the notch and status bar.
 */
export function WebSafeInsetsNormalizer({
  children,
}: {
  children: React.ReactNode;
}) {
  const rawInsets = useSafeAreaInsets();

  const normalizedInsets = useMemo(() => {
    if (Platform.OS !== "web") return rawInsets;
    return {
      ...rawInsets,
      bottom: 0,
    };
  }, [rawInsets]);

  return (
    <SafeAreaInsetsContext.Provider value={normalizedInsets}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}
