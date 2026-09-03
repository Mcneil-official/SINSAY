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
  DiveSiteCard,
  EmptyState,
  ErrorState,
  ScreenHeader,
} from "../components";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { DiveSiteRow } from "../types/supabase";

export default function DiveSitesScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<DiveSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(false);
    const { data, error: fetchError } = await supabase
      .from("dive_sites")
      .select("*")
      .order("name", { ascending: true });
    if (fetchError) {
      setError(true);
    } else {
      setSites(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleToggleFavorite = useCallback(
    async (diveSiteId: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const isFav = favoriteIds.has(diveSiteId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(diveSiteId);
        else next.add(diveSiteId);
        return next;
      });
      if (isFav) {
        await supabase
          .from("tourist_favorites")
          .delete()
          .eq("tourist_id", user.id)
          .eq("dive_site_id", diveSiteId);
      } else {
        await supabase
          .from("tourist_favorites")
          .insert({ tourist_id: user.id, dive_site_id: diveSiteId });
      }
    },
    [favoriteIds],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScreenHeader title="Dive Sites" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : error ? (
        <ErrorState message="Failed to load dive sites." onRetry={loadSites} />
      ) : sites.length === 0 ? (
        <EmptyState icon="map-outline" message="No dive sites found" />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <ContentContainer maxWidth={900} style={styles.gridInner}>
            <View style={styles.grid}>
              {sites.map((site, index) => (
                <DiveSiteCard
                  key={site.id}
                  name={site.name}
                  rating={site.rating ?? "0"}
                  image={require("../../assets/dive-alley-palace.png")}
                  index={index}
                  liked={favoriteIds.has(site.id)}
                  onPress={() =>
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: site.id },
                    })
                  }
                  onLike={() => handleToggleFavorite(site.id)}
                  fluid
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
