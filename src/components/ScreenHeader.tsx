import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  size?: "default" | "large"; // "large" = tab-root screens (Home, Eco-Dive ID); "default" = pushed/modal screens
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  rightElement,
  size = "default",
}: ScreenHeaderProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={colors.darkText} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}

        <Text
          style={[styles.title, size === "large" && styles.titleLarge]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.sidePlaceholder}>{rightElement}</View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sidePlaceholder: {
    minWidth: 36,
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: colors.darkText,
  },
  titleLarge: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    paddingHorizontal: 20,
    marginTop: 6,
  },
});
