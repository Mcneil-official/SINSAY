import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { useLanguage } from "../context/LanguageContext";

interface HeaderLanguageToggleProps {
  /** Optional light/dark contrast variant */
  variant?: "light" | "navy" | "glass";
}

export function HeaderLanguageToggle({
  variant = "light",
}: HeaderLanguageToggleProps) {
  const { locale, toggleLocale, t } = useLanguage();

  const isFil = locale === "fil";
  const isNavy = variant === "navy";
  const isGlass = variant === "glass";

  return (
    <TouchableOpacity
      onPress={toggleLocale}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={t("quick_language_label")}
      accessibilityHint={isFil ? "Switch to English" : "Palitan sa Filipino"}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.container,
        isNavy && styles.containerNavy,
        isGlass && styles.containerGlass,
      ]}
    >
      <View style={styles.row}>
        <Text
          style={[
            styles.langLabel,
            !isFil && styles.langLabelActive,
            isNavy && styles.langLabelNavy,
            isNavy && !isFil && styles.langLabelNavyActive,
            isGlass && styles.langLabelGlass,
            isGlass && !isFil && styles.langLabelGlassActive,
          ]}
        >
          EN
        </Text>
        <Text
          style={[
            styles.divider,
            isNavy && styles.dividerNavy,
            isGlass && styles.dividerGlass,
          ]}
        >
          /
        </Text>
        <Text
          style={[
            styles.langLabel,
            isFil && styles.langLabelActive,
            isNavy && styles.langLabelNavy,
            isNavy && isFil && styles.langLabelNavyActive,
            isGlass && styles.langLabelGlass,
            isGlass && isFil && styles.langLabelGlassActive,
          ]}
        >
          FIL
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  containerNavy: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  containerGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  divider: {
    fontSize: 11,
    fontWeight: "400",
    color: "#94A3B8",
    marginHorizontal: 1,
  },
  dividerNavy: {
    color: "rgba(255, 255, 255, 0.4)",
  },
  dividerGlass: {
    color: "#94A3B8",
  },
  langLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    fontFamily: "Quicksand_500Medium",
  },
  langLabelActive: {
    color: colors.primaryBlue,
    fontWeight: "700",
    fontFamily: "Quicksand_700Bold",
  },
  langLabelNavy: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  langLabelNavyActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  langLabelGlass: {
    color: "#64748B",
  },
  langLabelGlassActive: {
    color: colors.primaryBlue,
    fontWeight: "700",
  },
});
