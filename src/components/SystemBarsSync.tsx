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

  if (isSplash) {
    themeColor = colors.splashBlue;
    isLightStatusBar = true;
    appleStyle = "black-translucent";
  } else if (isOnboarding) {
    themeColor = colors.primaryBlue;
    isLightStatusBar = true;
    appleStyle = "black-translucent";
  } else if (isAuthPage) {
    themeColor = colors.splashBlue;
    isLightStatusBar = true;
    appleStyle = "black-translucent";
  } else if (isOperatorGroup) {
    themeColor = "#0061f5";
    isLightStatusBar = true;
    appleStyle = "black-translucent";
  } else if (isEcoIdOrProfile) {
    themeColor = "#F6FAFF";
    isLightStatusBar = false;
    appleStyle = "default";
  } else {
    themeColor = colors.white;
    isLightStatusBar = false;
    appleStyle = "default";
  }

  useEffect(() => {
    setSystemThemeColor(themeColor, appleStyle);
  }, [themeColor, appleStyle]);

  return (
    <StatusBar
      style={isLightStatusBar ? "light" : "dark"}
    />
  );
}
