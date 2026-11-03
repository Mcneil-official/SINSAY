import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";

export interface SearchResult {
  id: string;
  type: "dive-site" | "establishment";
  title: string;
  subtitle?: string;
}

interface SearchBarProps {
  placeholder?: string;
  results: SearchResult[];
  loading?: boolean;
  onSearch: (query: string) => void;
  renderResult: (item: SearchResult, index: number) => React.ReactNode;
}

export function SearchBar({
  placeholder = "Search dive sites, resorts, or activities...",
  results,
  loading = false,
  onSearch,
  renderResult,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(query), 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, onSearch]);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={16}
          color={focused ? colors.primaryBlue : "#657C9B"}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#8B9EB7"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => setQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={16} color="#8B9EB7" />
          </TouchableOpacity>
        )}
      </View>

      {query.trim().length > 0 && (
        <View style={styles.resultsContainer}>
          {loading && (
            <ActivityIndicator
              size="small"
              color={colors.primaryBlue}
              style={{ padding: 14 }}
            />
          )}
          {!loading && results.length === 0 && (
            <Text style={styles.emptyText}>
              No results for &ldquo;{query}&rdquo;. Try a different search.
            </Text>
          )}
          {!loading && results.map((item, i) => renderResult(item, i))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginTop: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    backgroundColor: "#F8FBFF",
    paddingHorizontal: 14,
  },
  inputRowFocused: {
    borderColor: colors.primaryBlue,
    backgroundColor: colors.white,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: colors.darkText,
    paddingVertical: 0,
    outlineStyle: "none" as any,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
});
