import React from "react";
import { View, ViewStyle } from "react-native";
import { useLayout } from "../context/LayoutContext";

interface ContentContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  paddingH?: number;
  style?: ViewStyle;
}

export default function ContentContainer({
  children,
  maxWidth = 720,
  paddingH,
  style,
}: ContentContainerProps) {
  const { isDesktop, isTablet, isCompact } = useLayout();
  const isWide = isDesktop || isTablet;
  const effectivePadding = paddingH !== undefined ? paddingH : isCompact ? 14 : 20;

  return (
    <View
      style={[
        isWide
          ? { width: "100%", maxWidth, alignSelf: "center", paddingHorizontal: effectivePadding }
          : { width: "100%", paddingHorizontal: effectivePadding },
        style,
      ]}
    >
      {children}
    </View>
  );
}
