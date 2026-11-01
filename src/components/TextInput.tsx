import React, { useState } from "react";
import { View, TextInput as RNTextInput, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fontFamily?: string;
}

export function TextInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  multiline = false,
  keyboardType = "default",
  leftIcon,
  rightIcon,
  fontFamily,
}: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, fontFamily ? { fontFamily } : null]}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          error ? styles.inputError : focused && Platform.OS === "web" ? styles.inputFocused : styles.inputNormal,
          multiline && styles.multiline,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <RNTextInput
          style={[styles.input, multiline && styles.multilineInput, fontFamily ? { fontFamily } : null]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error ? <Text style={[styles.errorText, fontFamily ? { fontFamily } : null]}>{error}</Text> : null}
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  inputNormal: {
    borderColor: colors.inputBorder,
  },
  inputFocused: {
    borderColor: colors.primaryBlue,
  },
  inputError: {
    borderColor: colors.red,
  },
  multiline: {
    height: "auto",
    minHeight: 80,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    // Web flex items default to min-width:auto and refuse to shrink below
    // content width — in narrow columns (planner date halves) the text
    // field overflowed the row and pushed the icon outside the border.
    minWidth: 0,
    fontSize: 14,
    color: colors.darkText,
    padding: 0,
    outlineStyle: "none" as any,
  },
  multilineInput: {
    textAlignVertical: "top",
  },
  leftIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  rightIcon: {
    marginLeft: 10,
    flexShrink: 0,
  },
  errorText: {
    fontSize: 11,
    color: colors.red,
  },
});
