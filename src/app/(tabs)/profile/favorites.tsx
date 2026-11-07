import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ContentContainer,
  DiveSiteCard,
  EmptyState,
  ErrorState,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { supabase } from "../../../lib/supabase";
import { DiveSiteRow } from "../../../types/supabase";

type FavoriteFilter = "all" | "dive-sites";

export default function FavoritesScreen() {
  const router = useRouter();
  const [sites, setSites] = useState<DiveSiteRow[]>([]);
  const [filter, setFilter] = useState<FavoriteFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSites([]);
      setLoading(false);
      setError("Sign in to view your saved favorites.");
      return;
    }

    const { data: favorites, error: favoritesError } = await supabase
      .from("tourist_favorites")
      .select("dive_site_id")
      .eq("tourist_id", user.id)
      .order("created_at", { ascending: false });

    if (favoritesError) {
      setLoading(false);
      setError("We couldn't load your favorites. Please try again.");
      return;
    }

    const ids = (favorites ?? []).map((favorite) => favorite.dive_site_id);
    if (ids.length === 0) {
      setSites([]);
      setLoading(false);
      return;
    }

    const { data: siteRows, error: sitesError } = await supabase
      .from("dive_sites")
      .select("*")
      .in("id", ids);

    if (sitesError) {
      setLoading(false);
      setError("We couldn't load your saved dive sites. Please try again.");
      return;
    }

    const siteById = new Map((siteRows ?? []).map((site) => [site.id, site]));
    setSites(ids.map((id) => siteById.get(id)).filter(Boolean) as DiveSiteRow[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const visibleSites = useMemo(
    () => (filter === "all" || filter === "dive-sites" ? sites : []),
    [filter, sites],
  );

  const removeFavorite = useCallback(async (siteId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const previousSites = sites;
    setSites((current) => current.filter((site) => site.id !== siteId));
    const { error: deleteError } = await supabase
      .from("tourist_favorites")
      .delete()
      .eq("tourist_id", user.id)
      .eq("dive_site_id", siteId);

    if (deleteError) {
      setSites(previousSites);
      setError("We couldn't remove that favorite. Please try again.");
    }
  }, [sites]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Favorites</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={560} paddingH={16}>
          <View style={styles.intro}>
            <Text style={styles.heading}>Your saved places</Text>
            <Text style={styles.subtitle}>
              Keep your favorite dive sites close for your next adventure.
            </Text>
          </View>

          <View style={styles.filterRow} accessibilityRole="tablist">
            <FilterButton
              label={`All (${sites.length})`}
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <FilterButton
              label={`Dive Sites (${sites.length})`}
              active={filter === "dive-sites"}
              onPress={() => setFilter("dive-sites")}
            />
          </View>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primaryBlue} />
              <Text style={styles.loadingText}>Loading your favorites...</Text>
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={() => void loadFavorites()} />
          ) : visibleSites.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState
                icon="heart-outline"
                message="No saved dive sites yet. Tap the heart on a dive site to save it here."
              />
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/dive-sites")}
                activeOpacity={0.85}
              >
                <Ionicons name="search-outline" size={17} color={colors.white} />
                <Text style={styles.browseButtonText}>Browse Dive Sites</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.siteGrid}>
              {visibleSites.map((site, index) => (
                <DiveSiteCard
                  key={site.id}
                  name={site.name}
                  location={site.barangay}
                  depthRange={site.depth_range}
                  difficulty={site.difficulty}
                  rating={site.rating}
                  imageUrl={site.image_url}
                  photoUrl={site.photo_url}
                  index={index}
                  liked
                  fluid
                  onLike={() => void removeFavorite(site.id)}
                  onPress={() =>
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: site.id },
                    })
                  }
                />
              ))}
            </View>
          )}
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F6FAFF" },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 18,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerSpacer: { width: 24 },
  intro: { paddingTop: 20, paddingBottom: 14 },
  heading: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#64748B",
  },
  filterTextActive: { color: colors.white },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  emptyCard: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    padding: 18,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  browseButtonText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  siteGrid: { width: "100%", gap: 14 },
});
