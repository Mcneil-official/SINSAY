import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: React.ReactNode;
  error?: string;
}

export function Checkbox({ checked, onToggle, label, error }: CheckboxProps) {
  return (
    <View>
      <TouchableOpacity
        style={styles.row}
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View
          style={[
            styles.box,
            checked && styles.boxChecked,
            !!error && styles.boxError,
          ]}
        >
          {checked && (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          )}
        </View>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 44, // meets WCAG/HIG tap-target minimum via full-row touch area
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  boxChecked: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  boxError: {
    borderColor: colors.red,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: colors.darkText,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 11,
    color: colors.red,
    marginTop: 4,
    marginLeft: 30,
  },
});
