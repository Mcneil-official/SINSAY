import React, { useMemo } from "react";
import { Platform } from "react-native";
import {
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/**
 * Normalizes safe area insets on web platforms.
 *
 * On iOS WebKit (Safari & PWA), viewport-fit=cover causes env(safe-area-inset-bottom)
 * to report 34px for the home indicator. This normalizer preserves insets.top for
 * the notch and status bar, but clamps insets.bottom to 0 so components do not
 * create an unwanted 34px white chin at the bottom of screens, modals, and wizards.
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
