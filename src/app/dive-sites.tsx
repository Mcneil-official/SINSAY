import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import {
  ContentContainer,
  EmptyState,
  ErrorState,
  resolveSiteImage,
} from "../components";
import { colors } from "../constants/colors";
import { safeBack } from "../lib/navigation";
import { supabase } from "../lib/supabase";
import { DiveSiteRow } from "../types/supabase";

function getDefaultDepthRange(difficulty?: string | null): string {
  switch (difficulty) {
    case "Beginner":
    case "Open Water":
      return "5–18m";
    case "Intermediate":
    case "Rescue":
      return "12–28m";
    case "Advanced":
    case "Divemaster":
    case "Instructor":
      return "18–40m";
    default:
      return "8–22m";
  }
}

function getDifficultyColor(difficulty?: string | null): string {
  switch (difficulty) {
    case "Beginner":
    case "Open Water":
      return "#10B981";
    case "Intermediate":
    case "Rescue":
      return "#F59E0B";
    case "Advanced":
    case "Divemaster":
    case "Instructor":
      return "#EF4444";
    default:
      return colors.primaryBlue;
  }
}

export default function DiveSitesScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const heroWidth = Math.min(screenWidth, 900);

  const [sites, setSites] = useState<DiveSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroScrollRef = useRef<ScrollView>(null);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("dive_sites")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError(true);
        } else {
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
          setSites(rows);
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

    const loadFavorites = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("tourist_favorites")
        .select("dive_site_id")
        .eq("tourist_id", user.id);
      setFavoriteIds(new Set((data ?? []).map((f) => f.dive_site_id)));
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const handleToggleFavorite = useCallback(
    async (diveSiteId: string, e?: any) => {
      e?.stopPropagation?.();
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
    [favoriteIds],
  );

  const featuredSites = useMemo(() => sites.slice(0, 4), [sites]);

  const handleHeroScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
      setActiveHeroIndex(idx);
    },
    [heroWidth],
  );

  const jumpToHeroSlide = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= featuredSites.length) return;
      setActiveHeroIndex(idx);
      heroScrollRef.current?.scrollTo({
        x: idx * heroWidth,
        animated: true,
      });
    },
    [featuredSites.length, heroWidth],
  );

  useEffect(() => {
    if (featuredSites.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeHeroIndex + 1) % featuredSites.length;
      setActiveHeroIndex(next);
      heroScrollRef.current?.scrollTo({
        x: next * heroWidth,
        animated: true,
      });
    }, 4800);
    return () => clearInterval(timer);
  }, [activeHeroIndex, featuredSites.length, heroWidth]);

  const getSitePhoto = useCallback(
    (site: DiveSiteRow, idx: number) => {
      if (failedImages[site.id]) {
        return resolveSiteImage(null, null, idx);
      }
      return resolveSiteImage(site.image_url, site.photo_url, idx);
    },
    [failedImages],
  );

  const markImageFailed = useCallback((siteId: string) => {
    setFailedImages((prev) => ({ ...prev, [siteId]: true }));
  }, []);

  if (loading || error || sites.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.fallbackHeaderWrap}>
          <ContentContainer maxWidth={900}>
            <View style={styles.fallbackHeaderRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity
                  style={styles.fallbackBackBtn}
                  onPress={() => safeBack(router, "/(tabs)")}
                  activeOpacity={0.8}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={colors.darkText}
                  />
                </TouchableOpacity>
                <Text style={styles.fallbackHeaderTitle}>Dive Sites</Text>
              </View>
              <TouchableOpacity
                style={styles.mapQuickBtn}
                onPress={() => router.push("/(tabs)/map")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Open interactive dive map"
              >
                <Ionicons
                  name="map-outline"
                  size={16}
                  color={colors.primaryBlue}
                />
                <Text style={styles.mapQuickBtnText}>Map</Text>
              </TouchableOpacity>
            </View>
          </ContentContainer>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading dive sites...</Text>
          </View>
        ) : error ? (
          <ErrorState
            message="Failed to load dive sites."
            onRetry={handleRetry}
          />
        ) : (
          <EmptyState icon="map-outline" message="No dive sites found" />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. UPPER FULL-BLEED IMAGE HERO CAROUSEL */}
        {featuredSites.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={[styles.heroCardWrap, { width: heroWidth }]}>
              {/* Floating Top Overlay Header: Back Button + "Dive Sites" + Map Button */}
              <View style={styles.heroHeaderOverlay} pointerEvents="box-none">
                <View style={styles.headerLeftGroup}>
                  <TouchableOpacity
                    style={styles.heroBackBtn}
                    onPress={() => safeBack(router, "/(tabs)")}
                    activeOpacity={0.82}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Go back"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={20}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                  <Text style={styles.heroHeaderTitle}>Dive Sites</Text>
                </View>

                <TouchableOpacity
                  style={styles.heroMapBtn}
                  onPress={() => router.push("/(tabs)/map")}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Open interactive dive map"
                >
                  <Ionicons
                    name="map-outline"
                    size={16}
                    color={colors.primaryBlue}
                  />
                  <Text style={styles.mapQuickBtnText}>Map</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleHeroScroll}
                scrollEventThrottle={16}
              >
                {featuredSites.map((site, idx) => {
                  const displayLocation = site.barangay?.trim()
                    ? `${site.barangay.trim()}, Mabini, Batangas`
                    : "Mabini, Batangas";
                  const displayDepth =
                    site.depth_range?.trim() ||
                    getDefaultDepthRange(site.difficulty);
                  const displayDifficulty =
                    site.difficulty?.trim() || "Open Water";
                  const diffColor = getDifficultyColor(displayDifficulty);

                  return (
                    <TouchableOpacity
                      key={site.id}
                      activeOpacity={0.94}
                      onPress={() =>
                        router.push({
                          pathname: "/dive-site/[id]",
                          params: { id: site.id },
                        })
                      }
                      style={[styles.heroSlide, { width: heroWidth }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Featured dive site ${site.name}`}
                    >
                      <Image
                        source={getSitePhoto(site, idx)}
                        style={styles.heroImage}
                        resizeMode="cover"
                        onError={() => markImageFailed(site.id)}
                      />

                      {/* Full-bleed gradient overlay: subtle top scrim for header + rich dark bottom gradient for text readability */}
                      <View
                        style={styles.heroGradientWrap}
                        pointerEvents="none"
                      >
                        <Svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <Defs>
                            <LinearGradient
                              id={`featHeroGrad-${site.id}-${idx}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <Stop
                                offset="0"
                                stopColor="#020817"
                                stopOpacity="0.62"
                              />
                              <Stop
                                offset="0.28"
                                stopColor="#020817"
                                stopOpacity="0.1"
                              />
                              <Stop
                                offset="0.5"
                                stopColor="#020817"
                                stopOpacity="0.45"
                              />
                              <Stop
                                offset="0.76"
                                stopColor="#020817"
                                stopOpacity="0.86"
                              />
                              <Stop
                                offset="1"
                                stopColor="#020817"
                                stopOpacity="0.97"
                              />
                            </LinearGradient>
                          </Defs>
                          <Rect
                            x="0"
                            y="0"
                            width="100"
                            height="100"
                            fill={`url(#featHeroGrad-${site.id}-${idx})`}
                          />
                        </Svg>
                      </View>

                      {/* Bottom Destination Details over Dark Gradient */}
                      <View style={styles.heroBottomContent}>
                        <Text style={styles.heroSiteTitle} numberOfLines={1}>
                          {site.name}
                        </Text>

                        <View style={styles.heroLocationRow}>
                          <Ionicons
                            name="location-sharp"
                            size={14}
                            color="#93C5FD"
                          />
                          <Text
                            style={styles.heroLocationText}
                            numberOfLines={1}
                          >
                            {displayLocation}
                          </Text>
                        </View>

                        <View style={styles.heroMetaFooter}>
                          <View style={styles.heroPillsGroup}>
                            <View style={styles.heroDepthPill}>
                              <Ionicons
                                name="water-outline"
                                size={12}
                                color="#93C5FD"
                              />
                              <Text style={styles.heroDepthText}>
                                {displayDepth}
                              </Text>
                            </View>

                            {site.site_type ? (
                              <View style={styles.heroTypePill}>
                                <Text style={styles.heroTypeText}>
                                  {site.site_type}
                                </Text>
                              </View>
                            ) : null}

                            <View
                              style={[
                                styles.heroDiffPill,
                                { backgroundColor: diffColor },
                              ]}
                            >
                              <Text style={styles.heroDiffText}>
                                {displayDifficulty}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.heroExplorePill}>
                            <Text style={styles.heroExploreText}>Explore</Text>
                            <Ionicons
                              name="arrow-forward"
                              size={13}
                              color={colors.white}
                            />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Carousel Pagination Progress Bar */}
            <View style={styles.paginationRow}>
              {featuredSites.map((s, i) => {
                const isActive = i === activeHeroIndex;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => jumpToHeroSlide(i)}
                    hitSlop={6}
                    style={[
                      styles.progressDot,
                      isActive && styles.progressDotActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Featured slide ${i + 1}`}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* 2. DIVE SITE LISTING CARDS (HORIZONTAL CARDS ARRANGED VERTICALLY) */}
        <ContentContainer maxWidth={900}>
          <View style={styles.listSectionHeader}>
            <Text style={styles.sectionTitle}>All Dive Destinations</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {sites.length} {sites.length === 1 ? "site" : "sites"}
              </Text>
            </View>
          </View>

          <View style={styles.verticalCardsList}>
            {sites.map((site, index) => {
              const displayLocation = site.barangay?.trim()
                ? `${site.barangay.trim()}, Mabini, Batangas`
                : "Mabini, Batangas";
              const displayDepth =
                site.depth_range?.trim() ||
                getDefaultDepthRange(site.difficulty);
              const displayDifficulty =
                site.difficulty?.trim() || "Open Water";
              const diffColor = getDifficultyColor(displayDifficulty);
              const isLiked = favoriteIds.has(site.id);

              return (
                <TouchableOpacity
                  key={site.id}
                  style={styles.horizontalSiteCard}
                  activeOpacity={0.86}
                  onPress={() =>
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: site.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`${site.name}, ${displayLocation}, ${displayDepth}, ${displayDifficulty}`}
                >
                  {/* Left Destination Photograph */}
                  <View style={styles.cardThumbWrap}>
                    <Image
                      source={getSitePhoto(site, index)}
                      style={styles.cardThumb}
                      resizeMode="cover"
                      onError={() => markImageFailed(site.id)}
                    />
                    {site.site_type ? (
                      <>
                        <View
                          style={styles.thumbGradientWrap}
                          pointerEvents="none"
                        >
                          <Svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                          >
                            <Defs>
                              <LinearGradient
                                id={`thumbGrad-${site.id}-${index}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <Stop
                                  offset="0"
                                  stopColor="#020817"
                                  stopOpacity="0"
                                />
                                <Stop
                                  offset="0.5"
                                  stopColor="#020817"
                                  stopOpacity="0.6"
                                />
                                <Stop
                                  offset="1"
                                  stopColor="#020817"
                                  stopOpacity="0.92"
                                />
                              </LinearGradient>
                            </Defs>
                            <Rect
                              x="0"
                              y="0"
                              width="100"
                              height="100"
                              fill={`url(#thumbGrad-${site.id}-${index})`}
                            />
                          </Svg>
                        </View>
                        <View style={styles.thumbTypeTag}>
                          <Text style={styles.thumbTypeTagText}>
                            {site.site_type}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  {/* Center Structured Information Column */}
                  <View style={styles.cardInfoCol}>
                    <View style={styles.cardTopBadgesRow}>
                      <View
                        style={[
                          styles.cardDiffBadge,
                          {
                            backgroundColor: diffColor + "16",
                            borderColor: diffColor + "4D",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.cardDiffDot,
                            { backgroundColor: diffColor },
                          ]}
                        />
                        <Text
                          style={[
                            styles.cardDiffBadgeText,
                            { color: diffColor },
                          ]}
                          numberOfLines={1}
                        >
                          {displayDifficulty}
                        </Text>
                      </View>

                      <View style={styles.cardDepthBadge}>
                        <Ionicons
                          name="water-outline"
                          size={11}
                          color={colors.primaryBlue}
                        />
                        <Text style={styles.cardDepthBadgeText}>
                          {displayDepth}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardSiteName} numberOfLines={1}>
                      {site.name}
                    </Text>

                    <View style={styles.cardLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#657C9B"
                      />
                      <Text
                        style={styles.cardLocationText}
                        numberOfLines={1}
                      >
                        {displayLocation}
                      </Text>
                    </View>

                    {site.description ? (
                      <Text style={styles.cardDescSnippet} numberOfLines={1}>
                        {site.description}
                      </Text>
                    ) : null}
                  </View>

                  {/* Right Actions Column (Favorite + Arrow) */}
                  <View style={styles.cardActionsCol}>
                    <TouchableOpacity
                      style={[
                        styles.cardFavBtn,
                        isLiked && styles.cardFavBtnActive,
                      ]}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleToggleFavorite(site.id, e);
                      }}
                      hitSlop={8}
                      focusable
                      accessibilityLabel={
                        isLiked
                          ? `Remove ${site.name} from favorites`
                          : `Favorite ${site.name}`
                      }
                    >
                      <Ionicons
                        name={isLiked ? "heart" : "heart-outline"}
                        size={15}
                        color={isLiked ? colors.heartRed : "#64748B"}
                      />
                    </TouchableOpacity>

                    <View style={styles.cardArrowBtn}>
                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color={colors.primaryBlue}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  fallbackHeaderWrap: {
    backgroundColor: colors.white,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBF1F8",
  },
  fallbackHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  fallbackBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackHeaderTitle: {
    fontSize: 20,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mapQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  mapQuickBtnText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 24,
  },
  featuredSection: {
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  heroCardWrap: {
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
    overflow: "hidden",
    height: 295,
    backgroundColor: "#0B192C",
    alignSelf: "center",
    position: "relative",
    shadowColor: "#0F172A",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  heroHeaderOverlay: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(4, 13, 31, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeaderTitle: {
    fontSize: 20,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    letterSpacing: 0.2,
    textShadowColor: "rgba(4, 13, 31, 0.72)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  heroSlide: {
    height: 295,
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 44,
    borderBottomRightRadius: 44,
  },
  heroImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  heroGradientWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage:
      "linear-gradient(180deg, rgba(4, 13, 31, 0.52) 0%, rgba(4, 13, 31, 0) 26%, rgba(4, 13, 31, 0.32) 52%, rgba(4, 13, 31, 0.82) 78%, rgba(4, 13, 31, 0.96) 100%)" as any,
  },
  heroBottomContent: {
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 5,
  },
  heroSiteTitle: {
    fontSize: 25,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    letterSpacing: 0.2,
    textShadowColor: "rgba(4, 13, 31, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroLocationText: {
    fontSize: 13.5,
    fontFamily: "Quicksand_500Medium",
    color: "rgba(255, 255, 255, 0.94)",
    textShadowColor: "rgba(4, 13, 31, 0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMetaFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  heroPillsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    flexWrap: "wrap",
  },
  heroDepthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroDepthText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#E2E8F0",
  },
  heroTypePill: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroTypeText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  heroDiffPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroDiffText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  heroExplorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primaryBlue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroExploreText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  progressDot: {
    width: 8,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
  },
  progressDotActive: {
    width: 28,
    backgroundColor: colors.primaryBlue,
  },
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 14,
  },
  countPill: {
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
  },
  countPillText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  verticalCardsList: {
    gap: 14,
  },
  horizontalSiteCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    gap: 14,
    borderWidth: 1,
    borderColor: "#E4EEF8",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardThumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    position: "relative",
    flexShrink: 0,
  },
  cardThumb: {
    width: "100%",
    height: "100%",
  },
  thumbGradientWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "58%",
    backgroundImage:
      "linear-gradient(180deg, rgba(2, 8, 23, 0) 0%, rgba(2, 8, 23, 0.6) 50%, rgba(2, 8, 23, 0.92) 100%)" as any,
  },
  thumbTypeTag: {
    position: "absolute",
    left: 6,
    bottom: 6,
    backgroundColor: "rgba(2, 8, 23, 0.82)",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  thumbTypeTagText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  cardInfoCol: {
    flex: 1,
    justifyContent: "center",
    gap: 5,
    minWidth: 0,
  },
  cardTopBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardDiffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardDiffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardDiffBadgeText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
  },
  cardDepthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F0F7FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  cardDepthBadgeText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  cardSiteName: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardLocationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
  },
  cardDescSnippet: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
  },
  cardActionsCol: {
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 2,
    flexShrink: 0,
  },
  cardFavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  cardFavBtnActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  cardArrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {

    fontSize: 14,

    fontFamily: "Quicksand_500Medium",

    color: "#64748B",

  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
});
