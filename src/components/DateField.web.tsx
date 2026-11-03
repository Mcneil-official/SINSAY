import React from "react";
import { WarningCircle } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import type { DateFieldProps } from "./DateField";

const FORM_FONT = "Quicksand_500Medium";

// Web PWA: the browser's own calendar popup. <input type="date"> yields
// YYYY-MM-DD directly (matching the strict validators), supports min/max,
// and still allows keyboard entry. Styled to the shared TextInput look.
export function DateField({ label, value, onChangeText, error, min, max, fontFamily }: DateFieldProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <View style={styles.labelLeft}>
          {error ? <WarningCircle size={12} color={colors.red} weight="fill" /> : null}
          <Text style={[styles.label, { fontFamily: fontFamily || FORM_FONT }]}>
            {label}
          </Text>
        </View>
        {error ? (
          <Text
            style={[styles.errorText, { fontFamily: fontFamily || FORM_FONT }]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {error}
          </Text>
        ) : null}
      </View>
      {/* React Native for Web renders to DOM, so a raw <input> here is a
          real date field with the OS calendar popup. Never bundled for
          native (Metro resolves DateField.tsx there instead). */}
      <input
        type="date"
        aria-label={label}
        aria-invalid={Boolean(error)}
        value={value}
        min={min}
        max={max}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeText(e.target.value)}
        style={{
          height: 44,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: error ? colors.red : colors.inputBorder,
          paddingLeft: 14,
          paddingRight: 14,
          fontSize: 14,
          color: colors.darkText,
          backgroundColor: error ? "#FEF2F2" : colors.white,
          width: "100%",
          boxSizing: "border-box",
          fontFamily: fontFamily || FORM_FONT,
          outlineStyle: "none",
          outlineWidth: 0,
        }}
      />
      {!label && error ? (
        <Text
          style={[styles.errorText, { fontFamily: fontFamily || FORM_FONT }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.darkText,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  labelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  errorText: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.red,
  },
});
