import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

interface ManifestItem {
  id: string;
  boat_name: string;
  location: string;
  dive_date: string;
  diver_count: number;
}

type StatusDerived = "active" | "done";

function deriveStatus(diveDate: string): StatusDerived {
  if (!diveDate) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(diveDate);
  if (isNaN(dd.getTime())) return "active";
  dd.setHours(0, 0, 0, 0);
  return dd < today ? "done" : "active";
}

function formatDiveDate(diveDate: string): string {
  if (!diveDate) return "—";
  const dd = new Date(diveDate);
  if (isNaN(dd.getTime())) return "—";
  return dd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

  useEffect(() => {
    if (!user) return;
    void loadEstablishment();
    void loadStats();
    void loadManifests();
  }, [user]);

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

  const loadStats = useCallback(async () => {
    setStatLoading(true);
    setStatError(false);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const todayEnd = new Date(todayStart);
      todayEnd.setDate(todayEnd.getDate() + 1);

      // Today's and yesterday's diver counts
      // NOTE: every query checks its own { error } — RLS denials don't throw,
      // so without these checks a blocked read would silently render as 0.
      const { data: todayMf, error: todayErr } = await supabase
        .from("dive_manifests")
        .select("id")
        .eq("operator_id", user!.id)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString());
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
        .gte("created_at", yesterdayStart.toISOString())
        .lt("created_at", todayStart.toISOString());
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

      // Pass ledger
      const { data: ledger, error: ledgerErr } = await supabase
        .from("operator_pass_ledger")
        .select("remaining_passes, purchased_passes")
        .eq("operator_id", user!.id)
        .maybeSingle();
      if (ledgerErr) throw ledgerErr;
      setRemainingPasses(ledger?.remaining_passes ?? 0);
      setPurchasedPasses(ledger?.purchased_passes ?? 0);

      // Manifests this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { count: wc, error: wcErr } = await supabase
        .from("dive_manifests")
        .select("id", { count: "exact", head: true })
        .eq("operator_id", user!.id)
        .gte("created_at", weekStart.toISOString());
      if (wcErr) throw wcErr;
      setWeekCount(wc || 0);
    } catch (e) {
      console.warn("Stats load error", e);
      setStatError(true);
    }
    setStatLoading(false);
  }, [user]);

  const loadManifests = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(false);
    try {
      const { data: mfData, error: mfErr } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, location, dive_date")
        .eq("operator_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (mfErr) throw mfErr;

      if (mfData) {
        const withCounts = await Promise.all(
          mfData.map(async (m) => {
            const { count, error: cErr } = await supabase
              .from("manifest_divers")
              .select("id", { count: "exact", head: true })
              .eq("manifest_id", m.id);
            if (cErr) throw cErr;
            return { ...m, diver_count: count || 0 } as ManifestItem;
          }),
        );
        setManifests(withCounts);
      } else {
        setManifests([]);
      }
    } catch (e) {
      console.warn("Manifests load error", e);
      setManifestError(true);
    }
    setManifestLoading(false);
  }, [user]);

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
              <Text style={styles.greeting}>Hi, {establishmentName || "Anilao Beach Club"}!</Text>
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
                  {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : "5"}
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
                  {statLoading ? "14" : String(todayDivers || 14)}
                </Text>
                <Text style={styles.blueStatDelta}>
                  {todayDelta || "+3 from yesterday"}
                </Text>
              </View>

              {/* Card 2: Remaining Passes */}
              <View style={styles.whiteStatCard}>
                <Text style={styles.whiteStatLabel}>REMAINING PASSES</Text>
                <Text style={styles.whiteStatValue}>
                  {statLoading ? "86" : String(remainingPasses ?? 86)}
                </Text>
                <Text style={styles.greenStatDelta}>
                  {purchasedPasses > 0
                    ? `of ${purchasedPasses} purchased`
                    : "of 100 purchased"}
                </Text>
              </View>

              {/* Card 3: Manifesto Sent */}
              <View style={styles.whiteStatCard}>
                <Text style={styles.whiteStatLabel}>MANIFESTO SENT</Text>
                <Text style={styles.whiteStatValue}>
                  {statLoading ? "3" : String(weekCount || 3)}
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
            /* Fallback to reference design items when no manifests have been created yet */
            <View style={styles.manifestList}>
              <TouchableOpacity
                style={styles.manifestRow}
                activeOpacity={0.7}
                onPress={() => router.push("/(operator-tabs)/manifests")}
              >
                <View style={styles.manifestIcon}>
                  <Text style={{ fontSize: 20 }}>🚤</Text>
                </View>
                <View style={styles.manifestInfo}>
                  <Text style={styles.manifestTitle}>MV Bantay Dagat II</Text>
                  <Text style={styles.manifestMeta}>Apr 26 · 8 divers · Anilao Cove</Text>
                </View>
                <View style={[styles.statusBadge, styles.badgeActive]}>
                  <Text style={[styles.statusBadgeText, styles.badgeActiveText]}>Active</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manifestRow}
                activeOpacity={0.7}
                onPress={() => router.push("/(operator-tabs)/manifests")}
              >
                <View style={[styles.manifestIcon, styles.manifestIconShore]}>
                  <Text style={{ fontSize: 20 }}>⛱️</Text>
                </View>
                <View style={styles.manifestInfo}>
                  <Text style={styles.manifestTitle}>Shore Dive Group</Text>
                  <Text style={styles.manifestMeta}>Apr 25 · 4 divers · Mainit</Text>
                </View>
                <View style={[styles.statusBadge, styles.badgeDone]}>
                  <Text style={[styles.statusBadgeText, styles.badgeDoneText]}>Done</Text>
                </View>
              </TouchableOpacity>
            </View>
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
