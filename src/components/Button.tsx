import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { colors } from "../constants/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";

  return (
      <TouchableOpacity
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isSecondary && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.white : colors.primaryBlue}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              isPrimary && styles.textPrimary,
              isOutline && styles.textOutline,
              isSecondary && styles.textSecondary,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  fullWidth: {
    width: "100%",
  },
  primary: {
    backgroundColor: colors.primaryBlue,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
  },
  secondary: {
    backgroundColor: colors.grayLight,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    marginRight: 4,
  },
  text: {
    fontSize: 15,
    fontWeight: "600",
  },
  textPrimary: {
    color: colors.white,
  },
  textOutline: {
    color: colors.primaryBlue,
  },
  textSecondary: {
    color: colors.darkText,
  },
});
