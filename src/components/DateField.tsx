import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { TextInput } from "./TextInput";

export interface DateFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  /** Earliest selectable date (YYYY-MM-DD). Enforced by the picker on web. */
  min?: string;
  /** Latest selectable date (YYYY-MM-DD). Enforced by the picker on web. */
  max?: string;
}

// Native fallback: validated text field (same look as TextInput). The web
// build uses DateField.web.tsx (real browser calendar) instead — Metro picks
// the platform file automatically, so this never ships to the PWA.
export function DateField({ label, value, onChangeText, error }: DateFieldProps) {
  return (
    <TextInput
      label={label}
      placeholder="YYYY-MM-DD"
      value={value}
      onChangeText={onChangeText}
      error={error}
      rightIcon={<Ionicons name="calendar-outline" size={16} color={colors.gray} />}
    />
  );
}
