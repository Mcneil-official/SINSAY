import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  EstablishmentCard,
  HeroCarousel,
  SearchBar,
  EmptyState, ErrorState,
} from "../../components";
import { SearchResult } from "../../components/SearchBar";
import { colors } from "../../constants/colors";
import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import {
  AnnouncementRow,
  DiveSiteRow,
  EstablishmentRow,
} from "../../types/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const { profile, isLoading: authLoading, unreadCount, user } = useAuth();
  const { isDesktop, isTablet } = useLayout();

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [diveSites, setDiveSites] = useState<DiveSiteRow[]>([]);
  const [diveSitesLoading, setDiveSitesLoading] = useState(true);
  const [diveSitesError, setDiveSitesError] = useState(false);

  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [establishmentsError, setEstablishmentsError] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const searchData = [...diveSites, ...establishments];

  const allDiveSites = diveSites;
  const allEstablishments = establishments;

  const loadDiveSites = useCallback(() => {
    setDiveSitesLoading(true);
    setDiveSitesError(false);
    supabase
      .from("dive_sites")
      .select("*")
      .limit(10)
      .then(({ data, error }) => {
        setDiveSites(data ?? []);
        setDiveSitesError(!!error);
        setDiveSitesLoading(false);
      });
  }, []);

  const loadEstablishments = useCallback(() => {
    setEstablishmentsLoading(true);
    setEstablishmentsError(false);
    supabase
      .from("establishments")
      .select("*")
      .eq("accredited", true)
      .limit(10)
      .then(({ data, error }) => {
        setEstablishments(data ?? []);
        setEstablishmentsError(!!error);
        setEstablishmentsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadDiveSites();
    loadEstablishments();
  }, [loadDiveSites, loadEstablishments]);

  useEffect(() => {
    setAnnouncementsLoading(true);
    supabase
      .from("announcements")
      .select("*")
      .then(({ data }) => {
        setAnnouncements(data ?? []);
        setAnnouncementsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("tourist_favorites")
      .select("dive_site_id")
      .eq("tourist_id", user.id)
      .then(({ data }) => {
        setFavoriteIds(new Set((data ?? []).map((f) => f.dive_site_id)));
      });
  }, [user]);

  const handleToggleFavorite = useCallback(
    async (diveSiteId: string) => {
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
    [user, favoriteIds],
  );

  const handleSearch = useCallback(
    (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      const q = query.toLowerCase();
      const sites: SearchResult[] = allDiveSites
        .filter((s) => s.name.toLowerCase().includes(q))
        .map((s) => ({
          id: s.id,
          type: "dive-site" as const,
          title: s.name,
          subtitle: s.rating ? `Rating: ${s.rating}` : undefined,
        }));
      const ests: SearchResult[] = allEstablishments
        .filter((e) => e.name.toLowerCase().includes(q))
        .map((e) => ({
          id: e.id,
          type: "establishment" as const,
          title: e.name,
        }));
      setSearchResults([...sites, ...ests]);
      setSearchLoading(false);
    },
    [allDiveSites, allEstablishments],
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator
          size="large"
          color={colors.primaryBlue}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0];
  const greeting = firstName ? `Hi, ${firstName}!` : "Hi there!";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={900} paddingH={20}>
          {/* Greeting + notification bell */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.subGreeting}>
                Welcome to Mabini, Batangas
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={colors.darkText}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <SearchBar
            placeholder="Search dive sites or establishments"
            results={searchResults}
            loading={searchLoading}
            onSearch={handleSearch}
            renderResult={(item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchResultRow}
                onPress={() => {
                  if (item.type === "dive-site") {
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: item.id },
                    });
                  } else {
                    router.push({
                      pathname: "/establishment/[id]",
                      params: { id: item.id },
                    });
                  }
                }}
              >
                <Ionicons
                  name={item.type === "dive-site" ? "water" : "business"}
                  size={18}
                  color={colors.primaryBlue}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.searchResultSub}>{item.subtitle}</Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.gray}
                />
              </TouchableOpacity>
            )}
          />

          {/* Hero banner carousel */}
          {announcementsLoading ? (
            <View style={styles.heroPlaceholder}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            </View>
          ) : announcements.length > 0 ? (
            <HeroCarousel
              items={announcements.map((a) => ({
                image: a.image_url
                  ? { uri: a.image_url }
                  : require("../../../assets/hero-banner.jpg"),
                announcement: a.title,
              }))}
              onPress={() => {}}
            />
          ) : (
            <HeroCarousel
              items={[
                {
                  image: require("../../../assets/hero-banner.jpg"),
                  announcement: "Welcome to Mabini",
                },
              ]}
            />
          )}

          {/* Popular Dive Sites */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Popular Dive Sites</Text>
            <TouchableOpacity onPress={() => router.push("/dive-sites")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {diveSitesLoading ? (
            <View style={styles.railPlaceholder}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            </View>
          ) : diveSitesError ? (
            <ErrorState message="Failed to load dive sites." onRetry={loadDiveSites} />
          ) : diveSites.length === 0 ? (
            <EmptyState icon="map-outline" message="No dive sites available yet." />
          ) : isDesktop || isTablet ? (
            <View style={styles.gridRow}>
              {diveSites.slice(0, 6).map((site, index) => (
                <DiveSiteCard
                  key={site.id}
                  name={site.name}
                  rating={site.rating ?? "0"}
                  image={require("../../../assets/dive-alley-palace.png")}
                  index={index}
                  liked={favoriteIds.has(site.id)}
                  onPress={() =>
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: site.id },
                    })
                  }
                  onLike={() => handleToggleFavorite(site.id)}
                />
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.diveSitesRow}
            >
              {diveSites.slice(0, 6).map((site, index) => (
                <DiveSiteCard
                  key={site.id}
                  name={site.name}
                  rating={site.rating ?? "0"}
                  image={require("../../../assets/dive-alley-palace.png")}
                  index={index}
                  liked={favoriteIds.has(site.id)}
                  onPress={() =>
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: site.id },
                    })
                  }
                  onLike={() => handleToggleFavorite(site.id)}
                />
              ))}
            </ScrollView>
          )}

          {/* Dive Establishments Near You */}
          <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
            <Text style={styles.sectionTitle}>
              Dive Establishments Near You
            </Text>
            <TouchableOpacity onPress={() => router.push("/establishments")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {establishmentsLoading ? (
            <View style={styles.railPlaceholder}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            </View>
          ) : establishmentsError ? (
            <ErrorState message="Failed to load establishments." onRetry={loadEstablishments} />
          ) : establishments.length === 0 ? (
            <EmptyState icon="business-outline" message="No accredited establishments yet." />
          ) : isDesktop || isTablet ? (
            <View style={styles.establishmentsGrid}>
              {establishments.slice(0, 4).map((item) => (
                <EstablishmentCard
                  key={item.id}
                  name={item.name}
                  location={item.location}
                  accreditation={item.accreditation}
                  onPress={() =>
                    router.push({
                      pathname: "/establishment/[id]",
                      params: { id: item.id },
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <View style={styles.establishmentsRow}>
              {establishments.slice(0, 4).map((item) => (
                <EstablishmentCard
                  key={item.id}
                  name={item.name}
                  location={item.location}
                  accreditation={item.accreditation}
                  onPress={() =>
                    router.push({
                      pathname: "/establishment/[id]",
                      params: { id: item.id },
                    })
                  }
                />
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 12,
  },
  headerTextWrap: {
    alignItems: "flex-start",
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
  },
  subGreeting: {
    fontSize: 16,
    color: "#000",
    marginTop: 6,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: "600",
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBorder,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.darkText,
  },
  searchResultSub: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.darkText,
    flexShrink: 1,
    paddingRight: 8,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primaryBlue,
  },
  diveSitesRow: {
    paddingTop: 16,
    paddingBottom: 4,
    gap: 14,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 16,
  },
  establishmentsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  establishmentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 16,
  },
  heroPlaceholder: {
    marginTop: 16,
    height: 154,
    borderRadius: 24,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  railPlaceholder: {
    marginTop: 16,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
});
