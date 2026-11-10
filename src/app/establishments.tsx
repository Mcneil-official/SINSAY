import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
  EstablishmentCard,
  resolveEstablishmentMedia,
} from "../components";
import { colors } from "../constants/colors";
import { safeBack } from "../lib/navigation";
import { supabase } from "../lib/supabase";
import { EstablishmentRow } from "../types/supabase";

const PCSSD_LOGO = require("../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../assets/logo-dot.png");

const FALLBACK_RESORT_IMAGES = [
  require("../../assets/establishment-1.png"),
  require("../../assets/establishment-2.jpg"),
];

type AccreditationFilter = "all" | "pcssd" | "dot";

export default function EstablishmentsScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const heroWidth = Math.min(screenWidth, 900);

  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<AccreditationFilter>("all");

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
            const uniqueList = Array.from(
              new Map(
                (data ?? []).map((item) => [
                  item.name.trim().toLowerCase(),
                  item,
                ])
              ).values()
            );
            setEstablishments(uniqueList);
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

  const pcssdCount = useMemo(() => {
    return establishments.filter(
      (e) => Boolean(e.pcssd_url && e.pcssd_url.trim().length > 0)
    ).length;
  }, [establishments]);

  const dotCount = useMemo(() => {
    return establishments.filter(
      (e) => Boolean(e.dot_url && e.dot_url.trim().length > 0)
    ).length;
  }, [establishments]);

  const filteredEstablishments = useMemo(() => {
    return establishments.filter((est) => {
      const hasPcssd = Boolean(est.pcssd_url && est.pcssd_url.trim().length > 0);
      const hasDot = Boolean(est.dot_url && est.dot_url.trim().length > 0);
      if (filter === "pcssd") return hasPcssd;
      if (filter === "dot") return hasDot;
      return true;
    });
  }, [establishments, filter]);

  const featuredResorts = useMemo(() => {
    return establishments.slice(0, 4);
  }, [establishments]);

  const handleHeroScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
      setActiveHeroIndex(idx);
    },
    [heroWidth]
  );

  const jumpToHeroSlide = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= featuredResorts.length) return;
      setActiveHeroIndex(idx);
      heroScrollRef.current?.scrollTo({
        x: idx * heroWidth,
        animated: true,
      });
    },
    [featuredResorts.length, heroWidth]
  );

  useEffect(() => {
    if (featuredResorts.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeHeroIndex + 1) % featuredResorts.length;
      setActiveHeroIndex(next);
      heroScrollRef.current?.scrollTo({
        x: next * heroWidth,
        animated: true,
      });
    }, 4800);
    return () => clearInterval(timer);
  }, [activeHeroIndex, featuredResorts.length, heroWidth]);

  // Loading, error, or empty fallback layout with consistent header
  if (loading || error || establishments.length === 0) {
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
                  <Ionicons name="chevron-back" size={20} color={colors.darkText} />
                </TouchableOpacity>
                <Text style={styles.fallbackHeaderTitle}>Dive Resorts</Text>
              </View>
            </View>
          </ContentContainer>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
            <Text style={styles.loadingText}>Loading dive resorts...</Text>
          </View>
        ) : error ? (
          <ErrorState
            message="Failed to load dive resorts."
            onRetry={handleRetry}
          />
        ) : (
          <EmptyState icon="business-outline" message="No dive resorts found" />
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
        {/* 1. Upper Full-Bleed Featured Resort Carousel */}
        {featuredResorts.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={[styles.heroCardWrap, { width: heroWidth }]}>
              {/* Floating Top Overlay Header: Back Button + Title */}
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
                    <Ionicons name="chevron-back" size={20} color={colors.white} />
                  </TouchableOpacity>
                  <Text style={styles.heroHeaderTitle}>Dive Resorts</Text>
                </View>
              </View>

              <ScrollView
                ref={heroScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleHeroScroll}
                scrollEventThrottle={16}
              >
                {featuredResorts.map((resort, idx) => {
                  const { imageUrl } = resolveEstablishmentMedia(resort);
                  const photoSource = imageUrl
                    ? { uri: imageUrl }
                    : FALLBACK_RESORT_IMAGES[idx % FALLBACK_RESORT_IMAGES.length];
                  const hasPcssd = Boolean(resort.pcssd_url && resort.pcssd_url.trim().length > 0);
                  const hasDot = Boolean(resort.dot_url && resort.dot_url.trim().length > 0);
                  const displayLocation = resort.location?.trim() || "Mabini, Batangas";

                  return (
                    <TouchableOpacity
                      key={resort.id}
                      activeOpacity={0.94}
                      onPress={() =>
                        router.push({
                          pathname: "/establishment/[id]",
                          params: { id: resort.id },
                        })
                      }
                      style={[styles.heroSlide, { width: heroWidth }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Featured resort ${resort.name}`}
                    >
                      <Image
                        source={photoSource}
                        style={styles.heroImage}
                        resizeMode="cover"
                      />

                      {/* Full-bleed gradient overlay */}
                      <View style={styles.heroGradientWrap} pointerEvents="none">
                        <Svg
                          width="100%"
                          height="100%"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <Defs>
                            <LinearGradient
                              id={`featResortGrad-${resort.id}-${idx}`}
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <Stop offset="0" stopColor="#020817" stopOpacity="0.62" />
                              <Stop offset="0.28" stopColor="#020817" stopOpacity="0.1" />
                              <Stop offset="0.5" stopColor="#020817" stopOpacity="0.45" />
                              <Stop offset="0.76" stopColor="#020817" stopOpacity="0.86" />
                              <Stop offset="1" stopColor="#020817" stopOpacity="0.97" />
                            </LinearGradient>
                          </Defs>
                          <Rect
                            x="0"
                            y="0"
                            width="100"
                            height="100"
                            fill={`url(#featResortGrad-${resort.id}-${idx})`}
                          />
                        </Svg>
                      </View>

                      {/* Bottom Destination Details over Dark Gradient */}
                      <View style={styles.heroBottomContent}>
                        <Text style={styles.heroResortTitle} numberOfLines={1}>
                          {resort.name}
                        </Text>

                        <View style={styles.heroLocationRow}>
                          <Ionicons name="location-sharp" size={14} color="#93C5FD" />
                          <Text style={styles.heroLocationText} numberOfLines={1}>
                            {displayLocation}
                          </Text>
                        </View>

                        <View style={styles.heroMetaFooter}>
                          <View style={styles.heroPillsGroup}>
                            <View style={styles.heroDepthPill}>
                              <Ionicons name="water-outline" size={12} color="#93C5FD" />
                              <Text style={styles.heroDepthText}>Dive Center</Text>
                            </View>

                            <View style={styles.heroTypePill}>
                              <Text style={styles.heroTypeText}>
                                {hasPcssd ? "PCSSD" : "Scuba"}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.heroDiffPill,
                                { backgroundColor: colors.primaryBlue },
                              ]}
                            >
                              <Text style={styles.heroDiffText}>
                                {hasDot ? "DOT Verified" : "Directory"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.heroExplorePill}>
                            <Text style={styles.heroExploreText}>Explore</Text>
                            <Ionicons name="arrow-forward" size={13} color={colors.white} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Pagination Progress Dots (on screen canvas below curved card) */}
            <View style={styles.paginationRow}>
              {featuredResorts.map((r, i) => {
                const isActive = i === activeHeroIndex;
                return (
                  <TouchableOpacity
                    key={r.id}
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

        {/* 2. Accreditation Filter Bar */}
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
                  PCSSD Accredited ({pcssdCount})
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
                  DOT Accredited ({dotCount})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </ContentContainer>
        </View>

        {/* 3. Dive Resorts Listing Section */}
        <ContentContainer maxWidth={900}>
          <View style={styles.listSectionHeader}>
            <Text style={styles.sectionTitle}>All Dive Resorts</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {filteredEstablishments.length}{" "}
                {filteredEstablishments.length === 1 ? "resort" : "resorts"}
              </Text>
            </View>
          </View>

          {filteredEstablishments.length === 0 ? (
            <View style={{ paddingVertical: 24, paddingHorizontal: 16 }}>
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
            </View>
          ) : (
            <View style={styles.cardsList}>
              {filteredEstablishments.map((est, idx) => {
                const { imageUrl, logoUrl } = resolveEstablishmentMedia(est);
                const hasPcssd = Boolean(est.pcssd_url && est.pcssd_url.trim().length > 0);
                const hasDot = Boolean(est.dot_url && est.dot_url.trim().length > 0);

                return (
                  <EstablishmentCard
                    key={est.id}
                    variant="row"
                    name={est.name}
                    location={est.location}
                    accreditation={est.accreditation}
                    accredited={est.accredited}
                    isPcssdAccredited={hasPcssd}
                    isDotAccredited={hasDot}
                    imageUrl={imageUrl}
                    logoUrl={logoUrl}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
  fallbackHeaderWrap: {
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  fallbackHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fallbackBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
  },
  fallbackHeaderTitle: {
    fontSize: 18,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  featuredSection: {
    marginTop: 0,
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
  heroResortTitle: {
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
    marginBottom: 6,
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
    paddingHorizontal: 16,
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
  listSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#EBF3FF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
  },
  countPillText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  cardsList: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 0,
  },
});
