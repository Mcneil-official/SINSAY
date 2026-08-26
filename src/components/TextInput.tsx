import React from "react";
import { View, TextInput as RNTextInput, Text, StyleSheet } from "react-native";
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
}: TextInputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputRow,
          error ? styles.inputError : styles.inputNormal,
          multiline && styles.multiline,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <RNTextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    fontSize: 14,
    color: colors.darkText,
    padding: 0,
  },
  multilineInput: {
    textAlignVertical: "top",
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  errorText: {
    fontSize: 11,
    color: colors.red,
  },
});
