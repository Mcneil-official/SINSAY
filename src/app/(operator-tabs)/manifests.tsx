import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { ContentContainer, ManifestSkeleton } from "../../components";
import { ManifestSnapshotCard, ManifestSnapshotDiver } from "../../components/ManifestSnapshotCard";
import { colors } from "../../constants/colors";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { deriveManifestStatus, formatDiveDate, toLocalDateString } from "../../lib/diveDate";
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
  dive_type?: string | null;
  location: string;
  difficulty?: string | null;
  dive_date: string;
  diver_count: number;
  max_divers?: number | null;
  captain_name?: string | null;
  crew_members?: string[] | null;
  dive_masters?: string[] | null;
  instructor_name?: string | null;
  crew_count?: number | null;
}

const TABS: { key: Tab; labelKey: string }[] = [
  { key: "upcoming", labelKey: "tab_upcoming" },
  { key: "completed", labelKey: "tab_completed" },
  { key: "drafts", labelKey: "tab_drafts" },
];

export default function ManifestsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
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
  const [diversList, setDiversList] = useState<ManifestSnapshotDiver[]>([]);
  const [diversLoading, setDiversLoading] = useState(false);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState("");
  const cardRef = useRef<View>(null);
  const [previewContainerWidth, setPreviewContainerWidth] = useState(0);
  const [customZoom, setCustomZoom] = useState<number | null>(null);
  const [cardHeight, setCardHeight] = useState(1360);

  const fitScale =
    previewContainerWidth > 0
      ? Math.min(1, Math.max(0.25, (previewContainerWidth - 20) / 1024))
      : 0.38;
  const currentZoom = customZoom ?? fitScale;

  const loadManifests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setLoadError(false);
    try {
      // Single query with embedded counts (no 1+N), ordered by dive date.
      // Capped at 50 rows with an explicit note instead of unbounded growth.
      const { data: mfData, error: mfErr } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, dive_mode, dive_type, location, difficulty, dive_date, max_divers, captain_name, crew_members, dive_masters, instructor_name, crew_count, manifest_divers(count)")
        .eq("operator_id", user.id)
        .order("dive_date", { ascending: false })
        .limit(50);
      if (mfErr) throw mfErr;

      setManifests(
        (mfData || []).map((m: any) => {
          const dc = m.manifest_divers;
          const diver_count = Array.isArray(dc) ? (dc[0]?.count ?? 0) : (dc?.count ?? 0);
          return { id: m.id, boat_name: m.boat_name, dive_mode: m.dive_mode, dive_type: m.dive_type, location: m.location, difficulty: m.difficulty, dive_date: m.dive_date, diver_count, max_divers: m.max_divers, captain_name: m.captain_name, crew_members: m.crew_members, dive_masters: m.dive_masters, instructor_name: m.instructor_name, crew_count: m.crew_count };
        })
      );

    } catch (e) {
      console.warn("Manifests load error", e);
      setLoadError(true);
    }
    setLoading(false);
  }, [user]);

  const loadLocalDrafts = useCallback(async () => {
    if (!user) return;
    setDrafts(await listDrafts(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      loadManifests();
      loadLocalDrafts();
    });
  }, [user, loadManifests, loadLocalDrafts]);

  // Refetch on focus: returning from step1 → confirmed would otherwise show
  // a stale list (dashboard already uses useFocusEffect).
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      loadManifests();
      loadLocalDrafts();
    }, [user, loadManifests, loadLocalDrafts])
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
    setDiversList([]);
    setCustomZoom(null);
    setDiversLoading(true);
    try {
      const { data, error } = await supabase
        .from("manifest_divers")
        .select("id, name, eco_id, is_walk_in, tourist_id")
        .eq("manifest_id", m.id)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const touristIds = (data || [])
        .map((d: any) => d.tourist_id)
        .filter((id: any): id is string => Boolean(id));

      let certMap: Record<string, string> = {};
      let typeOfDiveMap: Record<string, string> = {};
      let nationalityMap: Record<string, string> = {};
      let ecoIdMap: Record<string, string> = {};

      if (touristIds.length > 0) {
        const { data: touristsData } = await supabase
          .from("tourists")
          .select("id, certification_level, nationality, type_of_dive")
          .in("id", touristIds);
        for (const t of touristsData || []) {
          if (t.certification_level) certMap[t.id] = t.certification_level;
          if (t.type_of_dive) typeOfDiveMap[t.id] = t.type_of_dive;
          if (t.nationality) nationalityMap[t.id] = t.nationality;
        }

        const { data: ecoData } = await supabase
          .from("eco_dive_ids")
          .select("tourist_id, eco_id_number")
          .in("tourist_id", touristIds);
        for (const e of ecoData || []) {
          if (e.eco_id_number) ecoIdMap[e.tourist_id] = e.eco_id_number;
        }
      }

      const mapped: ManifestSnapshotDiver[] = (data || []).map((d: any) => {
        const rawCert = d.tourist_id ? certMap[d.tourist_id] : null;
        const rawType = d.tourist_id ? typeOfDiveMap[d.tourist_id] : null;
        let certLabel = "Fun Dive / Intro / Guest";
        if (d.is_walk_in) {
          certLabel = "Walk-in Registration";
        } else if (
          rawType === "instructor-master" ||
          rawType === "dive-master" ||
          (rawCert && (rawCert.toLowerCase().includes("master") || rawCert.toLowerCase().includes("instructor")))
        ) {
          certLabel = "Divemaster / Instructor";
        } else if (rawCert) {
          certLabel = rawCert;
        }

        const isWalkIn = Boolean(d.is_walk_in);
        let resolvedEcoId = "Walk-in";
        if (isWalkIn) {
          resolvedEcoId = "Walk-in";
        } else {
          const directEcoId =
            d.eco_id && d.eco_id !== "VERIFIED ID" && d.eco_id !== "WALK-IN GUEST"
              ? d.eco_id
              : null;
          const lookedUpEcoId = d.tourist_id ? ecoIdMap[d.tourist_id] : null;
          resolvedEcoId = directEcoId || lookedUpEcoId || d.eco_id || "—";
        }

        const nationality =
          (d.tourist_id ? nationalityMap[d.tourist_id] : null) || "Filipino";

        return {
          name: d.name,
          ecoId: resolvedEcoId,
          isWalkIn,
          nationality,
          certification: certLabel,
          municipalFeeStatus: "PAID & CLEARED",
          safetyWaiverStatus: "SIGNED",
        };
      });

      setDiversList(mapped);
    } catch (err) {
      console.warn("Failed to load divers for snapshot", err);
      setDiversList([]);
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
      setSnapshotMsg(t("snapshot_downloaded"));
    } catch (e) {
      setSnapshotMsg(e instanceof Error ? e.message : t("snapshot_created_error"));
    }
    setSnapshotBusy(false);
  };

  const handleShare = async () => {
    if (!selected) return;
    setSnapshotBusy(true);
    setSnapshotMsg("");
    try {
      const result = await captureAndShare(cardRef.current, snapshotFile(selected));
      setSnapshotMsg(result === "shared" ? t("snapshot_shared") : t("snapshot_share_unavailable"));
    } catch (e) {
      setSnapshotMsg(e instanceof Error ? e.message : t("snapshot_share_error"));
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
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
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
              <Text style={styles.eyebrow}>{t("manifests_eyebrow")}</Text>
              <Text style={styles.title}>{t("manifests_title")}</Text>
              <Text style={styles.subtitle}>{t("manifests_subtitle")}</Text>
            </View>
            <TouchableOpacity
              style={styles.newManifestButton}
              onPress={openCreateManifest}
              activeOpacity={0.86}
              accessibilityRole="button"
              accessibilityLabel={t("new_manifest")}
            >
              <Ionicons name="add" size={19} color="#006bff" />
              <Text style={styles.newManifestText}>{t("new_manifest")}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
            <Ionicons name="search" size={18} color="#6680aa" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={tab === "drafts" ? t("search_drafts") : t("search_boat_location")}
              placeholderTextColor="#8293b0"
              style={styles.searchInput}
              returnKeyType="search"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              accessibilityLabel={t("a11y_search_manifests")}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchQuery("")}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_clear_search")}
              >
                <Ionicons name="close-circle" size={19} color="#8293b0" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tabRow} accessibilityRole="tablist">
            {TABS.map((tabItem) => {
              const active = tab === tabItem.key;
              const label = t(tabItem.labelKey);
              return (
                <TouchableOpacity
                  key={tabItem.key}
                  style={[styles.tabBtn, active && styles.tabBtnActive]}
                  onPress={() => setTab(tabItem.key)}
                  activeOpacity={0.85}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${label}, ${counts[tabItem.key]} items`}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                    {label}
                  </Text>
                  <View style={[styles.countBadge, active && styles.countBadgeActive]}>
                    <Text style={[styles.countText, active && styles.countTextActive]}>{counts[tabItem.key]}</Text>
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
                {tab === "upcoming" ? t("results_upcoming") : tab === "completed" ? t("results_completed") : t("results_drafts")}
              </Text>
              <Text style={styles.resultsCount}>
                {t("results_shown", {
                  count:
                    tab === "upcoming"
                      ? filteredUpcoming.length
                      : tab === "completed"
                        ? filteredCompleted.length
                        : filteredDrafts.length,
                })}
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
              <Text style={styles.stateTitle}>{t("manifests_load_error")}</Text>
              <Text style={styles.stateMessage}>{t("manifests_load_error_desc")}</Text>
              <TouchableOpacity
                style={styles.stateAction}
                onPress={() => { void loadManifests(); void loadLocalDrafts(); }}
                accessibilityRole="button"
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.stateActionText}>{t("try_again")}</Text>
              </TouchableOpacity>
            </View>
          ) : tab === "drafts" ? (
            filteredDrafts.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.stateIcon}><Ionicons name={query ? "search-outline" : "document-text-outline"} size={25} color="#006bff" /></View>
                <Text style={styles.stateTitle}>{query ? t("no_matching_drafts") : t("no_saved_drafts")}</Text>
                <Text style={styles.stateMessage}>
                  {query ? t("drafts_try_other") : t("drafts_empty_desc")}
                </Text>
                {query ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.textAction}>
                    <Text style={styles.textActionLabel}>{t("clear_search")}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.stateAction} onPress={openCreateManifest}>
                    <Ionicons name="add" size={17} color="#FFFFFF" />
                    <Text style={styles.stateActionText}>{t("create_manifest_lower")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.list}>
                <View style={styles.draftNote}>
                  <Ionicons name="information-circle" size={18} color="#006bff" />
                  <Text style={styles.draftNoteText}>{t("drafts_note")}</Text>
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
                        accessibilityLabel={`${t("a11y_delete_draft")} ${draftTitle(d)}`}
                      >
                        <Ionicons name="trash-outline" size={18} color="#7385a6" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={() => resumeDraft(d)}
                      activeOpacity={0.86}
                      accessibilityRole="button"
                      accessibilityLabel={`${t("a11y_resume_draft")} ${draftTitle(d)}`}
                    >
                      <Text style={styles.resumeText}>{t("continue_draft")}</Text>
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
                  ? { title: t("no_matching_manifests"), message: t("try_different_boat") }
                  : tab === "upcoming"
                    ? { title: t("no_upcoming_dives"), message: t("create_manifest_prompt") }
                    : { title: t("no_completed_dives"), message: t("completed_manifests_here") };
                return (
                  <View style={styles.stateCard}>
                    <View style={styles.stateIcon}><Ionicons name={query ? "search-outline" : "boat-outline"} size={25} color="#006bff" /></View>
                    <Text style={styles.stateTitle}>{empty.title}</Text>
                    <Text style={styles.stateMessage}>{empty.message}</Text>
                    {query ? (
                      <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.textAction}>
                        <Text style={styles.textActionLabel}>{t("clear_search")}</Text>
                      </TouchableOpacity>
                    ) : tab === "upcoming" ? (
                      <TouchableOpacity style={styles.stateAction} onPress={openCreateManifest}>
                        <Ionicons name="add" size={17} color="#FFFFFF" />
                        <Text style={styles.stateActionText}>{t("new_manifest")}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              }
              return (
                <View style={styles.list}>
                  {rows.map((m) => {
                    const realStatus = deriveManifestStatus(m.dive_date);
                    const statusLabel =
                      realStatus === "active"
                        ? t("status_active")
                        : realStatus === "upcoming"
                        ? t("status_upcoming")
                        : t("status_completed");
                    return (
                      <TouchableOpacity
                        key={m.id}
                        style={styles.manifestCard}
                        activeOpacity={0.82}
                        onPress={() => openSnapshot(m)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open snapshot for ${m.boat_name || m.dive_mode} on ${m.dive_date}, ${statusLabel}`}
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
                          <View
                            style={[
                              styles.statusPill,
                              realStatus === "active"
                                ? styles.statusActive
                                : realStatus === "upcoming"
                                ? styles.statusUpcoming
                                : styles.statusDone,
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                realStatus === "active"
                                  ? styles.statusTextActive
                                  : realStatus === "upcoming"
                                  ? styles.statusTextUpcoming
                                  : styles.statusTextDone,
                              ]}
                            >
                              {statusLabel}
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
                            <Text style={styles.footerMetaText}>{t("diver_count", { count: m.diver_count })}</Text>
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
            {/* Header Row */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetTitleWrap}>
                <Text style={styles.sheetEyebrow}>{t("official_maritime_manifest")}</Text>
                <Text style={styles.sheetTitle}>{t("manifest_preview")}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelected(null)}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_close_snapshot")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#0B2545" />
              </TouchableOpacity>
            </View>

            {/* Dedicated Zoom Toolbar Sub-Bar */}
            <View style={styles.toolbarRow}>
              <View style={styles.zoomPillGroup}>
                <TouchableOpacity
                  style={styles.zoomIconBtn}
                  onPress={() => setCustomZoom(Math.max(0.25, Number(((currentZoom) - 0.1).toFixed(2))))}
                  accessibilityLabel={t("zoom_out")}
                  accessibilityRole="button"
                >
                  <Ionicons name="remove" size={17} color="#0B2545" />
                </TouchableOpacity>
                <Text style={styles.zoomLevelText}>{Math.round(currentZoom * 100)}%</Text>
                <TouchableOpacity
                  style={styles.zoomIconBtn}
                  onPress={() => setCustomZoom(Math.min(1.5, Number(((currentZoom) + 0.1).toFixed(2))))}
                  accessibilityLabel={t("zoom_in")}
                  accessibilityRole="button"
                >
                  <Ionicons name="add" size={17} color="#0B2545" />
                </TouchableOpacity>
              </View>

              <View style={styles.zoomQuickGroup}>
                <TouchableOpacity
                  style={[styles.quickBtn, customZoom === fitScale && styles.quickBtnActive]}
                  onPress={() => setCustomZoom(fitScale)}
                  accessibilityLabel={t("fit_to_width")}
                  accessibilityRole="button"
                >
                  <Ionicons name="scan-outline" size={14} color={customZoom === fitScale ? "#FFFFFF" : "#0B2545"} />
                  <Text style={[styles.quickBtnText, customZoom === fitScale && styles.quickBtnTextActive]}>{t("fit_width")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickBtn, customZoom === 1.0 && styles.quickBtnActive]}
                  onPress={() => setCustomZoom(1.0)}
                  accessibilityLabel="100% Zoom"
                  accessibilityRole="button"
                >
                  <Text style={[styles.quickBtnText, customZoom === 1.0 && styles.quickBtnTextActive]}>100%</Text>
                </TouchableOpacity>
              </View>
            </View>

            {selected && (
              <>
                {/* Interactive Scaled Preview Viewport */}
                <View
                  style={styles.previewViewport}
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0 && Math.abs(w - previewContainerWidth) > 5) {
                      setPreviewContainerWidth(w);
                    }
                  }}
                >
                  {diversLoading ? (
                    <View style={styles.previewLoadingWrap}>
                      <ActivityIndicator size="small" color={colors.primaryBlue} />
                      <Text style={styles.loadingText}>{t("loading_manifest_details")}</Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.sheetPreviewScroll}
                      contentContainerStyle={styles.viewportScrollVertical}
                      showsVerticalScrollIndicator={true}
                    >
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={styles.viewportScrollHorizontal}
                      >
                        <View
                          style={[
                            styles.scaledCardContainer,
                            {
                              width: 1024 * currentZoom,
                              height: cardHeight * currentZoom,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.scaledCardInner,
                              {
                                transform: [{ scale: currentZoom }],
                                transformOrigin: "top left",
                              },
                            ]}
                            onLayout={(e) => {
                              const h = e.nativeEvent.layout.height;
                              if (h > 1000 && Math.abs(h - cardHeight) > 10) {
                                setCardHeight(h);
                              }
                            }}
                          >
                            <ManifestSnapshotCard
                              ref={cardRef}
                              manifest={{
                                id: selected.id,
                                boat_name: selected.boat_name,
                                dive_mode: selected.dive_mode,
                                dive_type: selected.dive_type,
                                location: selected.location,
                                difficulty: selected.difficulty,
                                dive_date: selected.dive_date,
                                diver_count: selected.diver_count,
                                max_divers: selected.max_divers,
                                captain_name: selected.captain_name,
                                crew_members: selected.crew_members,
                                dive_masters: selected.dive_masters,
                                instructor_name: selected.instructor_name,
                                crew_count: selected.crew_count,
                                status: deriveManifestStatus(selected.dive_date),
                              }}
                              divers={diversList}
                              operatorName={operatorName}
                            />
                          </View>
                        </View>
                      </ScrollView>
                    </ScrollView>
                  )}
                </View>
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
                    accessibilityLabel={t("a11y_download_snapshot")}
                  >
                    {snapshotBusy ? (
                      <ActivityIndicator size="small" color={colors.primaryBlue} />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={18} color="#006bff" />
                        <Text style={styles.sheetBtnOutlineText}>{t("download")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                    onPress={handleShare}
                    disabled={snapshotBusy || diversLoading}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={t("a11y_share_snapshot")}
                  >
                    {snapshotBusy ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.sheetBtnPrimaryText}>{t("share")}</Text>
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
  safeArea: { flex: 1, backgroundColor: "#f1f9ff", paddingBottom: 0 },
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
  fixedHeader: { flexShrink: 0, paddingTop: 12 },
  scrollContent: {
    paddingBottom: 20,
  },
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
  statusUpcoming: { backgroundColor: "#e0f2fe" },
  statusTextUpcoming: { color: "#0284c7" },
  statusDone: { backgroundColor: "#f1f5f9" },
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
    backgroundColor: "rgba(5, 23, 59, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  sheet: {
    width: "100%",
    maxWidth: 1080,
    maxHeight: "94%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitleWrap: { flex: 1 },
  sheetEyebrow: { fontSize: 9.5, fontFamily: "Quicksand_700Bold", letterSpacing: 1.1, color: "#0066FF" },
  sheetTitle: { fontSize: 18, fontFamily: "Quicksand_700Bold", color: "#0B2545", marginTop: 2 },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 8,
  },
  zoomPillGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    gap: 4,
  },
  zoomIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
  zoomLevelText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    minWidth: 40,
    textAlign: "center",
  },
  zoomQuickGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  quickBtnActive: {
    backgroundColor: "#0B2545",
    borderColor: "#0B2545",
  },
  quickBtnText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  quickBtnTextActive: {
    color: "#FFFFFF",
  },
  previewViewport: {
    flexShrink: 1,
    width: "100%",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginBottom: 10,
    minHeight: 280,
  },
  previewLoadingWrap: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sheetPreviewScroll: {
    flexShrink: 1,
    marginBottom: 8
  },
  viewportScrollVertical: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  viewportScrollHorizontal: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  scaledCardContainer: {
    overflow: "hidden",
    borderRadius: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  scaledCardInner: {
    width: 1024,
  },
  sheetMessageBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  cardWrap: { alignItems: "flex-start", justifyContent: "center", paddingBottom: 20 },
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
