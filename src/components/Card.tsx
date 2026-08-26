import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "../constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "info" | "gradient";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        variant === "info" && styles.info,
        variant === "gradient" && styles.gradient,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  info: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradient: {
    backgroundColor: colors.navy,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
