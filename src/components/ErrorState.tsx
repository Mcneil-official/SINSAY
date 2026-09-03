import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

interface ErrorStateProps {
  message: string;
  description?: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message,
  description,
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <View style={styles.center}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.red} />
      <Text style={styles.text}>{message}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      <TouchableOpacity
        style={styles.retryBtn}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
      >
        <Text style={styles.retryText}>{retryLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.red,
    textAlign: "center",
  },
  description: {
    ...typography.body,
    fontSize: 13,
    color: colors.gray,
    textAlign: "center",
    marginTop: -4,
  },
  retryBtn: {
    borderRadius: 8,
    backgroundColor: colors.primaryBlue,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    minHeight: 44, // touch target fix from audit
    justifyContent: "center",
  },
  retryText: {
    ...typography.body,
    fontWeight: "600",
    color: colors.white,
  },
});
