import React, { useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { WarningCircle } from "phosphor-react-native";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import type { DateFieldProps } from "./DateField";

const FORM_FONT = "Quicksand_500Medium";

// Web PWA: browser-native date picker wrapped in SINSAY design tokens.
// A visual display layer cleanly renders either the formatted date or a placeholder
// ("Select Dive Date"), while an overlaid invisible <input type="date"> seamlessly
// triggers the browser's native picker without overflowing the container.
export function DateField({
  label,
  value,
  onChangeText,
  error,
  placeholder = "Select Dive Date",
  min,
  max,
  fontFamily,
}: DateFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    try {
      inputRef.current?.showPicker?.();
    } catch {
      // Fallback if browser showPicker() is not supported or already active
    }
  };

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
          styles.trigger,
          isFocused ? styles.triggerFocused : null,
          error ? styles.triggerError : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerText,
            !value ? styles.placeholderText : null,
            { fontFamily: fontFamily || FORM_FONT },
          ]}
        >
          {value || placeholder}
        </Text>

        <Ionicons name="calendar-outline" size={17} color={colors.primaryBlue} />

        {/* Real HTML5 date input positioned over container with opacity 0 */}
        <input
          ref={inputRef}
          type="date"
          aria-label={label || placeholder}
          aria-invalid={Boolean(error)}
          value={value}
          min={min}
          max={max}
          onClick={handleClick}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
            border: "none",
            zIndex: 2,
          }}
        />
      </View>

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
    width: "100%",
    overflow: "hidden",
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
  trigger: {
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  triggerFocused: {
    borderColor: colors.primaryBlue,
  },
  triggerError: {
    borderColor: colors.red,
    backgroundColor: "#FEF2F2",
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    color: colors.darkText,
    marginRight: 8,
  },
  placeholderText: {
    color: colors.gray,
  },
  errorText: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.red,
  },
});
