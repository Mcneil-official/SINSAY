import { useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { colors } from "../constants/colors";
import { setSystemThemeColor } from "../lib/themeColor";

export function SystemBarsSync() {
  const segments = useSegments() as string[];

  // Route group detection:
  // - [] -> Root index (src/app/index.tsx, splash / welcome)
  // - ["(tabs)"] -> Tourist tab screens
  // - ["(operator-tabs)"] -> Operator tab screens
  const isRootIndex = segments.length === 0;
  const isOperatorGroup = segments[0] === "(operator-tabs)";

  // Auth pages with ocean wave top
  const isAuthPage =
    segments[0] === "loginpage" || segments[0] === "signup";

  // Full-bleed splash / welcome screen (ONLY when on the actual root index screen)
  const isSplash = isRootIndex;

  useEffect(() => {
    if (isSplash) {
      // Splash screen: full-bleed blue with translucent system bar
      setSystemThemeColor(colors.splashBlue, "black-translucent");
    } else {
      // Standard pages (Tourist Home, Operator Dashboard, Manifests, Profile, etc.):
      // #FFFFFF theme color guarantees Android's bottom 3-button system bar
      // blends seamlessly with the white BottomNav container without a blue strip!
      setSystemThemeColor("#FFFFFF", "black-translucent");
    }
  }, [isSplash]);

  // Determine status bar text/icon contrast:
  // - "light" (white icons) on full-screen splash and operator dashboard top header
  // - "dark" (black icons) on white header screens
  const isOperatorHome = isOperatorGroup && segments.length === 1;
  const isOnboarding =
    typeof segments[0] === "string" && segments[0].startsWith("next");
  const isLightStatusBar =
    isSplash || isAuthPage || isOperatorHome || isOnboarding;

  return (
    <StatusBar
      style={isLightStatusBar ? "light" : "dark"}
    />
  );
}
