import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
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
  paddingH = 20,
  style,
}: ContentContainerProps) {
  const { isDesktop, isTablet } = useLayout();
  const isWide = isDesktop || isTablet;

  return (
    <View
      style={[
        isWide
          ? { width: "100%", maxWidth, alignSelf: "center", paddingHorizontal: paddingH }
          : { width: "100%", paddingHorizontal: paddingH },
        style,
      ]}
    >
      {children}
    </View>
  );
}
