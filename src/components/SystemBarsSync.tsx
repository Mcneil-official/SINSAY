import { usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { colors } from "../constants/colors";
import { setSystemThemeColor } from "../lib/themeColor";

export function SystemBarsSync() {
  const pathname = usePathname();

  // Blue full-screen splash or welcome routes
  const isSplash = pathname === "/" || pathname === "/splash";
  const isAuthBlueWave =
    pathname === "/loginpage" ||
    pathname === "/signup";
  const isOperatorDashboard =
    pathname === "/(operator-tabs)" || pathname === "/(operator-tabs)/";

  useEffect(() => {
    if (isSplash) {
      // Full-bleed splash: blue top and bottom edges
      setSystemThemeColor(colors.splashBlue, "black-translucent");
    } else if (isAuthBlueWave) {
      // Auth screens with blue wave header: status bar blends with blue, but overall theme is white
      setSystemThemeColor("#FFFFFF", "default");
    } else {
      // Standard pages (Tourist Home, Operator Dashboard, Profile, Manifests, etc.):
      // Default to clean white so the bottom navigation bar and edges match the page!
      setSystemThemeColor("#FFFFFF", "default");
    }
  }, [pathname, isSplash, isAuthBlueWave]);

  // Determine status bar text/icon contrast:
  // - "light" (white icons) on full-screen splash and operator dashboard blue top header
  // - "dark" (black icons) on white header pages
  const isLightStatusBar = isSplash || isAuthBlueWave || isOperatorDashboard;

  return <StatusBar style={isLightStatusBar ? "light" : "dark"} />;
}
