import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
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
import {
  Button,
  ContentContainer,
  ScreenHeader,
  StatCard,
  StatusBadge,
} from "../../components";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { deriveStatus, formatDiveDate } from "../../lib/diveDate";

interface ManifestItem {
  id: string;
  boat_name: string;
  location: string;
  dive_date: string;
  diver_count: number;
}

interface OperatorStats {
  today_divers: number;
  yesterday_divers: number;
  week_count: number;
  remaining_passes: number;
  purchased_passes: number;
  annual_remaining: number;
  annual_purchased: number;
  recent_manifests: ManifestItem[];
}

export default function OperatorDashboardScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, unreadCount } = useAuth();
  const { isDesktop, isTablet } = useLayout();
  const isWide = isDesktop || isTablet;
  const statsBasis = isDesktop ? "30%" : isTablet ? "48%" : "100%";

  const [establishmentName, setEstablishmentName] = useState<string>("");

  const [todayDivers, setTodayDivers] = useState(0);
  const [yesterdayDivers, setYesterdayDivers] = useState(0);
  const [remainingPasses, setRemainingPasses] = useState<number | null>(null);
  const [purchasedPasses, setPurchasedPasses] = useState(0);
  const [weekCount, setWeekCount] = useState(0);

  const [statLoading, setStatLoading] = useState(true);
  const [statError, setStatError] = useState(false);

  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [manifestError, setManifestError] = useState(false);

  const loadEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from("operator_applications")
        .select("resort_name")
        .eq("tourist_id", user!.id)
        .eq("status", "approved")
        .maybeSingle();
      if (error) throw error;
      if (data?.resort_name) setEstablishmentName(data.resort_name);
      else
        setEstablishmentName(
          user?.user_metadata?.full_name?.split(" ")[0] || "Operator",
        );
    } catch (e) {
      console.warn("Establishment load error", e);
      setEstablishmentName(
        user?.user_metadata?.full_name?.split(" ")[0] || "Operator",
      );
    }
  };

  // Legacy multi-query path (pre-041 backends): stats anchored on dive_date,
  // not created_at — a manifest made today for next week's dive counts for
  // next week. Every query checks its own { error } — RLS denials don't
  // throw, so without these a blocked read would silently render as 0.
  const loadStatsLegacy = useCallback(async () => {
    try {
      const toLocalDate = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const today = new Date();
      const todayStr = toLocalDate(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toLocalDate(yesterday);

      const { data: todayMf, error: todayErr } = await supabase
        .from("dive_manifests")
        .select("id")
        .eq("operator_id", user!.id)
        .eq("dive_date", todayStr);
      if (todayErr) throw todayErr;

      if (todayMf && todayMf.length > 0) {
        const ids = todayMf.map((m: { id: string }) => m.id);
        const { count: td, error: tdErr } = await supabase
          .from("manifest_divers")
          .select("id", { count: "exact", head: true })
          .in("manifest_id", ids);
        if (tdErr) throw tdErr;
        setTodayDivers(td || 0);
      } else {
        setTodayDivers(0);
      }

      const { data: yesterdayMf, error: yErr } = await supabase
        .from("dive_manifests")
        .select("id")
        .eq("operator_id", user!.id)
        .eq("dive_date", yesterdayStr);
      if (yErr) throw yErr;

      if (yesterdayMf && yesterdayMf.length > 0) {
        const ids = yesterdayMf.map((m: { id: string }) => m.id);
        const { count: yd, error: ydErr } = await supabase
          .from("manifest_divers")
          .select("id", { count: "exact", head: true })
          .in("manifest_id", ids);
        if (ydErr) throw ydErr;
        setYesterdayDivers(yd || 0);
      } else {
        setYesterdayDivers(0);
      }

      const { data: ledger, error: ledgerErr } = await supabase
        .from("operator_pass_ledger")
        .select("remaining_passes, purchased_passes")
        .eq("operator_id", user!.id)
        .maybeSingle();
      if (ledgerErr) throw ledgerErr;
      setRemainingPasses(ledger?.remaining_passes ?? 0);
      setPurchasedPasses(ledger?.purchased_passes ?? 0);

      // Manifests this week (dive weeks, Sunday-based, bounded both ends)
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const { count: wc, error: wcErr } = await supabase
        .from("dive_manifests")
        .select("id", { count: "exact", head: true })
        .eq("operator_id", user!.id)
        .gte("dive_date", toLocalDate(weekStart))
        .lte("dive_date", toLocalDate(weekEnd));
      if (wcErr) throw wcErr;
      setWeekCount(wc || 0);
    } catch (e) {
      console.warn("Stats load error", e);
      setStatError(true);
    }
    setStatLoading(false);
  }, [user]);

  const loadStats = useCallback(async () => {
    setStatLoading(true);
    setStatError(false);
    try {
      // Single round-trip (041 get_operator_stats): ledger + today/yesterday
      // diver counts + Sunday-based week count + 10 recent manifests w/ counts.
      // Falls back to the legacy multi-query path on pre-041 backends.
      const { data: stats, error: statsErr } = await supabase.rpc("get_operator_stats");
      if (!statsErr && stats) {
        const s = stats as OperatorStats;
        setTodayDivers(s.today_divers ?? 0);
        setYesterdayDivers(s.yesterday_divers ?? 0);
        setWeekCount(s.week_count ?? 0);
        setRemainingPasses(s.remaining_passes ?? 0);
        setPurchasedPasses(s.purchased_passes ?? 0);
        setManifests(s.recent_manifests ?? []);
        setManifestLoading(false);
        setManifestError(false);
        setStatLoading(false);
        return;
      }
      if (statsErr) console.warn("get_operator_stats unavailable, legacy fallback:", statsErr);
      await loadStatsLegacy();
    } catch (e) {
      console.warn("Stats load error", e);
      setStatError(true);
      setStatLoading(false);
    }
  }, [user, loadStatsLegacy]);

  const loadManifests = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(false);
    try {
      // Single query with embedded diver counts (no N+1), ordered by dive
      // date — the canonical recency axis — not created_at.
      const { data: mfData, error: mfErr } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, location, dive_date, manifest_divers(count)")
        .eq("operator_id", user!.id)
        .order("dive_date", { ascending: false })
        .limit(10);
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
    } catch (e) {
      console.warn("Manifests load error", e);
      setManifestError(true);
    }
    setManifestLoading(false);
  }, [user]);

  // Refetch on every focus (not just mount): returning from confirmed or
  // buy-pass would otherwise show a stale pass balance.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void loadEstablishment();
      void loadStats();
      void loadManifests();
    }, [user, loadStats, loadManifests])
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

  const percentChange =
    yesterdayDivers > 0
      ? Math.round(((todayDivers - yesterdayDivers) / yesterdayDivers) * 100)
      : null;
  const todayDelta =
    percentChange !== null
      ? `${percentChange >= 0 ? "+" : ""}${percentChange}% vs yesterday`
      : todayDivers > 0
        ? "New today"
        : undefined;
  const isDeltaPositive = percentChange === null || percentChange >= 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <ContentContainer maxWidth={900}>
          {/* Greeting */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hi, {establishmentName || "Operator"}!</Text>
              <Text style={styles.subGreeting}>Logged in as Operator</Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => router.push("/notifications")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#1E293B"
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Stat Cards */}
          {statError ? (
            <View style={styles.retrySection}>
              <Text style={styles.retryText}>Failed to load stats</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadStats}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.statsRow}>
              {/* Card 1: Blue Card */}
              <View style={styles.blueStatCard}>
                <Text style={styles.blueStatLabel}>TODAY'S DIVERS</Text>
                <Text style={styles.blueStatValue}>
                  {statLoading ? "…" : String(todayDivers)}
                </Text>
                <Text style={styles.blueStatDelta}>
                  {statLoading ? "…" : todayDelta || "No activity yet"}
                </Text>
              </View>

              {/* Card 2: Remaining Passes */}
              <View style={styles.whiteStatCard}>
                <Text style={styles.whiteStatLabel}>REMAINING PASSES</Text>
                <Text style={styles.whiteStatValue}>
                  {statLoading ? "…" : String(remainingPasses ?? 0)}
                </Text>
                <Text style={styles.greenStatDelta}>
                  {statLoading
                    ? "…"
                    : purchasedPasses > 0
                      ? `of ${purchasedPasses} purchased`
                      : "No passes purchased yet"}
                </Text>
              </View>

              {/* Card 3: Manifesto Sent */}
              <View style={styles.whiteStatCard}>
                <Text style={styles.whiteStatLabel}>MANIFESTO SENT</Text>
                <Text style={styles.whiteStatValue}>
                  {statLoading ? "…" : String(weekCount)}
                </Text>
                <Text style={styles.greenStatDelta}>This week</Text>
              </View>
            </View>
          )}

          {/* Pass gate warning */}
          {!statLoading &&
            !statError &&
            remainingPasses !== null &&
            remainingPasses <= 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.warningText}>
                  No remaining passes.{" "}
                  <Text
                    style={styles.warningLink}
                    onPress={() => router.push("/(operator-tabs)/buy-pass")}
                  >
                    Purchase more
                  </Text>{" "}
                  to create manifests.
                </Text>
              </View>
            )}

          {/* Create Manifest CTA Button */}
          <TouchableOpacity
            style={styles.orangeCtaBtn}
            activeOpacity={0.88}
            onPress={() => router.push("/establishment/create-manifest/step1")}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.orangeCtaText}>Create Dive Manifest</Text>
          </TouchableOpacity>

          {/* Recent Manifests Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Manifests</Text>
            <TouchableOpacity
              onPress={() => router.push("/(operator-tabs)/manifests")}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {manifestError ? (
            <View style={styles.retrySection}>
              <Text style={styles.retryText}>Failed to load manifests</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadManifests}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : manifestLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primaryBlue}
              style={{ marginTop: 20 }}
            />
          ) : manifests.length > 0 ? (
            <View style={styles.manifestList}>
              {manifests.slice(0, 5).map((m) => {
                const status = deriveStatus(m.dive_date);
                const isShore = (m.boat_name || "").toLowerCase().includes("shore") || (m.location || "").toLowerCase().includes("shore");
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.manifestRow}
                    activeOpacity={0.7}
                    onPress={() => router.push("/(operator-tabs)/manifests")}
                  >
                    <View style={[styles.manifestIcon, isShore && styles.manifestIconShore]}>
                      <Text style={{ fontSize: 20 }}>{isShore ? "⛱️" : "🚤"}</Text>
                    </View>
                    <View style={styles.manifestInfo}>
                      <Text style={styles.manifestTitle}>{m.boat_name || "Dive Group"}</Text>
                      <Text style={styles.manifestMeta}>
                        {formatDiveDate(m.dive_date)} · {m.diver_count} divers · {m.location}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, status === "active" ? styles.badgeActive : styles.badgeDone]}>
                      <Text style={[styles.statusBadgeText, status === "active" ? styles.badgeActiveText : styles.badgeDoneText]}>
                        {status === "active" ? "Active" : "Done"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Honest empty state — never fake reference-design rows as real data. */
            <Text style={styles.emptyText}>
              No manifests yet. Create your first one!
            </Text>
          )}

          {/* 2x2 Placeholder Grid from Design */}
          <View style={styles.placeholderGrid}>
            <View style={styles.placeholderRow}>
              <View style={styles.gridPlaceholder} />
              <View style={styles.gridPlaceholder} />
            </View>
            <View style={styles.placeholderRow}>
              <View style={styles.gridPlaceholder} />
              <View style={styles.gridPlaceholder} />
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 24, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  subGreeting: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: colors.white },
  statsRow: {
    flexDirection: "row",
    marginTop: 18,
    gap: 8,
  },
  blueStatCard: {
    flex: 1,
    backgroundColor: colors.primaryBlue,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  blueStatLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
  },
  blueStatValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    marginVertical: 4,
  },
  blueStatDelta: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#93C5FD",
  },
  whiteStatCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 14,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  whiteStatLabel: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  whiteStatValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 4,
  },
  greenStatDelta: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "#10B981",
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "#FFF7E6",
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  warningText: {
    ...typography.caption,
    color: "#92400E",
    flex: 1,
    lineHeight: 17,
  },
  warningLink: {
    fontWeight: "700",
    color: colors.primaryBlue,
    textDecorationLine: "underline",
  },
  orangeCtaBtn: {
    backgroundColor: "#FF7A00",
    borderRadius: 16,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 20,
    shadowColor: "#FF7A00",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  orangeCtaText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  seeAll: { fontSize: 13, fontWeight: "600", color: colors.primaryBlue },
  retrySection: { alignItems: "center", marginTop: 24, gap: 8 },
  retryText: { fontSize: 13, color: colors.gray },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
  },
  retryBtnText: { fontSize: 12, fontWeight: "600", color: colors.primaryBlue },
  manifestList: { gap: 10 },
  manifestRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    gap: 12,
  },
  manifestIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E0F2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  manifestIconShore: {
    backgroundColor: "#FEE2E2",
  },
  manifestInfo: { flex: 1 },
  manifestTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  manifestMeta: { fontSize: 12, color: "#64748B", marginTop: 3 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  badgeActive: {
    backgroundColor: "#DCFCE7",
  },
  badgeActiveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  badgeDone: {
    backgroundColor: "#EEF2FF",
  },
  badgeDoneText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
  placeholderGrid: {
    marginTop: 18,
    gap: 12,
  },
  placeholderRow: {
    flexDirection: "row",
    gap: 12,
  },
  gridPlaceholder: {
    flex: 1,
    height: 110,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 13,
    color: colors.gray,
    textAlign: "center",
    marginTop: 20,
  },
});
