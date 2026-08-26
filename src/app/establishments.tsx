import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView, Text, TouchableOpacity, StyleSheet, View,
  ScrollView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { EstablishmentCard } from "../components";

const MOCK_ESTABLISHMENTS = [
  { id: "1", image: undefined },
  { id: "2", image: undefined },
  { id: "3", image: undefined },
  { id: "4", image: undefined },
];

export default function EstablishmentsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [establishments] = useState(MOCK_ESTABLISHMENTS);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Dive Establishments</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.red} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => setError("")}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : establishments.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="business-outline" size={48} color={colors.grayLight} />
          <Text style={styles.emptyText}>No establishments found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {establishments.map((est) => (
            <EstablishmentCard key={est.id} {...est} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: "700", color: colors.darkText },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingBottom: 40, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  errorText: { fontSize: 14, color: colors.red, textAlign: "center" },
  retryBtn: { borderRadius: 8, backgroundColor: colors.primaryBlue, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { fontSize: 14, fontWeight: "600", color: colors.white },
  emptyText: { fontSize: 14, color: colors.gray, textAlign: "center" },
});
