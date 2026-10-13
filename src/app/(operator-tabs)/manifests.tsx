import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { Button, StatusBadge, ContentContainer, EmptyState } from "../../components";
import { ManifestSnapshotCard } from "../../components/ManifestSnapshotCard";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { deriveStatus, formatDiveDate, toLocalDateString } from "../../lib/diveDate";
import {
  deleteDraft,
  draftSubtitle,
  draftTitle,
  listDrafts,
  type ManifestDraft,
} from "../../lib/manifestDrafts";
import { captureAndDownload, captureAndShare } from "../../lib/snapshot";

type Tab = "upcoming" | "completed" | "drafts";

interface ManifestItem {
  id: string;
  boat_name: string;
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
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [drafts, setDrafts] = useState<ManifestDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [operatorName, setOperatorName] = useState("Operator");

  // Snapshot sheet state
  const [selected, setSelected] = useState<ManifestItem | null>(null);
  const [diverNames, setDiverNames] = useState<string[]>([]);
  const [diversLoading, setDiversLoading] = useState(false);
  const [snapshotBusy, setSnapshotBusy] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState("");
  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (!user) return;
    loadManifests();
    loadLocalDrafts();
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

  const loadManifests = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // Single query with embedded counts (no 1+N), ordered by dive date.
      // Capped at 50 rows with an explicit note instead of unbounded growth.
      const { data: mfData, error: mfErr } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, location, dive_date, manifest_divers(count)")
        .eq("operator_id", user!.id)
        .order("dive_date", { ascending: false })
        .limit(50);
      if (mfErr) throw mfErr;

      setManifests(
        (mfData || []).map((m: {
          id: string; boat_name: string; location: string; dive_date: string;
          manifest_divers?: { count: number }[] | { count: number };
        }) => {
          const dc = m.manifest_divers;
          const diver_count = Array.isArray(dc) ? (dc[0]?.count ?? 0) : (dc?.count ?? 0);
          return { id: m.id, boat_name: m.boat_name, location: m.location, dive_date: m.dive_date, diver_count };
        })
      );

      const { data: app } = await supabase
        .from("operator_applications")
        .select("resort_name")
        .eq("tourist_id", user!.id)
        .eq("status", "approved")
        .maybeSingle();
      if (app?.resort_name) setOperatorName(app.resort_name);
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

