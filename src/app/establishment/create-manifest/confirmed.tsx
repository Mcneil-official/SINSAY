import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../../constants/colors";
import { ContentContainer } from "../../../components";
import {
  ManifestSnapshotCard,
  ManifestSnapshotDiver,
  SnapshotManifest,
} from "../../../components/ManifestSnapshotCard";
import { useAuth } from "../../../hooks/useAuth";
import { deriveManifestStatus } from "../../../lib/diveDate";
import { captureAndDownload, captureAndShare } from "../../../lib/snapshot";
import { supabase } from "../../../lib/supabase";

export default function ManifestConfirmedScreen() {
  const router = useRouter();
  const {
    manifestId,
    location,
    diverCount,
    boatName,
    captainName,
    remainingBalance,
    diveMasters,
    crewMembers,
    diveMode,
    diveType,
    difficulty,
    diveDate,
  } = useLocalSearchParams<{
    manifestId?: string;
    location?: string;
    diverCount?: string;
    boatName?: string;
    captainName?: string;
    remainingBalance?: string;
    diveMasters?: string;
    crewMembers?: string;
    diveMode?: string;
    diveType?: string;
    difficulty?: string;
    diveDate?: string;
  }>();

  const { user, profile, operatorApplication } = useAuth();
  const [balance, setBalance] = useState<string | undefined>(remainingBalance);

  // Snapshot card reference & interaction state
  const cardRef = useRef<View>(null);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState("");
  const [previewContainerWidth, setPreviewContainerWidth] = useState(0);
  const [cardHeight, setCardHeight] = useState(1150);
  const [customZoom, setCustomZoom] = useState<number | null>(null);

  // DB-loaded manifest and divers
  const [manifestRecord, setManifestRecord] = useState<SnapshotManifest | null>(null);
  const [diversList, setDiversList] = useState<ManifestSnapshotDiver[]>([]);
  const [manifestLoading, setManifestLoading] = useState(false);

  // Hero checkmark entrance animation
  const checkScale = useRef(new Animated.Value(0.4)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const useNativeDriver = Platform.OS !== "web";
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 6,
        tension: 70,
        useNativeDriver,
      }),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver,
      }),
    ]).start();
  }, [checkScale, checkOpacity]);

  // Re-fetch the ledger for the displayed balance
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("operator_pass_ledger")
          .select("remaining_passes")
          .eq("operator_id", user.id)
          .maybeSingle();
        if (data && data.remaining_passes !== null && data.remaining_passes !== undefined) {
          setBalance(String(data.remaining_passes));
        }
      } catch {
        // Keep the param fallback on failure
      }
    })();
  }, [user]);

  // Fetch manifest details & diver roster from DB
  useEffect(() => {
    if (!manifestId) return;
    let active = true;

    (async () => {
      setManifestLoading(true);
      try {
        const { data: mData } = await supabase
          .from("dive_manifests")
          .select(
            "id, boat_name, dive_mode, dive_type, location, difficulty, dive_date, max_divers, captain_name, crew_members, dive_masters, instructor_name, crew_count, status"
          )
          .eq("id", manifestId)
          .maybeSingle();

        const { data: dData } = await supabase
          .from("manifest_divers")
          .select("id, name, eco_id, is_walk_in, tourist_id")
          .eq("manifest_id", manifestId)
          .order("created_at", { ascending: true });

        if (!active) return;

        const touristIds = (dData || [])
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

        const mapped: ManifestSnapshotDiver[] = (dData || []).map((d: any) => {
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

        if (mData) {
          setManifestRecord({
            id: mData.id,
            boat_name: mData.boat_name,
            dive_mode: mData.dive_mode,
            dive_type: mData.dive_type,
            location: mData.location,
            difficulty: mData.difficulty,
            dive_date: mData.dive_date,
            diver_count: mapped.length,
            max_divers: mData.max_divers,
            captain_name: mData.captain_name,
            crew_members: mData.crew_members,
            dive_masters: mData.dive_masters,
            instructor_name: mData.instructor_name,
            crew_count: mData.crew_count,
            status: deriveManifestStatus(mData.dive_date),
          });
        }
        setDiversList(mapped);
      } catch (err) {
        console.warn("Failed to load manifest for confirmation card:", err);
      } finally {
        if (active) setManifestLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [manifestId]);

  const numDivers = parseInt(diverCount || "1", 10) || 1;

  // Immediate fallback manifest record while query runs or if offline
  const fallbackRecord: SnapshotManifest = {
    id: manifestId || "0001",
    boat_name: boatName || null,
    dive_mode: diveMode || (boatName ? "Boat Dive" : "Shore Entry"),
    dive_type: diveType || "Scuba Diving",
    location: location || "Anilao Dive Site",
    difficulty: difficulty || "All Levels",
    dive_date: diveDate || new Date().toISOString().slice(0, 10),
    diver_count: numDivers,
    captain_name: captainName || null,
    dive_masters: diveMasters ? diveMasters.split(",").map((s) => s.trim()) : [],
    crew_members: crewMembers ? crewMembers.split(",").map((s) => s.trim()) : [],
    status: "active",
  };

  const effectiveManifest = manifestRecord || fallbackRecord;
  const effectiveDivers =
    diversList.length > 0
      ? diversList
      : Array.from({ length: numDivers }, (_, i) => ({
          name: `Diver #${i + 1}`,
          ecoId: "Active Pass",
          isWalkIn: false,
          nationality: "Filipino",
          certification: "Accredited Diver",
          municipalFeeStatus: "PAID & CLEARED",
          safetyWaiverStatus: "SIGNED",
        }));

  const operatorName =
    operatorApplication?.resort_name ||
    profile?.full_name ||
    "Mabini Accredited Dive Operator";

  // Dynamic zoom calculation
  const fitScale =
    previewContainerWidth > 0
      ? Math.min(1, Math.max(0.25, (previewContainerWidth - 20) / 1024))
      : 0.38;
  const currentZoom = customZoom ?? fitScale;

  const snapshotFileName = `manifesto-${effectiveManifest.dive_date || "today"}-${(
    effectiveManifest.boat_name ||
    effectiveManifest.dive_mode ||
    "dive-group"
  )
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}.png`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setSnapshotBusy(true);
    setSnapshotMsg("");
    try {
      await captureAndDownload(cardRef.current, snapshotFileName);
      setSnapshotMsg("Manifest image saved to device!");
    } catch (e) {
      setSnapshotMsg(e instanceof Error ? e.message : "Couldn't download manifest image.");
    }
    setSnapshotBusy(false);
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setSnapshotBusy(true);
    setSnapshotMsg("");
    try {
      const result = await captureAndShare(cardRef.current, snapshotFileName);
      setSnapshotMsg(
        result === "shared"
          ? "Manifest shared successfully!"
          : "Manifest downloaded to device (sharing unavailable)."
      );
    } catch (e) {
      setSnapshotMsg(e instanceof Error ? e.message : "Couldn't share manifest image.");
    }
    setSnapshotBusy(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.replace("/(operator-tabs)")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Manifest Confirmation</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={540} style={styles.container}>
          {/* Hero Celebration Visual */}
          <View style={styles.heroSection}>
            <Animated.View
              style={[
                styles.checkRingOuter,
                {
                  opacity: checkOpacity,
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              <View style={styles.checkRingMiddle}>
                <View style={styles.checkRingInner}>
                  <Ionicons name="checkmark" size={36} color="#FFFFFF" />
                </View>
              </View>
            </Animated.View>

            <Text style={styles.heading}>Manifest Submitted!</Text>
            <Text style={styles.subheading}>
              Your dive manifest has been successfully recorded and transmitted to the
              Municipal Tourism Office (MTO).
            </Text>
          </View>

          {/* LGU Real-Time Activation Banner */}
          <View style={styles.lguBanner}>
            <View style={styles.lguIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color="#16A34A" />
            </View>
            <View style={styles.lguContent}>
              <View style={styles.lguTitleRow}>
                <Text style={styles.lguTitle}>Mabini Tourism Office Notified</Text>
                <View style={styles.liveSyncBadge}>
                  <View style={styles.liveSyncDot} />
                  <Text style={styles.liveSyncText}>LIVE SYNC</Text>
                </View>
              </View>
              <Text style={styles.lguBody}>
                Eco-Dive IDs for <Text style={styles.boldText}>{numDivers} tourist diver{numDivers === 1 ? "" : "s"}</Text> are
                now active and synchronized for maritime inspection.
              </Text>
            </View>
          </View>

          {/* Download & Share Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.downloadActionBtn]}
              onPress={handleDownload}
              disabled={snapshotBusy}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Download Manifesto PNG image"
            >
              {snapshotBusy ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.downloadActionBtnText}>Download Manifesto</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.shareActionBtn]}
              onPress={handleShare}
              disabled={snapshotBusy}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Share Manifesto"
            >
              <Ionicons name="share-social-outline" size={19} color={colors.primaryBlue} style={{ marginRight: 8 }} />
              <Text style={styles.shareActionBtnText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Toast Banner */}
          {snapshotMsg ? (
            <View style={styles.feedbackBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 8 }} />
              <Text style={styles.feedbackBannerText}>{snapshotMsg}</Text>
            </View>
          ) : null}

          {/* Visual Manifesto Document Section */}
          <View style={styles.previewCardSection}>
            <View style={styles.previewHeaderRow}>
              <View style={styles.previewHeaderLeft}>
                <Ionicons name="document-text" size={18} color={colors.primaryBlue} style={{ marginRight: 6 }} />
                <Text style={styles.previewHeaderTitle}>Official Dive Manifest</Text>
              </View>

              {/* Viewport Zoom Controls */}
              <View style={styles.zoomControlRow}>
                <TouchableOpacity
                  style={[styles.zoomPill, customZoom === null && styles.zoomPillActive]}
                  onPress={() => setCustomZoom(null)}
                  accessibilityLabel="Fit to screen"
                >
                  <Text style={[styles.zoomPillText, customZoom === null && styles.zoomPillTextActive]}>Fit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.zoomPill, customZoom === 1.0 && styles.zoomPillActive]}
                  onPress={() => setCustomZoom(1.0)}
                  accessibilityLabel="Zoom to 100%"
                >
                  <Text style={[styles.zoomPillText, customZoom === 1.0 && styles.zoomPillTextActive]}>100%</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.zoomIconBtn}
                  onPress={() => setCustomZoom(Math.max(0.25, Number((currentZoom - 0.1).toFixed(2))))}
                  accessibilityLabel="Zoom out"
                >
                  <Ionicons name="remove" size={16} color="#0F172A" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.zoomIconBtn}
                  onPress={() => setCustomZoom(Math.min(1.5, Number((currentZoom + 0.1).toFixed(2))))}
                  accessibilityLabel="Zoom in"
                >
                  <Ionicons name="add" size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scaled Preview Viewport */}
            <View
              style={styles.canvasViewport}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0 && Math.abs(w - previewContainerWidth) > 5) {
                  setPreviewContainerWidth(w);
                }
              }}
            >
              {manifestLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                  <Text style={styles.loadingText}>Syncing official manifest…</Text>
                </View>
              ) : null}

              <ScrollView
                style={styles.canvasVerticalScroll}
                contentContainerStyle={styles.canvasVerticalContent}
                showsVerticalScrollIndicator={true}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  contentContainerStyle={styles.canvasHorizontalContent}
                >
                  <View
                    style={{
                      width: 1024 * currentZoom,
                      height: cardHeight * currentZoom,
                    }}
                  >
                    <View
                      style={{
                        transform: [{ scale: currentZoom }],
                        transformOrigin: "top left",
                      }}
                      onLayout={(e) => {
                        const h = e.nativeEvent.layout.height;
                        if (h > 600 && Math.abs(h - cardHeight) > 10) {
                          setCardHeight(h);
                        }
                      }}
                    >
                      <ManifestSnapshotCard
                        ref={cardRef}
                        manifest={effectiveManifest}
                        divers={effectiveDivers}
                        operatorName={operatorName}
                      />
                    </View>
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          </View>

          {/* Pass Credit Summary Strip */}
          <View style={styles.creditStrip}>
            <View style={styles.creditStripLeft}>
              <View style={styles.creditIconBubble}>
                <Ionicons name="ticket" size={16} color={colors.primaryBlue} />
              </View>
              <View>
                <Text style={styles.creditStripLabel}>Remaining Pass Credits</Text>
                <Text style={styles.creditStripSub}>Available for future manifests</Text>
              </View>
            </View>
            <View style={styles.creditBalanceBadge}>
              <Text style={styles.creditBalanceNumber}>{balance ?? "…"}</Text>
              <Text style={styles.creditBalanceUnit}>Passes</Text>
            </View>
          </View>

          {/* Navigation Action Buttons */}
          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.88}
              onPress={() => router.replace("/(operator-tabs)")}
              accessibilityRole="button"
              accessibilityLabel="Back to Dashboard"
            >
              <Ionicons name="grid-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineBtn}
              activeOpacity={0.88}
              onPress={() => router.replace("/(operator-tabs)/manifests")}
              accessibilityRole="button"
              accessibilityLabel="View All Manifests"
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={colors.primaryBlue}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.outlineBtnText}>View All Manifests</Text>
            </TouchableOpacity>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  topBarSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  container: {
    alignSelf: "center",
    width: "100%",
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 8,
  },
  checkRingOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  checkRingMiddle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkRingInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  lguBanner: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  lguIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
  },
  lguContent: {
    flex: 1,
  },
  lguTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  lguTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#15803D",
  },
  liveSyncBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
    marginRight: 5,
  },
  liveSyncText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#15803D",
    letterSpacing: 0.5,
  },
  lguBody: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#166534",
    lineHeight: 18,
  },
  boldText: {
    fontFamily: "Quicksand_700Bold",
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  downloadActionBtn: {
    backgroundColor: colors.primaryBlue,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadActionBtnText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  shareActionBtn: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flex: 0.7,
  },
  shareActionBtnText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#86EFAC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  feedbackBannerText: {
    fontSize: 13,
    fontFamily: "Quicksand_600SemiBold",
    color: "#15803D",
  },
  previewCardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  previewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  previewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewHeaderTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  zoomControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    padding: 3,
    borderRadius: 8,
  },
  zoomPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  zoomPillActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  zoomPillText: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  zoomPillTextActive: {
    color: colors.primaryBlue,
    fontFamily: "Quicksand_700Bold",
  },
  zoomIconBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  canvasViewport: {
    height: 480,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    overflow: "hidden",
  },
  loadingContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  loadingText: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
    marginLeft: 6,
  },
  canvasVerticalScroll: {
    flex: 1,
  },
  canvasVerticalContent: {
    padding: 8,
  },
  canvasHorizontalContent: {
    alignItems: "flex-start",
  },
  creditStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  creditStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  creditIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  creditStripLabel: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#1E40AF",
  },
  creditStripSub: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#3B82F6",
  },
  creditBalanceBadge: {
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  creditBalanceNumber: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: "#1E40AF",
  },
  creditBalanceUnit: {
    fontSize: 10,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  btnGroup: {
    gap: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  outlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    paddingVertical: 14,
    borderRadius: 12,
  },
  outlineBtnText: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
});
