import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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

export default function EstablishmentsScreen() {
  const router = useRouter();
  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
      .then(({ data, error: fetchError }) => {
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
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <ContentContainer maxWidth={900} style={styles.gridInner}>
            <View style={styles.list}>
              {establishments.map((est, idx) => {
                const { imageUrl } = resolveEstablishmentMedia(est);
                return (
                <EstablishmentCard
                  key={est.id}
                  name={est.name}
                  location={est.location}
                  accreditation={est.accreditation}
                  accredited={est.accredited}
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
