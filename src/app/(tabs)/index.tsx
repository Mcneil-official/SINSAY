import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AnnouncementDetailModal,
  CardRailSkeleton,
  ContentContainer,
  DEFAULT_CONSERVATION_ADVISORY,
  DiveSiteCard,
  EmptyState,
  ErrorState,
  EstablishmentCard,
  HeroCarousel,
  resolveEstablishmentMedia,
  SearchBar,
  Skeleton,
} from "../../components";
import { SearchResult } from "../../components/SearchBar";
import { colors } from "../../constants/colors";
import { useLayout } from "../../context/LayoutContext";
import { useNotificationModal } from "../../context/NotificationModalContext";
import { useAuth } from "../../hooks/useAuth";
import { useLanguage } from "../../context/LanguageContext";
import { HeaderLanguageToggle } from "../../components/HeaderLanguageToggle";
import { supabase } from "../../lib/supabase";
import {
  AnnouncementRow,
  DiveSiteRow,
  EstablishmentRow,
} from "../../types/supabase";

export default function HomeScreen() {
  const router = useRouter();
  const { openNotifications } = useNotificationModal();
  const {
    profile,
    avatarUri,
    isLoading: authLoading,
    unreadCount,
    user,
  } = useAuth();
  const { isDesktop, isCompact } = useLayout();
  const { t, locale } = useLanguage();

  const categories = useMemo(
    () => [
      {
        key: "all",
        label: t("category_all"),
        icon: "compass-outline" as const,
        matches: () => true,
      },
      {
        key: "Beginner",
        label: t("category_beginner"),
        icon: "sunny-outline" as const,
        matches: (s: DiveSiteRow) =>
          s.difficulty === "Beginner" || s.difficulty === "Open Water",
      },
      {
        key: "Intermediate",
        label: t("category_intermediate"),
        icon: "water-outline" as const,
        matches: (s: DiveSiteRow) =>
          s.difficulty === "Intermediate" || s.difficulty === "Rescue",
      },
      {
        key: "Advanced",
        label: t("category_advanced"),
        icon: "flash-outline" as const,
        matches: (s: DiveSiteRow) =>
          s.difficulty === "Advanced" ||
          s.difficulty === "Divemaster" ||
          s.difficulty === "Instructor",
      },
    ],
    [t, locale]
  );

  const firstName =
    profile?.full_name?.trim().split(" ")[0] ||
    user?.user_metadata?.full_name?.trim().split(" ")[0] ||
    t("header_diver");

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [diveSites, setDiveSites] = useState<DiveSiteRow[]>([]);
  const [diveSitesLoading, setDiveSitesLoading] = useState(true);
  const [diveSitesError, setDiveSitesError] = useState(false);
  const [diveSitesReloadKey, setDiveSitesReloadKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");

  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [establishmentsError, setEstablishmentsError] = useState(false);
  const [establishmentsReloadKey, setEstablishmentsReloadKey] = useState(0);

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementRow | null>(null);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const activeCategoryConfig =
    categories.find((c) => c.key === activeCategory) ?? categories[0];
  const filteredDiveSites = diveSites.filter((s) =>
    activeCategoryConfig.matches(s),
  );

  // Load dive sites from Tourism Office dashboard database
  useEffect(() => {
    let active = true;
    supabase
      .from("dive_sites")
      .select("*")
      .order("created_at", { ascending: false })
      .then(
        ({ data, error }) => {
          if (!active) return;
          const rows = (data ?? [])
            .filter((row) => !row.status || row.status !== "Restricted")
            .sort((a, b) => {
              const aHasPhoto = Boolean(
                a.photo_url?.trim() || a.image_url?.trim(),
              );
              const bHasPhoto = Boolean(
                b.photo_url?.trim() || b.image_url?.trim(),
              );
              if (aHasPhoto !== bHasPhoto) return aHasPhoto ? -1 : 1;
              const aTime = new Date(
                a.updated_at || a.created_at || 0,
              ).getTime();
              const bTime = new Date(
                b.updated_at || b.created_at || 0,
              ).getTime();
              return bTime - aTime;
            });
          setDiveSites(rows);
          setDiveSitesError(!!error);
          setDiveSitesLoading(false);
        },
        () => {
          if (!active) return;
          setDiveSitesError(true);
          setDiveSitesLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, [diveSitesReloadKey]);

  const handleRetryDiveSites = useCallback(() => {
    setDiveSitesLoading(true);
    setDiveSitesError(false);
    setDiveSitesReloadKey((k) => k + 1);
  }, []);

  // Load accredited dive resorts / establishments
  useEffect(() => {
    let active = true;
    supabase
      .from("establishments")
      .select("*")
      .eq("accredited", true)
      .limit(10)
      .then(
        ({ data, error }) => {
          if (!active) return;
          setEstablishments(data ?? []);
          setEstablishmentsError(!!error);
          setEstablishmentsLoading(false);
        },
        () => {
          if (!active) return;
          setEstablishmentsError(true);
          setEstablishmentsLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, [establishmentsReloadKey]);

  const handleRetryEstablishments = useCallback(() => {
    setEstablishmentsLoading(true);
    setEstablishmentsError(false);
    setEstablishmentsReloadKey((k) => k + 1);
  }, []);

  // Load active announcements from Tourism Office dashboard
  useEffect(() => {
    let active = true;
    supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .then(
        ({ data }) => {
          if (!active) return;
          setAnnouncements(data ?? []);
          setAnnouncementsLoading(false);
        },
        () => {
          if (!active) return;
          setAnnouncements([]);
          setAnnouncementsLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, []);

  // Load tourist favorites
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const { data } = await supabase
        .from("tourist_favorites")
        .select("dive_site_id")
        .eq("tourist_id", user.id);
      setFavoriteIds(new Set((data ?? []).map((f) => f.dive_site_id)));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

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
      try {
        if (isFav) {
          const { error } = await supabase
            .from("tourist_favorites")
            .delete()
            .eq("tourist_id", user.id)
            .eq("dive_site_id", diveSiteId);
          if (error) {
            setFavoriteIds((prev) => new Set(prev).add(diveSiteId));
          }
        } else {
          const { error } = await supabase
            .from("tourist_favorites")
            .insert({ tourist_id: user.id, dive_site_id: diveSiteId });
          if (error) {
            setFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(diveSiteId);
              return next;
            });
          }
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(diveSiteId);
          else next.delete(diveSiteId);
          return next;
        });
      }
    },
    [user, favoriteIds],
  );

  const handleSearch = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      const sites: SearchResult[] = diveSites
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.barangay && s.barangay.toLowerCase().includes(q)) ||
            (s.site_type && s.site_type.toLowerCase().includes(q)) ||
            (s.difficulty && s.difficulty.toLowerCase().includes(q)) ||
            (s.description && s.description.toLowerCase().includes(q)),
        )
        .map((s) => ({
          id: s.id,
          type: "dive-site" as const,
          title: s.name,
          subtitle: [s.barangay || "Mabini, Batangas", s.difficulty]
            .filter(Boolean)
            .join(" • "),
        }));

      const ests: SearchResult[] = establishments
        .filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.location && e.location.toLowerCase().includes(q)) ||
            (e.description && e.description.toLowerCase().includes(q)),
        )
        .map((e) => ({
          id: e.id,
          type: "establishment" as const,
          title: e.name,
          subtitle: e.location || "Accredited Dive Resort",
        }));

      setSearchResults([...sites, ...ests]);
      setSearchLoading(false);
    },
    [diveSites, establishments],
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.authLoading}>
          <View style={styles.authLoadingHeader}>
            <Skeleton width={132} height={28} radius={8} />
            <Skeleton width={40} height={40} radius={20} />
          </View>
          <Skeleton height={46} radius={14} />
          <Skeleton height={180} radius={18} />
          <CardRailSkeleton count={2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer maxWidth={900} paddingH={isCompact ? 14 : 20}>
          {/* Top Bar: SINSAY blue logo on upper left, Notification + Profile on upper right */}
          {!isDesktop && (
            <View
              style={styles.topBar}
              nativeID="tutorial-top-bar"
              testID="tutorial-top-bar"
            >
              <Image
                source={require("../../../assets/sinsay-blue-home.webp")}
                style={[styles.logoImage, isCompact && styles.compactLogoImage]}
                contentFit="contain"
                contentPosition={{ left: 0, top: "50%" }}
                priority="high"
                cachePolicy="memory-disk"
                accessibilityLabel="SINSAY"
              />

              <View style={[styles.topBarActions, isCompact && { gap: 6 }]}>
                <HeaderLanguageToggle />
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    isCompact && styles.compactIconButton,
                  ]}
                  onPress={openNotifications}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t("notifications_title")}
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

                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={() => router.push("/(tabs)/profile")}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t("profile_title")}
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 19,
                      }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Greeting Section */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>
              {t("home_greeting", { name: firstName })}
            </Text>
            <Text style={styles.greetingSubtitle}>
              {t("home_welcome_subtitle")}
            </Text>
          </View>

          {/* Full-width rounded search bar underneath */}
          <SearchBar
            placeholder={t("search_placeholder")}
            results={searchResults}
            loading={searchLoading}
            onSearch={handleSearch}
            renderResult={(item) => (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
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
                <View style={styles.searchResultIcon}>
                  <Ionicons
                    name={item.type === "dive-site" ? "water" : "business"}
                    size={16}
                    color={colors.primaryBlue}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultTitle}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.searchResultSub}>{item.subtitle}</Text>
                  ) : null}
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
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryRow}
          >
            {categories.map((cat) => {
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
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={cat.label}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isActive ? colors.white : colors.primaryBlue}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Hero Section: Announcements from the Tourism Office Dashboard */}
          {announcementsLoading ? (
            <View style={styles.heroPlaceholder} />
          ) : announcements.length > 0 ? (
            <HeroCarousel
              items={announcements.map((a) => ({
                id: a.id,
                image: a.image_url
                  ? { uri: a.image_url }
                  : require("../../../assets/hero-banner.jpg"),
                announcement: a.title,
                body: a.body,
                onPress: () => {
                  setSelectedAnnouncement(a);
                },
              }))}
              onPress={(index) => {
                const a = announcements[index];
                if (a) {
                  setSelectedAnnouncement(a);
                }
              }}
            />
          ) : (
            <HeroCarousel
              items={[
                {
                  id: "default-conservation",
                  image: require("../../../assets/hero-banner.jpg"),
                  announcement: DEFAULT_CONSERVATION_ADVISORY.title,
                  body: "Keep your Eco-Dive ID active before every dive.",
                  onPress: () => {
                    setSelectedAnnouncement(DEFAULT_CONSERVATION_ADVISORY);
                  },
                },
              ]}
              onPress={() => {
                setSelectedAnnouncement(DEFAULT_CONSERVATION_ADVISORY);
              }}
            />
          )}

          {diveSitesLoading && establishmentsLoading ? (
            <View style={styles.railPlaceholder}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            </View>
          ) : (
            <>
              {/* Popular Dive Sites: Horizontal Carousel of Large Photographic Cards */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>{t("popular_dive_sites")}</Text>
                <TouchableOpacity
                  onPress={() => router.push("/dive-sites")}
                  accessibilityRole="button"
                  accessibilityLabel={t("see_all")}
                >
                  <Text style={styles.seeAll}>{t("see_all")}</Text>
                </TouchableOpacity>
              </View>

              {diveSitesLoading ? (
                <View style={styles.railPlaceholder}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                </View>
              ) : diveSitesError ? (
                <ErrorState
                  message={t("home_error_dive_sites")}
                  onRetry={handleRetryDiveSites}
                />
              ) : diveSites.length === 0 ? (
                <EmptyState
                  icon="map-outline"
                  message={t("no_dive_sites")}
                />
              ) : filteredDiveSites.length === 0 ? (
                <EmptyState
                  icon="funnel-outline"
                  message={t("home_no_filter_match")}
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.diveSitesScroll}
                  contentContainerStyle={styles.diveSitesCarousel}
                >
                  {filteredDiveSites.slice(0, 4).map((site, index) => (
                    <DiveSiteCard
                      key={site.id}
                      name={site.name}
                      location={site.barangay || "Mabini, Batangas"}
                      depthRange={site.depth_range}
                      difficulty={site.difficulty}
                      rating={site.rating}
                      imageUrl={site.image_url}
                      photoUrl={site.photo_url}
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

              {/* Dive Resorts: Horizontal Information-Card Layout */}
              <View style={[styles.sectionHeaderRow, { marginTop: 26 }]}>
                <Text style={styles.sectionTitle}>{t("verified_establishments")}</Text>
                <TouchableOpacity
                  onPress={() => router.push("/establishments")}
                  accessibilityRole="button"
                  accessibilityLabel={t("see_all")}
                >
                  <Text style={styles.seeAll}>{t("see_all")}</Text>
                </TouchableOpacity>
              </View>

              {establishmentsLoading ? (
                <View style={styles.railPlaceholder}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                </View>
              ) : establishmentsError ? (
                <ErrorState
                  message={t("home_error_resorts")}
                  onRetry={handleRetryEstablishments}
                />
              ) : establishments.length === 0 ? (
                <EmptyState
                  icon="business-outline"
                  message={t("home_no_resorts")}
                />
              ) : (
                <View style={styles.resortsGrid}>
                  {establishments.slice(0, 6).map((item, idx) => {
                    const { imageUrl } = resolveEstablishmentMedia(item);
                    return (
                      <View key={item.id} style={styles.resortsGridCol}>
                        <EstablishmentCard
                          variant="grid"
                          name={item.name}
                          location={item.location}
                          accreditation={item.accreditation}
                          accredited={item.accredited}
                          isPcssdAccredited={Boolean(
                            item.pcssd_url && item.pcssd_url.trim().length > 0,
                          )}
                          isDotAccredited={Boolean(
                            item.dot_url && item.dot_url.trim().length > 0,
                          )}
                          imageUrl={imageUrl}
                          index={idx}
                          onPress={() =>
                            router.push({
                              pathname: "/establishment/[id]",
                              params: { id: item.id },
                            })
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ContentContainer>
      </ScrollView>

      <AnnouncementDetailModal
        visible={Boolean(selectedAnnouncement)}
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  authLoadingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
    position: "relative",
    paddingBottom: 0,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
    paddingTop: 12,
    zIndex: 120,
  },
  logoImage: {
    width: 147,
    height: 42,
  },
  compactLogoImage: {
    width: 119,
    height: 34,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    alignItems: "center",
    justifyContent: "center",
  },
  compactIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  greetingBlock: {
    marginTop: 6,
    paddingLeft: 10,
  },
  greetingTitle: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    lineHeight: 28,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
    marginTop: 2,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  searchResultSub: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
    marginTop: 1,
  },
  categoryScroll: {
    flexGrow: 0,
    marginTop: 12,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  categoryPillActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
  },
  categoryTextActive: {
    color: colors.white,
  },
  heroPlaceholder: {
    marginTop: 14,
    height: 176,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    flexShrink: 1,
    paddingRight: 8,
  },
  seeAll: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
  },
  diveSitesScroll: {
    flexGrow: 0,
  },
  diveSitesCarousel: {
    paddingTop: 12,
    paddingBottom: 6,
    gap: 12,
  },
  resortsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -5,
    marginTop: 12,
  },
  resortsGridCol: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  railPlaceholder: {
    marginTop: 16,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
});
