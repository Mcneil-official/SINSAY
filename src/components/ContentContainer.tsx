import React from "react";
import { View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLayout } from "../context/LayoutContext";

interface ContentContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  paddingH?: number;
  safeBottom?: boolean;
  style?: ViewStyle;
}

export default function ContentContainer({
  children,
  maxWidth = 720,
  paddingH,
  safeBottom = false,
  style,
}: ContentContainerProps) {
  const insets = useSafeAreaInsets();
  const { isDesktop, isTablet, isCompact } = useLayout();
  const isWide = isDesktop || isTablet;
  const effectivePadding = paddingH !== undefined ? paddingH : isCompact ? 14 : 20;

  return (
    <View
      style={[
        isWide
          ? { width: "100%", maxWidth, alignSelf: "center", paddingHorizontal: effectivePadding }
          : { width: "100%", paddingHorizontal: effectivePadding },
        safeBottom && { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
    >
      {children}
    </View>
  );
}
