import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import {
  filterComboboxOptions,
  isRecognizedOption,
} from "../lib/comboboxFilter";

const FORM_FONT = "Quicksand_500Medium";

export interface ComboboxOption {
  label: string;
  value: string;
  subtitle?: string;
  badge?: string;
}

export interface SearchableComboboxProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  options: ComboboxOption[];
  onSelect: (value: string) => void;
  error?: string;
  fontFamily?: string;
  loading?: boolean;
  loadingText?: string;
  helperText?: string;
  showStatusBadge?: boolean;
  recognizedLabel?: string;
  customLabel?: string;
  leftIconName?: keyof typeof Ionicons.glyphMap;
  itemIconName?: keyof typeof Ionicons.glyphMap;
  customItemTitlePrefix?: string;
  customItemSubtext?: string;
  emptyTitleText?: string;
  emptySubtext?: string;
  zIndex?: number;
  testID?: string;
}

export function SearchableCombobox({
  label,
  placeholder = "Search or enter dive location...",
  value,
  onChangeText,
  options,
  onSelect,
  error,
  fontFamily = FORM_FONT,
  loading = false,
  loadingText = "Loading recognized options…",
  helperText,
  showStatusBadge = true,
  recognizedLabel = "Recognized Mabini dive site",
  customLabel = "Custom entry · Will be recorded on manifest",
  leftIconName = "location-outline",
  itemIconName = "water",
  customItemTitlePrefix = "Use custom site:",
  customItemSubtext = "Tap to use this custom location",
  emptyTitleText = "No registered options match",
  emptySubtext = 'Tap "Use custom" above to submit this entry.',
  zIndex,
  testID,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRecognized = useMemo(
    () => isRecognizedOption(options, value),
    [options, value],
  );
  const isCustom = Boolean(value.trim() && !isRecognized);

  // Filter options based on typed input
  const filteredOptions = useMemo(
    () => filterComboboxOptions(options, value),
    [options, value],
  );

  // Exact match check
  const isExactMatch = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return false;
    return options.some((o) => o.value.toLowerCase() === q);
  }, [options, value]);

  const hasCustomOption = Boolean(value.trim() && !isExactMatch);

  const handleSelectOption = (selectedValue: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onSelect(selectedValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChangeText("");
    setIsOpen(false);
  };

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setIsFocused(true);
    // User requested: do NOT suggest until the user types something
    if (value.trim().length > 0 && !isExactMatch) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay closing so taps on dropdown options register before unmounting
    blurTimer.current = setTimeout(() => {
      setIsOpen(false);
    }, 220);
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        zIndex !== undefined ? { zIndex } : null,
        isOpen && styles.containerOpen,
      ]}
    >
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { fontFamily }]}>{label}</Text>
          {error ? (
            <Text
              style={[styles.errorText, { fontFamily }]}
              numberOfLines={1}
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Input wrapper establishes local relative anchor for the absolute dropdown */}
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputRow,
            error
              ? styles.inputError
              : isFocused
                ? styles.inputFocused
                : styles.inputNormal,
          ]}
        >
          <View style={styles.leftIcon}>
            <Ionicons
              name={leftIconName}
              size={18}
              color={isRecognized ? "#006bff" : isCustom ? "#0F2E6B" : "#8A94A6"}
            />
          </View>

          <RNTextInput
            style={[styles.input, { fontFamily }]}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={value}
            onChangeText={(text) => {
              onChangeText(text);
              // CRITICAL: Only suggest in dropdown when the user types something
              if (text.trim().length > 0) {
                setIsOpen(true);
              } else {
                setIsOpen(false);
              }
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityRole="combobox"
            accessibilityLabel={label || placeholder}
            accessibilityState={{ expanded: isOpen }}
          />

          {value.length > 0 && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleClear}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${label || placeholder}`}
            >
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Inline Dropdown: Only rendered when user has typed text */}
        {isOpen && value.trim().length > 0 && (
          <View style={styles.dropdownBox}>
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primaryBlue} />
                <Text style={styles.loadingText}>{loadingText}</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollList}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled
              >
                {/* Custom Selection Option */}
                {hasCustomOption && (
                  <TouchableOpacity
                    style={styles.customRow}
                    onPress={() => handleSelectOption(value.trim())}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`${customItemTitlePrefix} ${value.trim()}`}
                  >
                    <View style={styles.customIconWrap}>
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.customTextWrap}>
                      <Text style={styles.customTitle} numberOfLines={1}>
                        {customItemTitlePrefix} &ldquo;{value.trim()}&rdquo;
                      </Text>
                      <Text style={styles.customSub}>
                        {customItemSubtext}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={15} color="#006bff" />
                  </TouchableOpacity>
                )}

                {/* Filtered Recognized Options */}
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, optIdx) => {
                    const isSelected =
                      opt.value.toLowerCase() === value.trim().toLowerCase();
                    const subLabel =
                      opt.subtitle ||
                      (opt.label !== opt.value ? opt.label : "");

                    return (
                      <TouchableOpacity
                        key={`opt-${opt.value}-${optIdx}`}
                        style={[
                          styles.optionRow,
                          isSelected && styles.optionRowSelected,
                        ]}
                        onPress={() => handleSelectOption(opt.value)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View
                          style={[
                            styles.optionIcon,
                            isSelected && styles.optionIconSelected,
                          ]}
                        >
                          <Ionicons
                            name={itemIconName}
                            size={15}
                            color={isSelected ? "#006bff" : "#64748B"}
                          />
                        </View>
                        <View style={styles.optionInfo}>
                          <View style={styles.optionNameRow}>
                            <Text
                              style={[
                                styles.optionName,
                                isSelected && styles.optionNameSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {opt.value}
                            </Text>
                            {opt.badge ? (
                              <View style={styles.optionBadge}>
                                <Text style={styles.optionBadgeText}>
                                  {opt.badge}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          {subLabel ? (
                            <Text style={styles.optionSubtitle} numberOfLines={1}>
                              {subLabel}
                            </Text>
                          ) : null}
                        </View>
                        {isSelected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={17}
                            color="#006bff"
                          />
                        ) : (
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color="#CBD5E1"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>
                      {emptyTitleText} &ldquo;{value.trim()}&rdquo;
                    </Text>
                    <Text style={styles.emptySub}>
                      {emptySubtext}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Status indicator badge under input */}
      {showStatusBadge && value.trim().length > 0 && !isOpen && (
        <View style={styles.statusWrap}>
          {isRecognized ? (
            <View style={styles.recognizedBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#059669" />
              <Text style={[styles.recognizedBadgeText, { fontFamily }]}>
                {recognizedLabel}
              </Text>
            </View>
          ) : isCustom ? (
            <View style={styles.customBadge}>
              <Ionicons name="create-outline" size={13} color="#475569" />
              <Text style={[styles.customBadgeText, { fontFamily }]}>
                {customLabel}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {!label && error ? (
        <Text
          style={[styles.errorText, { fontFamily }]}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}

      {helperText && !error ? (
        <Text style={[styles.helperText, { fontFamily }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1,
  },
  containerOpen: {
    zIndex: 9999,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: "#0F2E6B",
    fontFamily: "Quicksand_600SemiBold",
  },
  errorText: {
    fontSize: 11,
    color: "#EF4444",
    marginTop: 2,
    fontFamily: "Quicksand_600SemiBold",
  },
  helperText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },
  inputWrapper: {
    position: "relative",
    zIndex: 9999,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  inputNormal: {
    borderColor: "#CBD5E1",
  },
  inputFocused: {
    borderColor: "#006bff",
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      web: {
        boxShadow: "0 0 0 3px rgba(0, 107, 255, 0.12)",
      } as any,
      default: {},
    }),
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  leftIcon: {
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: "#0F2E6B",
    paddingVertical: 8,
    outlineStyle: "none" as any,
  },
  actionBtn: {
    padding: 4,
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  statusWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  recognizedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  recognizedBadgeText: {
    fontSize: 11,
    color: "#065F46",
    fontFamily: "Quicksand_600SemiBold",
  },
  customBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  customBadgeText: {
    fontSize: 11,
    color: "#334155",
    fontFamily: "Quicksand_600SemiBold",
  },
  dropdownBox: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    zIndex: 99999,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow:
          "0 10px 25px -5px rgba(15, 46, 107, 0.15), 0 8px 10px -6px rgba(15, 46, 107, 0.1)",
      } as any,
      default: {
        elevation: 10,
        shadowColor: "#0F2E6B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
  },
  scrollList: {
    maxHeight: 220,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#EFF6FF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBEAFE",
    gap: 10,
  },
  customIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#006bff",
    alignItems: "center",
    justifyContent: "center",
  },
  customTextWrap: {
    flex: 1,
  },
  customTitle: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  customSub: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    marginTop: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 46,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  optionRowSelected: {
    backgroundColor: "#F0F7FF",
  },
  optionIcon: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: "#DBEAFE",
  },
  optionInfo: {
    flex: 1,
  },
  optionNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionName: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#0F2E6B",
  },
  optionNameSelected: {
    color: "#006bff",
  },
  optionBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  optionBadgeText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#1D4ED8",
  },
  optionSubtitle: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 1,
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  emptyBox: {
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#1E293B",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    textAlign: "center",
  },
});
