import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

type BadgeVariant = "incomplete" | "ready" | "active" | "done" | "pending" | "approved" | "rejected";

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  incomplete: { bg: "#FEE2E2", text: colors.red },
  ready: { bg: "#FEF3C7", text: "#D97706" },
  active: { bg: "#D1FAE5", text: colors.green },
  done: { bg: colors.grayLight, text: colors.gray },
  pending: { bg: "#FEF3C7", text: "#D97706" },
  approved: { bg: "#D1FAE5", text: colors.green },
  rejected: { bg: "#FEE2E2", text: colors.red },
};

export function StatusBadge({ label, variant }: StatusBadgeProps) {
  const v = variantStyles[variant] || variantStyles.pending;
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});
