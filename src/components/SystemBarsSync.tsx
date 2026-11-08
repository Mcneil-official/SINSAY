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
  const topSegment = segments[0] ?? "";
  const isOperatorGroup = topSegment === "(operator-tabs)";

  // Auth pages with ocean wave top
  const isAuthPage =
    topSegment === "loginpage" || topSegment === "signup";

  // Full-bleed splash / welcome screen (ONLY when on the actual root index screen)
  const isSplash = isRootIndex;

  const isOnboarding =
    typeof topSegment === "string" && topSegment.startsWith("next");

  const isEcoIdOrProfile =
    topSegment === "(tabs)" &&
    (segments[1] === "eco-dive-id" || segments[1] === "profile");

  let themeColor = colors.white;
  let isLightStatusBar = false;
  let appleStyle: "default" | "black-translucent" = "default";
  // On full-blue pages (Splash, Onboarding, Auth), canvas is blue.
  // On tab screens (both Operator & Tourist), canvas is white (#FFFFFF) so that
  // any safe-area behind the white BottomNav is seamless white with no blue strip.
  let canvasBackground = colors.white;

  if (isSplash) {
    themeColor = colors.splashBlue;
    isLightStatusBar = true;
    appleStyle = "black-translucent";
    canvasBackground = colors.splashBlue;
  } else if (isOnboarding) {
    themeColor = colors.primaryBlue;
    isLightStatusBar = true;
    appleStyle = "black-translucent";
    canvasBackground = colors.primaryBlue;
  } else if (isAuthPage) {
    themeColor = colors.splashBlue;
    isLightStatusBar = true;
    appleStyle = "black-translucent";
    canvasBackground = colors.splashBlue;
  } else if (isOperatorGroup) {
    themeColor = "#0061f5";
    isLightStatusBar = true;
    appleStyle = "black-translucent";
    canvasBackground = colors.white;
  } else if (isEcoIdOrProfile) {
    themeColor = "#F6FAFF";
    isLightStatusBar = false;
    appleStyle = "default";
    canvasBackground = colors.white;
  } else {
    themeColor = colors.white;
    isLightStatusBar = false;
    appleStyle = "default";
    canvasBackground = colors.white;
  }

  useEffect(() => {
    setSystemThemeColor(themeColor, appleStyle, canvasBackground);
  }, [themeColor, appleStyle, canvasBackground]);

  return (
    <StatusBar
      style={isLightStatusBar ? "light" : "dark"}
    />
  );
}
