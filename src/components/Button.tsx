import React from "react";
import {
    ActivityIndicator,
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
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
  const [scale] = React.useState(() => new Animated.Value(1));
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isSecondary = variant === "secondary";
  const useNativeDriver = Platform.OS !== "web";

  return (
      <Pressable
      style={[
        styles.base,
        fullWidth && styles.fullWidth,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isSecondary && styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      onPressIn={() =>
        Animated.timing(scale, {
          toValue: 0.97,
          duration: 120,
          useNativeDriver,
        }).start()
      }
      onPressOut={() =>
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          useNativeDriver,
        }).start()
      }
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
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
      </Animated.View>
    </Pressable>
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
