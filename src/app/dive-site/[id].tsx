import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
  DidYouKnowCard,
  ErrorState,
  resolveSiteImage,
} from "../../components";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  getDifficultyColor,
  getSiteEnrichment,
} from "../../lib/diveSiteEnrichment";
import { safeBack } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import { DiveSiteRow } from "../../types/supabase";

export default function DiveSiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [site, setSite] = useState<DiveSiteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      setLiked(false);
      return;
    }
    let active = true;
    supabase
      .from("tourist_favorites")
      .select("id")
      .eq("tourist_id", user.id)
      .eq("dive_site_id", id)
      .maybeSingle()
      .then(
        ({ data }) => {
          if (!active) return;
          setLiked(!!data);
        },
        () => {
          if (!active) return;
          setLiked(false);
        },
      );
    return () => {
      active = false;
    };
  }, [id, user]);

  const handleToggleLike = useCallback(async () => {
    if (!id || !user || likeBusy) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeBusy(true);

    try {
      if (nextLiked) {
        const { error } = await supabase
          .from("tourist_favorites")
          .insert({ tourist_id: user.id, dive_site_id: id });
        if (error) setLiked(!nextLiked);
      } else {
        const { error } = await supabase
          .from("tourist_favorites")
          .delete()
          .eq("tourist_id", user.id)
          .eq("dive_site_id", id);
        if (error) setLiked(!nextLiked);
      }
    } catch {
      setLiked(!nextLiked);
    } finally {
      setLikeBusy(false);
    }
  }, [id, user, liked, likeBusy]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    supabase
      .from("dive_sites")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(
        ({ data, error }) => {
          if (!active) return;
          if (!error && data) setSite(data);
          setLoading(false);
        },
        () => {
          if (!active) return;
          setLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, [id]);

  const enrichment = useMemo(() => {
    if (!site) return null;
    return getSiteEnrichment(site);
  }, [site]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeBack(router, "/dive-sites")}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>

        <Text style={styles.title}>Dive Site Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : !site || !enrichment ? (
        <ErrorState
          message="Dive site not found"
          onRetry={() => safeBack(router, "/dive-sites")}
          retryLabel="Go Back"
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContentContainer maxWidth={720} paddingH={16}>
            {/* Hero Image */}
            <View style={styles.hero}>
              <Image
                source={resolveSiteImage(site.image_url, site.photo_url, 0)}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroOverlayGradient} />

              <TouchableOpacity
                style={[
                  styles.heroHeartBtn,
                  liked && styles.heroHeartBtnActive,
                ]}
                onPress={handleToggleLike}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={
                  liked
                    ? `Remove ${site.name} from favorites`
                    : `Add ${site.name} to favorites`
                }
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? colors.heartRed : colors.white}
                />
              </TouchableOpacity>
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              {/* Title & Location Row */}
              <View style={styles.titleRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.siteName}>{site.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-sharp"
                      size={13}
                      color={colors.primaryBlue}
                    />
                    <Text style={styles.locationText}>
                      {enrichment.barangay}
                    </Text>
                  </View>
                </View>

                {site.rating && (
                  <View style={styles.ratingPill}>
                    <Ionicons
                      name="star"
                      size={13}
                      color={colors.starYellow}
                    />
                    <Text style={styles.ratingText}>{site.rating}</Text>
                  </View>
                )}
              </View>

              {/* Quick Specs Row (Depth, Feature Tag, Difficulty) */}
              <View style={styles.quickSpecsRow}>
                <View style={styles.specPill}>
                  <Ionicons
                    name="water-outline"
                    size={14}
                    color={colors.primaryBlue}
                  />
                  <View>
                    <Text style={styles.specLabel}>DEPTH RANGE</Text>
                    <Text style={styles.specValue}>
                      {enrichment.depthRange}
                    </Text>
                  </View>
                </View>

                <View style={[styles.specPill, styles.specPillWide]}>
                  <Ionicons
                    name="compass-outline"
                    size={14}
                    color="#0D9488"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.specLabel}>FEATURE TAG</Text>
                    <Text style={styles.specValue} numberOfLines={1}>
                      {enrichment.featureTag}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.specDiffBadge,
                    {
                      backgroundColor:
                        getDifficultyColor(enrichment.difficulty) + "18",
                      borderColor:
                        getDifficultyColor(enrichment.difficulty) + "55",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.specDiffText,
                      { color: getDifficultyColor(enrichment.difficulty) },
                    ]}
                  >
                    {enrichment.difficulty}
                  </Text>
                </View>
              </View>

              {/* Site Overview */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Site Overview</Text>
                <Text style={styles.description}>
                  {enrichment.description}
                </Text>
              </View>

              {/* Marine Life Found Here */}
              <View style={styles.section}>
                <View style={styles.sectionTitleWithIcon}>
                  <Ionicons
                    name="fish-outline"
                    size={16}
                    color={colors.primaryBlue}
                  />
                  <Text style={styles.sectionTitle}>
                    Marine Life Found Here
                  </Text>
                </View>

                <View style={styles.marineLifeGrid}>
                  {enrichment.marineLife.map((species) => (
                    <View key={species.name} style={styles.speciesChip}>
                      <View style={styles.speciesIconCircle}>
                        <Ionicons
                          name={species.icon}
                          size={14}
                          color={colors.primaryBlue}
                        />
                      </View>
                      <View style={styles.speciesTextCol}>
                        <Text style={styles.speciesName} numberOfLines={1}>
                          {species.name}
                        </Text>
                        <Text style={styles.speciesTag}>{species.tag}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Eco-Alert Callout Box (bg-sky-50) */}
              <View style={styles.ecoAlertBanner}>
                <View style={styles.ecoAlertHeader}>
                  <View style={styles.ecoAlertIconWrap}>
                    <Ionicons name="leaf" size={15} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ecoAlertTitle}>
                      Eco-Alert • Conservation Rules
                    </Text>
                    <Text style={styles.ecoAlertSub}>
                      Actionable guidance for diving {site.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.ecoRulesList}>
                  {enrichment.ecoRules.map((rule, i) => (
                    <View key={i} style={styles.ecoRuleRow}>
                      <View style={styles.ecoRuleDot} />
                      <Text style={styles.ecoRuleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Contextual Did You Know Card */}
              <DidYouKnowCard siteName={site.name} />

              {/* Interactive Map CTA Button */}
              <TouchableOpacity
                style={styles.mapCtaBtn}
                onPress={() =>
                  router.push(
                    `/map?site=${encodeURIComponent(site.name)}` as any,
                  )
                }
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`View ${site.name} on interactive map`}
              >
                <Ionicons name="map-outline" size={17} color="#FFFFFF" />
                <Text style={styles.mapCtaText}>
                  View on Interactive Map
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color="#FFFFFF"
                  style={{ marginLeft: 2 }}
                />
              </TouchableOpacity>
            </View>
          </ContentContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingTop: 4,
  },
  hero: {
    height: 220,
    backgroundColor: colors.navy,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#021235",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlayGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  heroHeartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(3, 14, 38, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeartBtnActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  contentSection: {
    paddingTop: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  siteName: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    borderWidth: 1,
    borderColor: "#FDE047",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: "#854D0E",
  },
  quickSpecsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  specPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  specPillWide: {
    flex: 1,
    minWidth: 130,
  },
  specLabel: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  specDiffBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  specDiffText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  sectionTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  description: {
    fontSize: 13.5,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    lineHeight: 21,
  },
  marineLifeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  speciesChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: "47%",
    flex: 1,
  },
  speciesIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  speciesTextCol: {
    flex: 1,
  },
  speciesName: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  speciesTag: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  ecoAlertBanner: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  ecoAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ecoAlertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  ecoAlertTitle: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0369A1",
  },
  ecoAlertSub: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#0284C7",
  },
  ecoRulesList: {
    gap: 7,
  },
  ecoRuleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  ecoRuleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#0284C7",
    marginTop: 6,
  },
  ecoRuleText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#0369A1",
    lineHeight: 18,
  },
  mapCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: "#003380",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mapCtaText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
    marginTop: 80,
  },
});
