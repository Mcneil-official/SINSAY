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
import { Image } from "expo-image";
import {
  ContentContainer,
  DiveSiteCard,
  EmptyState,
  ErrorState,
  EstablishmentCard,
  HeroCarousel,
  SearchBar,
  WiderScreenNavbar,
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

const categoryOptions: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: "all", label: "All Dives", icon: "compass-outline" },
  { key: "Beginner", label: "Beginner", icon: "sunny-outline" },
  { key: "Intermediate", label: "Intermediate", icon: "water-outline" },
  { key: "Advanced", label: "Advanced", icon: "flash-outline" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { profile, isLoading: authLoading, unreadCount, user } = useAuth();
  const { isDesktop, isTablet } = useLayout();

  const isWide = isDesktop || isTablet;
  const [selectedWideCard, setSelectedWideCard] = useState<number>(1);
  const [wideSearchQuery, setWideSearchQuery] = useState("");

  const firstName =
    profile?.full_name?.trim().split(" ")[0] ||
    user?.user_metadata?.full_name?.trim().split(" ")[0] ||
    "Juan";
  const greeting = `Hi, ${firstName}!`;

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [diveSites, setDiveSites] = useState<DiveSiteRow[]>([]);
  const [diveSitesLoading, setDiveSitesLoading] = useState(true);
  const [diveSitesError, setDiveSitesError] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [establishmentsError, setEstablishmentsError] = useState(false);

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const searchData = [...diveSites, ...establishments];

  const allDiveSites = diveSites;
  const allEstablishments = establishments;
  const filteredDiveSites =
    activeCategory === "all"
      ? diveSites
      : diveSites.filter((s) => s.difficulty === activeCategory);

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

  const showcaseSites = [
    {
      id: allDiveSites[0]?.id || "showcase-1",
      name: "Alley Palace",
      rating: "4.1",
      image: require("../../../assets/dive-alley-palace.png"),
    },
    {
      id: allDiveSites[1]?.id || "showcase-2",
      name: "Coeurdes Alpes",
      rating: "4.5",
      image: require("../../../assets/dive-coeurdes-alpes.png"),
    },
    {
      id: allDiveSites[2]?.id || "showcase-3",
      name: "Alley Palace",
      rating: "4.1",
      image: require("../../../assets/dive-alley-palace.png"),
    },
    {
      id: allDiveSites[3]?.id || "showcase-4",
      name: "Alley Palace",
      rating: "4.1",
      image: require("../../../assets/dive-alley-palace.png"),
    },
    {
      id: allDiveSites[4]?.id || "showcase-5",
      name: "Alley Palace",
      rating: "4.1",
      image: require("../../../assets/dive-alley-palace.png"),
    },
    {
      id: allDiveSites[5]?.id || "showcase-6",
      name: "Alley Palace",
      rating: "4.1",
      image: require("../../../assets/dive-alley-palace.png"),
    },
  ];

  if (isWide) {
    return (
      <SafeAreaView style={styles.wideSafeArea}>
        <StatusBar barStyle="dark-content" />
        {!isDesktop && (
          <WiderScreenNavbar
            onSearch={handleSearch}
            searchQuery={wideSearchQuery}
            setSearchQuery={setWideSearchQuery}
          />
        )}

        {wideSearchQuery.length >= 2 && searchResults.length > 0 && (
          <View style={styles.wideSearchResultsBox}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#64748B", marginBottom: 8 }}>
              Search Results
            </Text>
            {searchResults.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.searchResultRow}
                onPress={() => {
                  setWideSearchQuery("");
                  if (item.type === "dive-site") {
                    router.push({ pathname: "/dive-site/[id]", params: { id: item.id } });
                  } else {
                    router.push({ pathname: "/establishment/[id]", params: { id: item.id } });
                  }
                }}
              >
                <Ionicons
                  name={item.type === "dive-site" ? "water" : "business"}
                  size={16}
                  color={colors.primaryBlue}
                />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0F172A", flex: 1 }}>
                  {item.title}
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView
          style={styles.wideScroll}
          contentContainerStyle={styles.wideScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.wideContainer}>
            {/* Greeting */}
            <View style={styles.wideWelcomeBlock}>
              <Text style={styles.wideHiTitle}>Hi, {firstName || "Juan"}!</Text>
              <Text style={styles.wideWelcomeSub}>Welcome to Mabini, Batangas</Text>
            </View>

            {/* Panoramic Hero Banner */}
            <View style={styles.wideHeroBannerWrap}>
              <Image
                source={require("../../../assets/images/AbzuGame-Win64-Shipping_2017_02_05_17_10_31_655.jpeg")}
                style={styles.wideHeroImage}
                contentFit="cover"
              />
            </View>

            {/* Pagination Dots */}
            <View style={styles.wideDotsRow}>
              <View style={styles.wideDotActive} />
              <View style={styles.wideDot} />
              <View style={styles.wideDot} />
            </View>

            {/* Popular Dive Sites header */}
            <View style={styles.wideSectionHeader}>
              <Text style={styles.wideSectionTitle}>Popular Dive Sites</Text>
              <TouchableOpacity onPress={() => router.push("/dive-sites")}>
                <Text style={styles.wideSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* 6 Cards Row */}
            <View style={styles.wideCardsRow}>
              {showcaseSites.map((site, index) => {
                const isSelected = selectedWideCard === index;
                const isFav = favoriteIds.has(site.id);
                return (
                  <TouchableOpacity
                    key={site.id + index}
                    style={[
                      styles.wideCard,
                      isSelected && styles.wideCardActive,
                    ]}
                    onPress={() => {
                      setSelectedWideCard(index);
                      if (site.id && !site.id.startsWith("showcase-")) {
                        router.push({
                          pathname: "/dive-site/[id]",
                          params: { id: site.id },
                        });
                      } else {
                        router.push("/dive-sites");
                      }
                    }}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={site.image}
                      style={styles.wideCardImage}
                      contentFit="cover"
                    />
                    <View style={styles.wideCardOverlay}>
                      <View style={styles.wideCardBottomLeft}>
                        <View style={styles.wideCardPill}>
                          <Text style={styles.wideCardPillText}>{site.name}</Text>
                        </View>
                        <View style={styles.wideRatingRow}>
                          <Ionicons name="star" size={11} color="#FBBF24" />
                          <Text style={styles.wideRatingText}>{site.rating}</Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.wideHeartBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(site.id);
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Favorite"
                      >
                        <Ionicons
                          name={isFav ? "heart" : "heart-outline"}
                          size={13}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Accredited Establishments Section */}
            <View style={[styles.wideSectionHeader, { marginTop: 36 }]}>
              <Text style={styles.wideSectionTitle}>Dive Establishments Near You</Text>
              <TouchableOpacity onPress={() => router.push("/establishments")}>
                <Text style={styles.wideSeeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {establishmentsLoading ? (
              <View style={styles.railPlaceholder}>
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              </View>
            ) : establishments.length === 0 ? (
              <EmptyState icon="business-outline" message="No accredited establishments yet." />
            ) : (
              <View style={styles.establishmentsGrid}>
                {establishments.slice(0, 4).map((est) => (
                  <EstablishmentCard
                    key={est.id}
                    name={est.name}
                    location={est.location}
                    imageUrl={est.image_url}
                    accredited={est.accredited}
                    phone={est.phone}
                    onPress={() =>
                      router.push({
                        pathname: "/establishment/[id]",
                        params: { id: est.id },
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={900} paddingH={20}>
          {/* Greeting + avatar + notification bell */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={20} color={colors.white} />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.greeting}>{greeting}</Text>
                <Text style={styles.subGreeting}>Let's dive now</Text>
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/notifications")}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
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

          {/* Category filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categoryOptions.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive,
                  ]}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isActive ? colors.white : colors.primaryBlue}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
              ctaLabel="Find Trip"
              onCtaPress={() => router.push("/dive-sites")}
              onPress={() => {}}
            />
          ) : (
            <HeroCarousel
              items={[
                {
                  image: require("../../../assets/hero-banner.jpg"),
                  announcement: "Let's Make Our\nOcean Come Alive",
                },
              ]}
              ctaLabel="Find Trip"
              onCtaPress={() => router.push("/dive-sites")}
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
            <ErrorState
              message="Failed to load dive sites."
              onRetry={loadDiveSites}
            />
          ) : diveSites.length === 0 ? (
            <EmptyState
              icon="map-outline"
              message="No dive sites available yet."
            />
          ) : filteredDiveSites.length === 0 ? (
            <EmptyState
              icon="funnel-outline"
              message="No dive sites match this filter."
            />
          ) : isDesktop || isTablet ? (
            <View style={styles.gridRow}>
              {filteredDiveSites.slice(0, 6).map((site, index) => (
                <DiveSiteCard
                  key={site.id}
                  name={site.name}
                  rating={site.rating}
                  imageUrl={site.image_url}
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
              {filteredDiveSites.slice(0, 6).map((site, index) => (
                <DiveSiteCard
                  key={site.id}
                  name={site.name}
                  rating={site.rating}
                  imageUrl={site.image_url}
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
            <ErrorState
              message="Failed to load establishments."
              onRetry={loadEstablishments}
            />
          ) : establishments.length === 0 ? (
            <EmptyState
              icon="business-outline"
              message="No accredited establishments yet."
            />
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
    alignItems: "center",
    marginTop: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextWrap: {
    alignItems: "flex-start",
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.navy,
  },
  subGreeting: {
    fontSize: 13,
    color: colors.primaryBlue,
    marginTop: 2,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
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
  categoryRow: {
    gap: 10,
    paddingVertical: 4,
    marginTop: 16,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.accentBlue,
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
  },
  categoryPillActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryBlue,
  },
  categoryTextActive: {
    color: colors.white,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
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
    height: 190,
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

  // ── Wider Screen Layout Styles ──
  wideSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  wideScroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  wideScrollContent: {
    alignItems: "center",
    paddingBottom: 60,
  },
  wideContainer: {
    width: "94%",
    maxWidth: 1200,
  },
  wideWelcomeBlock: {
    marginTop: 12,
    marginBottom: 16,
  },
  wideHiTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  wideWelcomeSub: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
    marginTop: 4,
  },
  wideHeroBannerWrap: {
    width: "100%",
    height: 380,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0B192C",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  wideHeroImage: {
    width: "100%",
    height: "100%",
  },
  wideDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
    marginBottom: 20,
  },
  wideDotActive: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16145A",
  },
  wideDot: {
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  wideSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  wideSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
  },
  wideSeeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#005EEC",
  },
  wideCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    paddingVertical: 14,
    width: "100%",
  },
  wideCard: {
    flex: 1,
    height: 245,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0F172A",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  wideCardActive: {
    height: 260,
    transform: [{ translateY: -8 }],
    shadowColor: "#005EEC",
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    borderColor: "rgba(0, 94, 236, 0.45)",
    borderWidth: 2,
    zIndex: 10,
  },
  wideCardImage: {
    width: "100%",
    height: "100%",
  },
  wideCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  wideCardBottomLeft: {
    alignItems: "flex-start",
  },
  wideCardPill: {
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginBottom: 4,
  },
  wideCardPillText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "700",
  },
  wideRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 2,
  },
  wideRatingText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  wideHeartBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wideSearchResultsBox: {
    position: "absolute",
    top: 75,
    left: "5%",
    right: "5%",
    maxWidth: 1200,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    zIndex: 150,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
});