  const todayStr = toLocalDateString(new Date());
  const upcoming = manifests.filter((m) => m.dive_date >= todayStr);
  const completed = manifests.filter((m) => m.dive_date < todayStr);

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
    `manifesto-${m.dive_date}-${m.boat_name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <View style={styles.headerRow}>
          <Text style={styles.title}>Manifests</Text>
          <Button
            title="+ New"
            fullWidth={false}
            onPress={() => router.push("/establishment/create-manifest/step1")}
          />
        </View>

        {/* Category tabs */}
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
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label} ({counts[t.key]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
        ) : loadError ? (
          <View style={styles.retrySection}>
            <Text style={styles.retryText}>Failed to load manifests.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { loadManifests(); loadLocalDrafts(); }}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tab === "drafts" ? (
          drafts.length === 0 ? (
            <EmptyState icon="document-outline" message="No drafts. Unsubmitted forms autosave on this device." />
          ) : (
            <View style={styles.list}>
              <Text style={styles.draftNote}>Drafts live on this device only — they never consume passes until submitted.</Text>
              {drafts.map((d) => (
                <View key={d.id} style={styles.row}>
                  <View style={styles.icon}>
                    <Ionicons name="document-text" size={20} color={colors.primaryBlue} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.rowTitle}>{draftTitle(d)}</Text>
                    <Text style={styles.rowMeta}>{draftSubtitle(d)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resumeBtn}
                    onPress={() => resumeDraft(d)}
                    accessibilityRole="button"
                    accessibilityLabel={`Resume draft ${draftTitle(d)}`}
                  >
                    <Text style={styles.resumeText}>Resume</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeDraft(d)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete draft ${draftTitle(d)}`}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.gray} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )
        ) : (
          (() => {
            const rows = tab === "upcoming" ? upcoming : completed;
            if (rows.length === 0) {
              return (
                <EmptyState
                  icon="boat-outline"
                  message={tab === "upcoming" ? "No upcoming dives. Create your next manifesto!" : "No completed dives yet."}
                />
              );
            }
            return (
              <View style={styles.list}>
                {rows.map((m) => {
                  const status = deriveStatus(m.dive_date);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.row}
                      activeOpacity={0.7}
                      onPress={() => openSnapshot(m)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open snapshot for ${m.boat_name} on ${m.dive_date}`}
                    >
                      <View style={styles.icon}>
                        <Ionicons name="boat" size={20} color={colors.primaryBlue} />
                      </View>
                      <View style={styles.info}>
                        <Text style={styles.rowTitle}>{m.boat_name}</Text>
                        <Text style={styles.rowMeta}>
                          {formatDiveDate(m.dive_date)} · {m.diver_count} divers · {m.location}
                        </Text>
                      </View>
                      <StatusBadge
                        label={status === "active" ? "Active" : "Done"}
                        variant={status}
                      />
                      <Ionicons name="share-outline" size={18} color={colors.gray} />
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
      <Modal visible={selected !== null} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Manifesto snapshot</Text>
              <TouchableOpacity onPress={() => setSelected(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close snapshot">
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <View style={styles.cardWrap}>
                  {diversLoading ? (
                    <ActivityIndicator size="small" color={colors.primaryBlue} />
                  ) : (
                    <ManifestSnapshotCard
                      ref={cardRef}
                      manifest={{
                        id: selected.id,
                        boat_name: selected.boat_name,
                        location: selected.location,
                        dive_date: selected.dive_date,
                        diver_count: selected.diver_count,
                        status: deriveStatus(selected.dive_date),
                      }}
                      divers={diverNames}
                      operatorName={operatorName}
                    />
                  )}
                </View>
                {snapshotMsg ? <Text style={styles.sheetMsg}>{snapshotMsg}</Text> : null}
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
                      <Text style={styles.sheetBtnOutlineText}>Download</Text>
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
                      <Text style={styles.sheetBtnPrimaryText}>Share</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 24, fontWeight: "700", color: colors.darkText },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: { fontSize: 12.5, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: colors.primaryBlue, fontWeight: "800" },
  draftNote: { fontSize: 12, color: "#64748B", lineHeight: 17, marginBottom: 4 },
  list: { gap: 8 },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    borderRadius: 14, padding: 14, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EBF2FF", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: colors.darkText },
  rowMeta: { fontSize: 11, color: colors.gray, marginTop: 2 },
  resumeBtn: {
    backgroundColor: "#EBF2FF",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  resumeText: { fontSize: 12, fontWeight: "700", color: colors.primaryBlue },
  retrySection: { alignItems: "center", marginTop: 40, gap: 12 },
  retryText: { fontSize: 14, color: colors.gray },
  retryBtn: { borderRadius: 100, borderWidth: 1, borderColor: colors.primaryBlue, paddingVertical: 8, paddingHorizontal: 24 },
  retryBtnText: { fontSize: 13, fontWeight: "600", color: colors.primaryBlue },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  sheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "92%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  cardWrap: { alignItems: "center", marginBottom: 12 },
  sheetMsg: { fontSize: 13, color: "#15803D", textAlign: "center", marginBottom: 8 },
  sheetBtns: { flexDirection: "row", gap: 10 },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnOutline: { borderWidth: 1.5, borderColor: colors.primaryBlue, backgroundColor: colors.white },
  sheetBtnOutlineText: { fontSize: 15, fontWeight: "700", color: colors.primaryBlue },
  sheetBtnPrimary: { backgroundColor: colors.primaryBlue },
  sheetBtnPrimaryText: { fontSize: 15, fontWeight: "700", color: colors.white },
});
