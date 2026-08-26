import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  ActivityIndicator,
  StyleSheet,
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
  placeholder = "Search",
  results,
  loading = false,
  onSearch,
  renderResult,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, onSearch]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <Ionicons name="search" size={16} color={colors.gray} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Ionicons
            name="close-circle"
            size={16}
            color={colors.gray}
            onPress={() => setQuery("")}
          />
        )}
      </View>

      {query.length > 0 && (
        <View style={styles.resultsContainer}>
          {loading && (
            <ActivityIndicator size="small" color={colors.primaryBlue} style={{ padding: 12 }} />
          )}
          {!loading && results.length === 0 && (
            <Text style={styles.emptyText}>
              No results for '{query}'. Try a different search.
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
    marginTop: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 35,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.darkText,
    paddingVertical: 0,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    overflow: "hidden",
  },
  emptyText: {
    fontSize: 13,
    color: colors.gray,
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
});
