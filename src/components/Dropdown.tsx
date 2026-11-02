import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

const FORM_FONT = "Quicksand_500Medium";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  placeholder?: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  error?: string;
  fontFamily?: string;
}

export function Dropdown({
  label,
  placeholder = "Select",
  value,
  options,
  onSelect,
  error,
  fontFamily,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <View style={styles.labelRow}>
          <View style={styles.labelLeft}>
            {error ? <Ionicons name="alert-circle" size={12} color={colors.red} /> : null}
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
      <TouchableOpacity
        style={[styles.trigger, focused && Platform.OS === "web" && styles.triggerFocused, open && Platform.OS === "web" && styles.triggerFocused, error && styles.triggerError]}
        onPress={() => setOpen(true)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label ? `${label}: ${selected ? selected.label : placeholder}` : placeholder}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder, { fontFamily: fontFamily || FORM_FONT }]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray} />
      </TouchableOpacity>
      {!label && error ? (
        <Text
          style={[styles.errorText, { fontFamily: fontFamily || FORM_FONT }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={[styles.sheetTitle, { fontFamily: fontFamily || FORM_FONT }]}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    item.value === value && styles.optionSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.value === value }}
                  accessibilityLabel={item.label}
                >
                  <Text
                    style={[
                      styles.optionText,
                      item.value === value && styles.optionTextSelected,
                      { fontFamily: fontFamily || FORM_FONT },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.primaryBlue}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  triggerError: {
    borderColor: colors.red,
    backgroundColor: "#FEF2F2",
  },
  triggerFocused: {
    borderColor: colors.primaryBlue,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    color: colors.darkText,
  },
  placeholder: {
    color: colors.gray,
  },
  errorText: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.red,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  optionSelected: {},
  optionText: {
    fontSize: 15,
    color: colors.darkText,
  },
  optionTextSelected: {
    color: colors.primaryBlue,
    fontWeight: "600",
  },
});
