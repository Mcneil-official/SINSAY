import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { WarningCircle } from "phosphor-react-native";
import { View, TextInput as RNTextInput, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../constants/colors";

const FORM_FONT = "Quicksand_500Medium";

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  success?: boolean;
  successMessage?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fontFamily?: string;
  prefix?: string;
  maxLength?: number;
}

export function TextInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  success = false,
  successMessage,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  leftIcon,
  rightIcon,
  fontFamily,
  prefix,
  maxLength,
}: TextInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? (
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
      ) : null}
      <View
        style={[
          styles.inputRow,
          error ? styles.inputError : success ? styles.inputSuccess : focused && Platform.OS === "web" ? styles.inputFocused : styles.inputNormal,
          multiline && styles.multiline,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        {prefix ? (
          <View style={styles.prefixBadge}>
            <Text style={[styles.prefixBadgeText, { fontFamily: fontFamily || FORM_FONT }]}>
              {prefix}
            </Text>
          </View>
        ) : null}
        <RNTextInput
          style={[styles.input, multiline && styles.multilineInput, { fontFamily: fontFamily || FORM_FONT }]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : success ? <Ionicons name="checkmark-circle" size={18} color={colors.green} /> : null}
      </View>
      {!label && error ? (
        <Text
          style={[styles.errorText, { fontFamily: fontFamily || FORM_FONT }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
      {!error && successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}
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
  prefixBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  prefixBadgeText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
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
    backgroundColor: "#FEF2F2",
  },
  inputSuccess: {
    borderColor: colors.green,
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
    fontSize: 13,
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
    lineHeight: 14,
    color: colors.red,
  },
  successText: {
    fontSize: 11,
    color: colors.green,
  },
});
