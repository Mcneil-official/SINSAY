import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { TextInput } from "./TextInput";

export interface DateFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  /** Earliest selectable date (YYYY-MM-DD). Enforced by the picker on web. */
  min?: string;
  /** Latest selectable date (YYYY-MM-DD). Enforced by the picker on web. */
  max?: string;
  fontFamily?: string;
}

// Native fallback: validated text field (same look as TextInput). The web
// build uses DateField.web.tsx (real browser calendar) instead — Metro picks
// the platform file automatically, so this never ships to the PWA.
export function DateField({
  label,
  value,
  onChangeText,
  error,
  placeholder = "Select Dive Date",
  fontFamily,
}: DateFieldProps) {
  return (
    <TextInput
      label={label}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      error={error}
      fontFamily={fontFamily}
      rightIcon={<Ionicons name="calendar-outline" size={16} color={colors.primaryBlue} />}
    />
  );
}
