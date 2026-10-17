import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import type { DateFieldProps } from "./DateField";

// Web PWA: the browser's own calendar popup. <input type="date"> yields
// YYYY-MM-DD directly (matching the strict validators), supports min/max,
// and still allows keyboard entry. Styled to the shared TextInput look.
export function DateField({ label, value, onChangeText, error, min, max }: DateFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {/* React Native for Web renders to DOM, so a raw <input> here is a
          real date field with the OS calendar popup. Never bundled for
          native (Metro resolves DateField.tsx there instead). */}
      <input
        type="date"
        aria-label={label}
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
          backgroundColor: colors.white,
          width: "100%",
          boxSizing: "border-box",
          fontFamily: "inherit",
        }}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
  },
  errorText: {
    fontSize: 11,
    color: colors.red,
  },
});
