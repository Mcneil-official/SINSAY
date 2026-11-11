import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
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
import { useToast } from "../../../context/ToastContext";
import { shareText } from "../../../lib/snapshot";
import {
  SavedItineraryItem,
  deleteSavedDiveItinerary,
  formatItineraryForShare,
  loadAllSavedItineraries,
} from "../../../lib/savedItineraries";
import { supabase } from "../../../lib/supabase";
import { DiveSiteRow } from "../../../types/supabase";

type FavoriteFilter = "all" | "dive-sites" | "itineraries";

export default function FavoritesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [sites, setSites] = useState<DiveSiteRow[]>([]);
  const [itineraries, setItineraries] = useState<SavedItineraryItem[]>([]);
  const [filter, setFilter] = useState<FavoriteFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<SavedItineraryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Load saved itineraries (works for authenticated users and local backup)
    try {
      const savedPlans = await loadAllSavedItineraries(user?.id);
      setItineraries(savedPlans);
    } catch {
      setItineraries([]);
    }

    // 2. Load favorite dive sites
    if (!user) {
      setSites([]);
      setLoading(false);
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
      void loadData();
    }, [loadData]),
  );

  const visibleSites = useMemo(() => {
    if (filter === "itineraries") return [];
    return sites;
  }, [filter, sites]);

  const visibleItineraries = useMemo(() => {
    if (filter === "dive-sites") return [];
    return itineraries;
  }, [filter, itineraries]);

  const removeFavoriteSite = useCallback(
    async (siteId: string) => {
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
      } else {
        showToast("Dive site removed from favorites.", { tone: "info" });
      }
    },
    [sites, showToast],
  );

  const handleDeleteItinerary = useCallback(
    async (item: SavedItineraryItem) => {
      setDeletingId(item.id);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      await deleteSavedDiveItinerary(item.id, user?.id);
      setItineraries((prev) => prev.filter((i) => i.id !== item.id));
      if (activePlan?.id === item.id) {
        setActivePlan(null);
      }
      setDeletingId(null);
      showToast("Itinerary removed from saved items.", { tone: "info" });
    },
    [activePlan?.id, showToast],
  );

  const handleShareItinerary = useCallback(
    async (item: SavedItineraryItem) => {
      const formatted = formatItineraryForShare({
        title: item.title,
        budget: item.budget,
        groupSize: item.groupSize,
        activity: item.activity,
        lengthOfStay: item.lengthOfStay,
        plan: item.plan,
      });

      const result = await shareText(
        `SINSAY Dive Itinerary: ${item.title}`,
        formatted
      );
      if (result === "shared") {
        showToast("Itinerary shared successfully!", { tone: "success" });
      } else {
        showToast("Itinerary copied to clipboard!", { tone: "success" });
      }
    },
    [showToast],
  );

  const totalItems = sites.length + itineraries.length;

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
        <Text style={styles.title}>Favorites & Saved</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={560} paddingH={16}>
          <View style={styles.intro}>
            <Text style={styles.heading}>Your saved items</Text>
            <Text style={styles.subtitle}>
              Keep your favorite dive spots and custom AI dive itineraries ready for your next trip.
            </Text>
          </View>

          <View style={styles.filterRow} accessibilityRole="tablist">
            <FilterButton
              label={`All (${totalItems})`}
              active={filter === "all"}
              onPress={() => setFilter("all")}
            />
            <FilterButton
              label={`Dive Sites (${sites.length})`}
              active={filter === "dive-sites"}
              onPress={() => setFilter("dive-sites")}
            />
            <FilterButton
              label={`Itineraries (${itineraries.length})`}
              active={filter === "itineraries"}
              onPress={() => setFilter("itineraries")}
            />
          </View>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primaryBlue} />
              <Text style={styles.loadingText}>Loading your saved items...</Text>
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={() => void loadData()} />
          ) : visibleSites.length === 0 && visibleItineraries.length === 0 ? (
            <View style={styles.emptyCard}>
              <EmptyState
                icon="heart-outline"
                message={
                  filter === "itineraries"
                    ? "No saved itineraries yet. Use the Dive Assistant to generate and save custom trip plans!"
                    : "No saved dive sites or itineraries yet."
                }
              />
              <View style={styles.emptyActionRow}>
                {filter === "itineraries" ? (
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.push("/(tabs)/dive-assistant/planner")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="compass-outline" size={17} color={colors.white} />
                    <Text style={styles.browseButtonText}>Create Dive Itinerary</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.push("/dive-sites")}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="search-outline" size={17} color={colors.white} />
                    <Text style={styles.browseButtonText}>Browse Dive Sites</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.contentStack}>
              {/* Saved Itineraries Section */}
              {visibleItineraries.length > 0 && (
                <View style={styles.sectionBlock}>
                  {filter === "all" && (
                    <Text style={styles.sectionHeading}>
                      Saved Itineraries ({visibleItineraries.length})
                    </Text>
                  )}
                  {visibleItineraries.map((item) => (
                    <View key={item.id} style={styles.itineraryCard}>
                      <View style={styles.itineraryTopRow}>
                        <View style={styles.itineraryIconBadge}>
                          <Ionicons name="calendar-outline" size={18} color="#0284C7" />
                        </View>
                        <View style={styles.itineraryTitleCol}>
                          <Text style={styles.itineraryTitle} numberOfLines={2}>
                            {item.title}
                          </Text>
                          <Text style={styles.itineraryDate}>
                            Saved on {new Date(item.savedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteMiniBtn}
                          onPress={() => void handleDeleteItinerary(item)}
                          disabled={deletingId === item.id}
                          hitSlop={8}
                          accessibilityLabel="Delete itinerary"
                        >
                          <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>

                      {/* Specs Chips */}
                      <View style={styles.chipsWrap}>
                        {item.lengthOfStay ? (
                          <View style={styles.miniChip}>
                            <Text style={styles.miniChipText}>{item.lengthOfStay}</Text>
                          </View>
                        ) : null}
                        {item.groupSize ? (
                          <View style={styles.miniChip}>
                            <Text style={styles.miniChipText}>
                              {item.groupSize} diver{Number(item.groupSize) === 1 ? "" : "s"}
                            </Text>
                          </View>
                        ) : null}
                        {item.budget ? (
                          <View style={styles.miniChip}>
                            <Text style={styles.miniChipText}>
                              ₱{Number(item.budget).toLocaleString()}
                            </Text>
                          </View>
                        ) : null}
                        {item.activity ? (
                          <View style={styles.miniChip}>
                            <Text style={styles.miniChipText}>{item.activity}</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Included sites preview */}
                      {Array.isArray(item.plan.sites) && item.plan.sites.length > 0 && (
                        <View style={styles.sitesPreviewRow}>
                          <Ionicons name="location-outline" size={13} color="#64748B" />
                          <Text style={styles.sitesPreviewText} numberOfLines={1}>
                            {item.plan.sites.map((s) => s.name).join(" · ")}
                          </Text>
                        </View>
                      )}

                      {/* Actions */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          style={styles.viewPlanBtn}
                          onPress={() => setActivePlan(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="eye-outline" size={15} color="#005EEC" />
                          <Text style={styles.viewPlanBtnText}>View Plan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.sharePlanBtn}
                          onPress={() => void handleShareItinerary(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="share-social-outline" size={15} color="#0F172A" />
                          <Text style={styles.sharePlanBtnText}>Share</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Saved Dive Sites Section */}
              {visibleSites.length > 0 && (
                <View style={styles.sectionBlock}>
                  {filter === "all" && visibleItineraries.length > 0 && (
                    <Text style={styles.sectionHeading}>
                      Favorite Dive Sites ({visibleSites.length})
                    </Text>
                  )}
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
                        onLike={() => void removeFavoriteSite(site.id)}
                        onPress={() =>
                          router.push({
                            pathname: "/dive-site/[id]",
                            params: { id: site.id },
                          })
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ContentContainer>
      </ScrollView>

      {/* Plan Detail Modal */}
      {activePlan && (
        <Modal
          visible={Boolean(activePlan)}
          transparent
          animationType="fade"
          onRequestClose={() => setActivePlan(null)}
        >
          <View style={styles.modalBackdrop}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setActivePlan(null)}
            />
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.modalEyebrow}>SINSAY AI ITINERARY</Text>
                  <Text style={styles.modalTitle}>{activePlan.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setActivePlan(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Overview */}
                {activePlan.plan.summary?.overview ? (
                  <Text style={styles.modalOverview}>
                    {activePlan.plan.summary.overview}
                  </Text>
                ) : null}

                {/* Daily Timeline */}
                {Array.isArray(activePlan.plan.days) && (
                  <View style={styles.timelineBlock}>
                    <Text style={styles.subHeading}>Daily Schedule</Text>
                    {activePlan.plan.days.map((day) => (
                      <View key={day.day} style={styles.daySection}>
                        <Text style={styles.dayHeader}>
                          Day {day.day}: {day.title}
                        </Text>
                        {day.activities?.map((act, idx) => (
                          <View key={idx} style={styles.actRow}>
                            <View style={styles.actDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.actTitle}>
                                {act.time} ({act.period}) — {act.title}
                              </Text>
                              {act.details ? (
                                <Text style={styles.actDetails}>{act.details}</Text>
                              ) : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                )}

                {/* Suggested Sites */}
                {Array.isArray(activePlan.plan.sites) &&
                  activePlan.plan.sites.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.subHeading}>Suggested Dive Sites</Text>
                      {activePlan.plan.sites.map((site) => (
                        <View key={site.name} style={styles.siteItem}>
                          <Text style={styles.siteItemName}>{site.name}</Text>
                          <Text style={styles.siteItemMeta}>
                            {[site.depth, site.difficulty].filter(Boolean).join(" · ")}
                          </Text>
                          {site.description ? (
                            <Text style={styles.siteItemDesc}>
                              {site.description}
                            </Text>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}

                {/* Eco alerts */}
                {Array.isArray(activePlan.plan.ecoAlerts) &&
                  activePlan.plan.ecoAlerts.length > 0 && (
                    <View style={styles.ecoBox}>
                      <Ionicons name="leaf-outline" size={18} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ecoBoxTitle}>Eco Reminders</Text>
                        {activePlan.plan.ecoAlerts.map((e) => (
                          <Text key={e} style={styles.ecoBoxText}>
                            • {e}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
              </ScrollView>

              {/* Modal footer actions */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalShareBtn}
                  onPress={() => void handleShareItinerary(activePlan)}
                >
                  <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.modalShareBtnText}>Share Itinerary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalDismissBtn}
                  onPress={() => setActivePlan(null)}
                >
                  <Text style={styles.modalDismissBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  scrollContent: { paddingBottom: 100 },
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
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    padding: 24,
  },
  emptyActionRow: {
    marginTop: 16,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  browseButtonText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  contentStack: {
    gap: 18,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeading: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 15,
    color: colors.navy,
    marginBottom: 2,
  },
  siteGrid: { width: "100%", gap: 14 },

  // Itinerary Card
  itineraryCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCE8F4",
    padding: 16,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  itineraryTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  itineraryIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  itineraryTitleCol: {
    flex: 1,
  },
  itineraryTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 15,
    color: "#0F172A",
    lineHeight: 20,
  },
  itineraryDate: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  deleteMiniBtn: {
    padding: 4,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  miniChip: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  miniChipText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 11,
    color: "#475569",
  },
  sitesPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  sitesPreviewText: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 12,
    color: "#64748B",
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 10,
  },
  viewPlanBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewPlanBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 13,
    color: "#005EEC",
  },
  sharePlanBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  sharePlanBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 13,
    color: "#334155",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalEyebrow: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 10,
    color: "#0284C7",
    letterSpacing: 0.8,
  },
  modalTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 17,
    color: "#0F172A",
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    flexGrow: 0,
    marginBottom: 14,
  },
  modalOverview: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 13,
    color: "#475569",
    lineHeight: 19,
    marginBottom: 14,
  },
  subHeading: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 14,
    color: colors.navy,
    marginBottom: 8,
  },
  timelineBlock: {
    marginBottom: 14,
  },
  daySection: {
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
  },
  dayHeader: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 13,
    color: colors.navy,
    marginBottom: 6,
  },
  actRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  actDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryBlue,
    marginTop: 6,
  },
  actTitle: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 12,
    color: "#0F172A",
  },
  actDetails: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  modalSection: {
    marginBottom: 14,
  },
  siteItem: {
    marginBottom: 8,
  },
  siteItemName: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 13,
    color: "#0F172A",
  },
  siteItemMeta: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 11,
    color: "#0284C7",
  },
  siteItemDesc: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  ecoBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  ecoBoxTitle: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 12,
    color: "#065F46",
    marginBottom: 4,
  },
  ecoBoxText: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 11,
    color: "#047857",
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
  },
  modalShareBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalShareBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 13,
    color: colors.white,
  },
  modalDismissBtn: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDismissBtnText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 13,
    color: "#475569",
  },
});
