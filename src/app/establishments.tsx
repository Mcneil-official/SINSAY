import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ContentContainer,
  EmptyState,
  ErrorState,
  EstablishmentCard,
  resolveEstablishmentMedia,
  ScreenHeader,
} from "../components";
import { colors } from "../constants/colors";
import { safeBack } from "../lib/navigation";
import { supabase } from "../lib/supabase";
import { EstablishmentRow } from "../types/supabase";

const PCSSD_LOGO = require("../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../assets/logo-dot.png");

type AccreditationFilter = "all" | "pcssd" | "dot";

export default function EstablishmentsScreen() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<AccreditationFilter>("all");

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("establishments")
      .select("*")
      .eq("accredited", true)
      .order("name", { ascending: true })
      .then(
        ({ data, error: fetchError }) => {
          if (!active) return;
          if (fetchError) {
            setError(true);
          } else {
            setEstablishments(data ?? []);
            setError(false);
          }
          setLoading(false);
        },
        () => {
          if (!active) return;
          setError(true);
          setLoading(false);
        }
      );
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filteredEstablishments = useMemo(() => {
    return establishments.filter((est) => {
      const hasPcssd = Boolean(est.pcssd_url && est.pcssd_url.trim().length > 0);
      const hasDot = Boolean(est.dot_url && est.dot_url.trim().length > 0);
      if (filter === "pcssd") return hasPcssd;
      if (filter === "dot") return hasDot;
      return true;
    });
  }, [establishments, filter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Dive Resorts" onBack={() => safeBack(router, "/(tabs)")} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : error ? (
        <ErrorState
          message="Failed to load dive resorts."
          onRetry={handleRetry}
        />
      ) : establishments.length === 0 ? (
        <EmptyState icon="map-outline" message="No dive resorts found" />
      ) : (
        <>
          {/* Accreditation Filter Bar */}
          <View style={styles.filterBar}>
            <ContentContainer maxWidth={900} style={styles.filterBarInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}
              >
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filter === "all" && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter("all")}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === "all" }}
                  accessibilityLabel="Show all dive resorts"
                >
                  <Ionicons
                    name="grid-outline"
                    size={13}
                    color={filter === "all" ? colors.white : colors.primaryBlue}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      filter === "all" && styles.filterChipTextActive,
                    ]}
                  >
                    All ({establishments.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filter === "pcssd" && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter("pcssd")}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === "pcssd" }}
                  accessibilityLabel="Show PCSSD accredited dive resorts"
                >
                  <View
                    style={[
                      styles.logoCircle,
                      filter === "pcssd" && styles.logoCircleActive,
                    ]}
                  >
                    <Image
                      source={PCSSD_LOGO}
                      style={styles.filterLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterChipText,
                      filter === "pcssd" && styles.filterChipTextActive,
                    ]}
                  >
                    PCSSD Accredited
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    filter === "dot" && styles.filterChipActive,
                  ]}
                  onPress={() => setFilter("dot")}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filter === "dot" }}
                  accessibilityLabel="Show DOT accredited dive resorts"
                >
                  <View
                    style={[
                      styles.logoCircle,
                      filter === "dot" && styles.logoCircleActive,
                    ]}
                  >
                    <Image
                      source={DOT_LOGO}
                      style={styles.filterLogo}
                      resizeMode="contain"
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterChipText,
                      filter === "dot" && styles.filterChipTextActive,
                    ]}
                  >
                    DOT Accredited
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </ContentContainer>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
          >
            <ContentContainer maxWidth={900} style={styles.gridInner}>
              {filteredEstablishments.length === 0 ? (
                <EmptyState
                  icon="filter-outline"
                  message={
                    filter === "pcssd"
                      ? "No dive resorts found with verified PCSSD accreditation."
                      : filter === "dot"
                      ? "No dive resorts found with verified DOT accreditation."
                      : "No dive resorts found."
                  }
                />
              ) : (
                <View style={styles.list}>
                  {filteredEstablishments.map((est, idx) => {
                    const { imageUrl } = resolveEstablishmentMedia(est);
                    const hasPcssd = Boolean(est.pcssd_url && est.pcssd_url.trim().length > 0);
                    const hasDot = Boolean(est.dot_url && est.dot_url.trim().length > 0);
                    return (
                      <EstablishmentCard
                        key={est.id}
                        name={est.name}
                        location={est.location}
                        accreditation={est.accreditation}
                        accredited={est.accredited}
                        isPcssdAccredited={hasPcssd}
                        isDotAccredited={hasDot}
                        imageUrl={imageUrl}
                        index={idx}
                        onPress={() =>
                          router.push({
                            pathname: "/establishment/[id]",
                            params: { id: est.id },
                          })
                        }
                      />
                    );
                  })}
                </View>
              )}
            </ContentContainer>
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  filterBar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    backgroundColor: colors.white,
  },
  filterBarInner: {
    paddingHorizontal: 0,
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    backgroundColor: "#F8FBFF",
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterChipText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  logoCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircleActive: {
    backgroundColor: colors.white,
  },
  filterLogo: {
    width: 14,
    height: 14,
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 14, paddingBottom: 40, gap: 12 },
  gridInner: { paddingHorizontal: 0, alignItems: "center" },
  list: {
    width: "100%",
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
});
