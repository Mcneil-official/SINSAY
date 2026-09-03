import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import {
  ContentContainer,
  EmptyState,
  ErrorState,
  EstablishmentCard,
  ScreenHeader
} from "../components";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { EstablishmentRow } from "../types/supabase";

export default function EstablishmentsScreen() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadEstablishments = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error: fetchError } = await supabase
      .from("establishments")
      .select("*")
      .eq("accredited", true)
      .order("name", { ascending: true });
    if (fetchError) {
      setError(true);
    } else {
      setEstablishments(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEstablishments();
  }, [loadEstablishments]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Dive Establishments" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : error ? (
        <ErrorState
          message="Failed to load establishments."
          onRetry={loadEstablishments}
        />
      ) : establishments.length === 0 ? (
        <EmptyState icon="map-outline" message="No establishments found" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <ContentContainer maxWidth={900} style={styles.gridInner}>
            <View style={styles.grid}>
              {establishments.map((est) => (
                <EstablishmentCard
                  key={est.id}
                  name={est.name}
                  location={est.location}
                  accreditation={est.accreditation}
                  onPress={() =>
                    router.push({
                      pathname: "/establishment/[id]",
                      params: { id: est.id },
                    })
                  }
                />
              ))}
            </View>
          </ContentContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 12, paddingBottom: 40, gap: 12 },
  gridInner: { paddingHorizontal: 0, alignItems: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    width: "100%",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
});
