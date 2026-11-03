import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { ContentContainer, ManifestSkeleton } from "../../components";
import { ManifestSnapshotCard } from "../../components/ManifestSnapshotCard";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { deriveStatus, formatDiveDate, toLocalDateString } from "../../lib/diveDate";
import {
  deleteDraft,
  draftSubtitle,
  draftTitle,
  listDrafts,
  type ManifestDraft,
} from "../../lib/manifestDrafts";
import { captureAndDownload, captureAndShare } from "../../lib/snapshot";
import { supabase } from "../../lib/supabase";

type Tab = "upcoming" | "completed" | "drafts";

interface ManifestItem {
  id: string;
  boat_name: string | null;
  dive_mode: string;
  location: string;
  dive_date: string;
  diver_count: number;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
  { key: "drafts", label: "Drafts" },
];

export default function ManifestsScreen() {
  const router = useRouter();
  const { user, operatorApplication } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [drafts, setDrafts] = useState<ManifestDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const operatorName = operatorApplication?.resort_name || "Operator";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Snapshot sheet state
  const [selected, setSelected] = useState<ManifestItem | null>(null);
  const [diverNames, setDiverNames] = useState<string[]>([]);
  const [diversLoading, setDiversLoading] = useState(false);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState("");
  const cardRef = useRef<View>(null);

  const loadManifests = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // Single query with embedded counts (no 1+N), ordered by dive date.
      // Capped at 50 rows with an explicit note instead of unbounded growth.
      const { data: mfData, error: mfErr } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, dive_mode, location, dive_date, manifest_divers(count)")
        .eq("operator_id", user!.id)
        .order("dive_date", { ascending: false })
        .limit(50);
      if (mfErr) throw mfErr;

      setManifests(
        (mfData || []).map((m: {
          id: string; boat_name: string | null; dive_mode: string; location: string; dive_date: string;
          manifest_divers?: { count: number }[] | { count: number };
        }) => {
          const dc = m.manifest_divers;
          const diver_count = Array.isArray(dc) ? (dc[0]?.count ?? 0) : (dc?.count ?? 0);
          return { id: m.id, boat_name: m.boat_name, dive_mode: m.dive_mode, location: m.location, dive_date: m.dive_date, diver_count };
        })
      );

    } catch (e) {
      console.warn("Manifests load error", e);
      setLoadError(true);
    }
    setLoading(false);
  };

  const loadLocalDrafts = async () => {
    if (!user) return;
    setDrafts(await listDrafts(user.id));
  };

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      loadManifests();
      loadLocalDrafts();
    });
  }, [user]);

  // Refetch on focus: returning from step1 → confirmed would otherwise show
  // a stale list (dashboard already uses useFocusEffect).
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadManifests();
      loadLocalDrafts();
    }, [user])
  );

  const todayStr = toLocalDateString(new Date());
  const upcoming = manifests.filter((m) => m.dive_date >= todayStr);
  const completed = manifests.filter((m) => m.dive_date < todayStr);
  const query = searchQuery.trim().toLocaleLowerCase();
  const filterManifest = (m: ManifestItem) =>
    !query || `${m.boat_name || m.dive_mode} ${m.location}`.toLocaleLowerCase().includes(query);
  const filteredUpcoming = upcoming.filter(filterManifest);
  const filteredCompleted = completed.filter(filterManifest);
  const filteredDrafts = drafts.filter(
    (d) =>
      !query ||
      `${draftTitle(d)} ${draftSubtitle(d)}`.toLocaleLowerCase().includes(query),
  );

  const openSnapshot = async (m: ManifestItem) => {
    setSelected(m);
    setSnapshotMsg("");
    setDiverNames([]);
    setDiversLoading(true);
    try {
      const { data, error } = await supabase
        .from("manifest_divers")
        .select("name")
        .eq("manifest_id", m.id)
        .order("name");
      if (error) throw error;
      setDiverNames((data || []).map((d: { name: string }) => d.name));
    } catch {
      setDiverNames([]);
    }
    setDiversLoading(false);
  };

  const snapshotFile = (m: ManifestItem) =>
    `manifesto-${m.dive_date}-${(m.boat_name || m.dive_mode || "dive-group").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;

  const handleDownload = async () => {
    if (!selected) return;
    setSnapshotBusy(true);
    setSnapshotMsg("");
    try {
      await captureAndDownload(cardRef.current, snapshotFile(selected));
      setSnapshotMsg("Snapshot downloaded.");
    } catch (e) {
      setSnapshotMsg(e instanceof Error ? e.message : "Couldn't create the snapshot.");
    }
    setSnapshotBusy(false);
  };

  const handleShare = async () => {
    if (!selected) return;
    setSnapshotBusy(true);
    setSnapshotMsg("");
    try {
      const result = await captureAndShare(cardRef.current, snapshotFile(selected));
      setSnapshotMsg(result === "shared" ? "Snapshot shared." : "Snapshot downloaded (sharing unavailable).");
    } catch (e) {
      setSnapshotMsg(e instanceof Error ? e.message : "Couldn't share the snapshot.");
    }
    setSnapshotBusy(false);
  };

  const resumeDraft = (d: ManifestDraft) => {
    router.push({
      pathname: "/establishment/create-manifest/step1",
      params: { draft: JSON.stringify(d.form), draftId: d.id },
    });
  };

  const removeDraft = async (d: ManifestDraft) => {
    if (!user) return;
    await deleteDraft(user.id, d.id);
    setDrafts((prev) => prev.filter((x) => x.id !== d.id));
  };

  const counts: Record<Tab, number> = {
    upcoming: upcoming.length,
    completed: completed.length,
    drafts: drafts.length,
  };

  const openCreateManifest = () =>
    router.push("/establishment/create-manifest/step1");

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerBackground} pointerEvents="none">
        <Svg
          width="100%"
          height={245}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="screenTopGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0061f5" />
              <Stop offset="0.3" stopColor="#208bff" />
              <Stop offset="0.6" stopColor="#97ddfa" />
              <Stop offset="0.85" stopColor="#e4f5ff" />
              <Stop offset="1" stopColor="#f1f9ff" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height={245} fill="url(#screenTopGrad)" />
        </Svg>
        <Svg
          viewBox="0 0 1024 496"
          preserveAspectRatio="none"
          style={styles.headerWaveSvg}
        >
          <Path
            d="M0 296C170 226 320 396 490 258 C700 86 791 90 878 85C951 77 1000 34 1024 0 V496H0Z"
            fill="#FFFFFF"
            opacity={0.16}
          />
        </Svg>
      </View>

      <View style={styles.fixedHeader}>
        <ContentContainer maxWidth={480} paddingH={14}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>OPERATOR TOOLS</Text>
              <Text style={styles.title}>Dive Manifests</Text>
              <Text style={styles.subtitle}>Plan and manage your dive trips</Text>
            </View>
            <TouchableOpacity
              style={styles.newManifestButton}
              onPress={openCreateManifest}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel="Create a new dive manifest"
            >
              <Ionicons name="add" size={19} color="#006bff" />
              <Text style={styles.newManifestText}>New Manifest</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Ionicons name="search" size={18} color="#6680aa" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={tab === "drafts" ? "Search drafts" : "Search boat or location"}
              placeholderTextColor="#8293b0"
              style={styles.searchInput}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              accessibilityLabel="Search manifests by boat or location"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={19} color="#8293b0" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabRow} accessibilityRole="tablist">
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setTab(t.key)}
                  activeOpacity={0.85}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${t.label}, ${counts[t.key]} items`}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                    {t.label}
                  </Text>
                  <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                    <Text style={[styles.countText, active && styles.countTextActive]}>{counts[t.key]}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ContentContainer>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer maxWidth={480} paddingH={14}>
          {!loading && !loadError && (
            <View style={styles.resultsHeading}>
              <Text style={styles.resultsTitle}>
                {tab === "upcoming" ? "Upcoming dives" : tab === "completed" ? "Completed dives" : "Saved drafts"}
              </Text>
              <Text style={styles.resultsCount}>
                {tab === "upcoming" ? filteredUpcoming.length : tab === "completed" ? filteredCompleted.length : filteredDrafts.length} shown
              </Text>
            </View>
          )}

          {loading ? (
            <View accessibilityLabel="Loading manifests">
              <ManifestSkeleton />
              <ManifestSkeleton />
              <ManifestSkeleton />
            </View>
          ) : loadError ? (
            <View style={styles.stateCard}>
              <View style={styles.stateIcon}><Ionicons name="cloud-offline-outline" size={25} color="#006bff" /></View>
              <Text style={styles.stateTitle}>Couldn't load manifests</Text>
              <Text style={styles.stateMessage}>Check your connection and try again.</Text>
              <TouchableOpacity
                style={styles.stateAction}
                onPress={() => { void loadManifests(); void loadLocalDrafts(); }}
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.stateActionText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : tab === "drafts" ? (
            filteredDrafts.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIcon}><Ionicons name={query ? "search-outline" : "document-text-outline"} size={25} color="#006bff" /></View>
                <Text style={styles.stateTitle}>{query ? "No matching drafts" : "No saved drafts"}</Text>
                <Text style={styles.stateMessage}>
                  {query ? "Try another boat name or location." : "Unsubmitted forms save on this device and won't use passes until submitted."}
                </Text>
                {query ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.textAction}>
                    <Text style={styles.textActionLabel}>Clear search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.stateAction} onPress={openCreateManifest}>
                    <Ionicons name="add" size={17} color="#FFFFFF" />
                    <Text style={styles.stateActionText}>Create manifest</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.list}>
                <View style={styles.draftNote}>
                  <Ionicons name="information-circle" size={18} color="#006bff" />
                  <Text style={styles.draftNoteText}>Drafts are saved on this device and do not consume passes.</Text>
                </View>
                {filteredDrafts.map((d) => (
                  <View key={d.id} style={styles.draftCard}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.icon}>
                        <Ionicons name="document-text" size={19} color="#006bff" />
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{draftTitle(d)}</Text>
                        <Text style={styles.rowMeta} numberOfLines={2}>{draftSubtitle(d)}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => removeDraft(d)}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete draft ${draftTitle(d)}`}
                      >
                        <Ionicons name="trash-outline" size={18} color="#7385a6" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={() => resumeDraft(d)}
                      activeOpacity={0.86}
                      accessibilityRole="button"
                      accessibilityLabel={`Resume draft ${draftTitle(d)}`}
                    >
                      <Text style={styles.resumeText}>Continue draft</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )
          ) : (
            (() => {
              const rows = tab === "upcoming" ? filteredUpcoming : filteredCompleted;
              if (rows.length === 0) {
                const empty = query
                  ? { title: "No matching manifests", message: "Try a different boat name or location." }
                  : tab === "upcoming"
                    ? { title: "No upcoming dives", message: "Create a manifest to organize your next trip." }
                    : { title: "No completed dives yet", message: "Completed manifests will appear here." };
                return (
                  <View style={styles.stateCard}>
                    <View style={styles.stateIcon}><Ionicons name={query ? "search-outline" : "boat-outline"} size={25} color="#006bff" /></View>
                    <Text style={styles.stateTitle}>{empty.title}</Text>
                    <Text style={styles.stateMessage}>{empty.message}</Text>
                    {query ? (
                      <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.textAction}>
                        <Text style={styles.textActionLabel}>Clear search</Text>
                      </TouchableOpacity>
                    ) : tab === "upcoming" ? (
                      <TouchableOpacity style={styles.stateAction} onPress={openCreateManifest}>
                        <Ionicons name="add" size={17} color="#FFFFFF" />
                        <Text style={styles.stateActionText}>New Manifest</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              }
              return (
                <View style={styles.list}>
                  {rows.map((m) => {
                    const active = deriveStatus(m.dive_date) === "active";
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.manifestCard}
                        activeOpacity={0.82}
                        onPress={() => openSnapshot(m)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open snapshot for ${m.boat_name || m.dive_mode} on ${m.dive_date}`}
                      >
                        <View style={styles.cardTopRow}>
                          <View style={styles.icon}>
                            <Ionicons name={m.dive_mode === "Boat Dive" ? "boat" : m.dive_mode === "Night Dive" ? "moon" : "umbrella"} size={19} color="#006bff" />
                          </View>
                          <View style={styles.info}>
                            <Text style={styles.rowTitle} numberOfLines={1}>{m.boat_name || m.dive_mode || "Dive Group"}</Text>
                            <View style={styles.locationRow}>
                              <Ionicons name="location-outline" size={13} color="#7385a6" />
                              <Text style={styles.locationText} numberOfLines={1}>{m.location}</Text>
                            </View>
                          </View>
                          <View style={[styles.statusPill, active ? styles.statusActive : styles.statusDone]}>
                            <Text style={[styles.statusText, active ? styles.statusTextActive : styles.statusTextDone]}>
                              {active ? "Upcoming" : "Completed"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.cardFooter}>
                          <View style={styles.metaItem}>
                            <Ionicons name="calendar-outline" size={15} color="#006bff" />
                            <Text style={styles.footerMetaText}>{formatDiveDate(m.dive_date)}</Text>
                          </View>
                          <View style={styles.metaItem}>
                            <Ionicons name="people-outline" size={15} color="#006bff" />
                            <Text style={styles.footerMetaText}>{m.diver_count} divers</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={17} color="#8ba0c2" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()
          )}
        </ContentContainer>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Snapshot sheet */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleWrap}>
                <Text style={styles.sheetEyebrow}>MANIFESTO PREVIEW</Text>
                <Text style={styles.sheetTitle}>Share dive details</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelected(null)}
                accessibilityRole="button"
                accessibilityLabel="Close snapshot"
              >
                <Ionicons name="close" size={21} color="#31466e" />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <ScrollView style={styles.sheetPreviewScroll} showsVerticalScrollIndicator={false}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cardWrap}
                  >
                    {diversLoading ? (
                      <ActivityIndicator size="small" color={colors.primaryBlue} />
                    ) : (
                      <ManifestSnapshotCard
                        ref={cardRef}
                        manifest={{
                          id: selected.id,
                          boat_name: selected.boat_name,
                          dive_mode: selected.dive_mode,
                          location: selected.location,
                          dive_date: selected.dive_date,
                          diver_count: selected.diver_count,
                          status: deriveStatus(selected.dive_date),
                        }}
                        divers={diverNames}
                        operatorName={operatorName}
                      />
                    )}
                  </ScrollView>
                </ScrollView>
                {snapshotMsg ? (
                  <View style={styles.sheetMessageBox}>
                    <Ionicons name="checkmark-circle" size={17} color="#129b83" />
                    <Text style={styles.sheetMsg}>{snapshotMsg}</Text>
                  </View>
                ) : null}
                <View style={styles.sheetBtns}>
                  <TouchableOpacity
                    style={[styles.sheetBtn, styles.sheetBtnOutline]}
                    onPress={handleDownload}
                    disabled={snapshotBusy || diversLoading}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel="Download snapshot image"
                  >
                    {snapshotBusy ? (
                      <ActivityIndicator size="small" color={colors.primaryBlue} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={18} color="#006bff" />
                        <Text style={styles.sheetBtnOutlineText}>Download</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                    onPress={handleShare}
                    disabled={snapshotBusy || diversLoading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Share snapshot image"
                  >
                    {snapshotBusy ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.sheetBtnPrimaryText}>Share</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f1f9ff" },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 245,
    overflow: "hidden",
  },
  headerWaveSvg: {
    position: "absolute",
    top: 10,
    left: 0,
    width: "100%",
    height: 190,
  },
  container: { flex: 1, minHeight: 0 },
  fixedHeader: { flexShrink: 0, paddingTop: 20 },
  scrollContent: { paddingBottom: 20 },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 18,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 9,
    fontWeight: "800",
    color: "rgba(255,255,255,0.82)",
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  title: {
    fontSize: 23,
    lineHeight: 28,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  newManifestButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0045b9",
    shadowOpacity: 0.17,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  newManifestText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  searchBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#deebfa",
    marginBottom: 12,
    shadowColor: "#3479ba",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  searchBoxFocused: {
    borderColor: "#1682ff",
    shadowColor: "#1682ff",
    shadowOpacity: 0.12,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    paddingVertical: 0,
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#07156c",
    outlineStyle: "none" as any,
    outlineWidth: 0,
    ...(Platform.OS === "web" ? { WebkitTapHighlightColor: "transparent" } as any : {}),
  },
  clearSearchButton: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.67)",
    borderRadius: 15,
    padding: 4,
    gap: 3,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
  },
  tabBtn: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 11,
    paddingHorizontal: 3,
  },
  tabBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#2865a6",
    shadowOpacity: 0.11,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    flexShrink: 1,
    fontSize: 10.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#597092",
  },
  tabTextActive: { color: "#07156c", fontFamily: "Quicksand_700Bold" },
  countBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    backgroundColor: "#e9f2ff",
  },
  countBadgeActive: { backgroundColor: "#006bff" },
  countText: { fontSize: 9, fontFamily: "Quicksand_700Bold", color: "#5274a7" },
  countTextActive: { color: "#FFFFFF" },
  resultsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
    paddingHorizontal: 2,
  },
  resultsTitle: { fontSize: 14, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  resultsCount: { fontSize: 10, fontFamily: "Quicksand_500Medium", color: "#7183a4" },
  list: { gap: 10 },
  manifestCard: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(111,185,237,0.27)",
    shadowColor: "#4089dc",
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  draftCard: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 18,
    padding: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(111,185,237,0.27)",
    shadowColor: "#4089dc",
    shadowOpacity: 0.1,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: "#e7f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  rowMeta: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: "Quicksand_500Medium",
    color: "#637697",
    marginTop: 3,
  },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: {
    flex: 1,
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#637697",
  },
  statusPill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 },
  statusActive: { backgroundColor: "#dcfce7" },
  statusDone: { backgroundColor: "#e9efff" },
  statusText: { fontSize: 9, fontFamily: "Quicksand_700Bold" },
  statusTextActive: { color: "#16835e" },
  statusTextDone: { color: "#5368b1" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "#e9f0fa",
    marginTop: 11,
    paddingTop: 9,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  footerMetaText: { fontSize: 10.5, fontFamily: "Quicksand_600SemiBold", color: "#526789" },
  draftNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: "#e7f3ff",
    marginBottom: 1,
  },
  draftNoteText: { flex: 1, fontSize: 10.5, lineHeight: 15, fontFamily: "Quicksand_500Medium", color: "#315b92" },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f6fb",
  },
  resumeBtn: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 13,
    backgroundColor: "#087bff",
  },
  resumeText: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
  stateCard: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 27,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(111,185,237,0.25)",
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#4089dc",
    shadowOpacity: 0.08,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  stateIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f3ff",
    marginBottom: 12,
  },
  stateTitle: { fontSize: 15, fontFamily: "Quicksand_700Bold", color: "#07156c", textAlign: "center" },
  stateMessage: { fontSize: 11.5, lineHeight: 17, fontFamily: "Quicksand_500Medium", color: "#647797", textAlign: "center", marginTop: 5 },
  stateAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: "#087bff",
    marginTop: 16,
  },
  stateActionText: { fontSize: 11.5, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
  textAction: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, marginTop: 8 },
  textActionLabel: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  loadingCard: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  loadingText: { fontSize: 11, fontFamily: "Quicksand_500Medium", color: "#647797" },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,23,59,0.58)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "92%",
    backgroundColor: "#f4f9ff",
    borderRadius: 23,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  sheetTitleWrap: { flex: 1 },
  sheetEyebrow: { fontSize: 8.5, fontFamily: "Quicksand_700Bold", letterSpacing: 0.8, color: "#1682ff" },
  sheetTitle: { fontSize: 16, fontFamily: "Quicksand_700Bold", color: "#07156c", marginTop: 2 },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f3ff",
  },
  sheetPreviewScroll: { flexShrink: 1 },
  cardWrap: { alignItems: "flex-start", justifyContent: "center", paddingBottom: 8 },
  sheetMessageBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  sheetMsg: { flexShrink: 1, fontSize: 11, fontFamily: "Quicksand_600SemiBold", color: "#16835e", textAlign: "center" },
  sheetBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  sheetBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: "row",
    gap: 7,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnOutline: { borderWidth: 1.5, borderColor: "#8bbdff", backgroundColor: "#FFFFFF" },
  sheetBtnOutlineText: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  sheetBtnPrimary: { backgroundColor: "#087bff" },
  sheetBtnPrimaryText: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
});
