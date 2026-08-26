import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../constants/colors";
import { Button, StatCard, StatusBadge } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { useLayout } from "../../context/LayoutContext";
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(diveDate);
  dd.setHours(0, 0, 0, 0);
  return dd < today ? "done" : "active";
}

export default function OperatorDashboardScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading, unreadCount } = useAuth();
  const { isDesktop } = useLayout();

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
    loadEstablishment();
    loadStats();
    loadManifests();
  }, [user]);

  const loadEstablishment = async () => {
    const { data } = await supabase
      .from("operator_applications")
      .select("resort_name")
      .eq("tourist_id", user!.id)
      .eq("status", "approved")
      .single();
    if (data?.resort_name) setEstablishmentName(data.resort_name);
    else setEstablishmentName(user?.user_metadata?.full_name?.split(" ")[0] || "Operator");
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
      const { data: todayMf } = await supabase
        .from("dive_manifests")
        .select("id")
        .eq("operator_id", user!.id)
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", todayEnd.toISOString());

      if (todayMf && todayMf.length > 0) {
        const ids = todayMf.map((m: { id: string }) => m.id);
        const { count: td } = await supabase
          .from("manifest_divers")
          .select("id", { count: "exact", head: true })
          .in("manifest_id", ids);
        setTodayDivers(td || 0);
      } else {
        setTodayDivers(0);
      }

      const { data: yesterdayMf } = await supabase
        .from("dive_manifests")
        .select("id")
        .eq("operator_id", user!.id)
        .gte("created_at", yesterdayStart.toISOString())
        .lt("created_at", todayStart.toISOString());

      if (yesterdayMf && yesterdayMf.length > 0) {
        const ids = yesterdayMf.map((m: { id: string }) => m.id);
        const { count: yd } = await supabase
          .from("manifest_divers")
          .select("id", { count: "exact", head: true })
          .in("manifest_id", ids);
        setYesterdayDivers(yd || 0);
      } else {
        setYesterdayDivers(0);
      }

      // Pass ledger
      const { data: ledger } = await supabase
        .from("operator_pass_ledger")
        .select("remaining_passes, purchased_passes")
        .eq("operator_id", user!.id)
        .single();
      setRemainingPasses(ledger?.remaining_passes ?? 0);
      setPurchasedPasses(ledger?.purchased_passes ?? 0);

      // Manifests this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { count: wc } = await supabase
        .from("dive_manifests")
        .select("id", { count: "exact", head: true })
        .eq("operator_id", user!.id)
        .gte("created_at", weekStart.toISOString());
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
      const { data: mfData } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, location, dive_date")
        .eq("operator_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (mfData) {
        const withCounts = await Promise.all(
          mfData.map(async (m) => {
            const { count } = await supabase
              .from("manifest_divers")
              .select("id", { count: "exact", head: true })
              .eq("manifest_id", m.id);
            return { ...m, diver_count: count || 0 } as ManifestItem;
          })
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
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const todayDelta = yesterdayDivers > 0
    ? `+${((todayDivers - yesterdayDivers) / yesterdayDivers * 100).toFixed(0)}% vs yesterday`
    : todayDivers > 0 ? "New today" : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Greeting */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hi, {establishmentName}!</Text>
            <Text style={styles.subGreeting}>Logged in as Operator</Text>
          </View>
          <TouchableOpacity style={styles.bellButton} onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={20} color={colors.darkText} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
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
            <StatCard
              icon={<Ionicons name="people" size={20} color={colors.primaryBlue} />}
              value={statLoading ? "..." : String(todayDivers)}
              label="Today's Divers"
              delta={statLoading ? undefined : todayDelta}
            />
            <StatCard
              icon={<Ionicons name="ticket" size={20} color={colors.primaryBlue} />}
              value={statLoading ? "..." : String(remainingPasses ?? "?")}
              label="Remaining Passes"
              delta={statLoading ? undefined : purchasedPasses > 0 ? `of ${purchasedPasses} purchased` : undefined}
            />
            <StatCard
              icon={<Ionicons name="document-text" size={20} color={colors.primaryBlue} />}
              value={statLoading ? "..." : String(weekCount)}
              label="Manifests Sent"
              delta={statLoading ? undefined : "This week"}
            />
          </View>
        )}

        {/* Pass gate warning */}
        {!statLoading && !statError && remainingPasses !== null && remainingPasses <= 0 && (
          <View style={styles.warningBanner}>
            <Ionicons name="alert-circle" size={16} color={colors.orange} />
            <Text style={styles.warningText}>
              No remaining passes.{' '}
              <Text style={styles.warningLink} onPress={() => router.push("/(operator-tabs)/buy-pass")}>
                Purchase more
              </Text>{' '}
              to create manifests.
            </Text>
          </View>
        )}

        {/* Create Manifest */}
        <View style={styles.createWrap}>
          <Button
            title="+ Create Dive Manifest"
            onPress={() => router.push("/establishment/create-manifest/step1")}
            icon={<Ionicons name="add" size={18} color={colors.white} />}
          />
        </View>

        {/* Recent Manifests */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Manifests</Text>
          <TouchableOpacity onPress={() => router.push("/(operator-tabs)/manifests")}>
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
          <ActivityIndicator size="small" color={colors.primaryBlue} style={{ marginTop: 20 }} />
        ) : manifests.length === 0 ? (
          <Text style={styles.emptyText}>No manifests yet. Create your first one!</Text>
        ) : (
          <View style={styles.manifestList}>
            {manifests.slice(0, 5).map((m) => {
              const status = deriveStatus(m.dive_date);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.manifestRow}
                  activeOpacity={0.7}
                  onPress={() => router.push({
                    pathname: "/(operator-tabs)/manifests",
                    params: { id: m.id },
                  })}
                >
                  <View style={styles.manifestIcon}>
                    <Ionicons name="boat" size={20} color={colors.primaryBlue} />
                  </View>
                  <View style={styles.manifestInfo}>
                    <Text style={styles.manifestTitle}>{m.boat_name}</Text>
                    <Text style={styles.manifestMeta}>
                      {new Date(m.dive_date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })} · {m.diver_count} divers · {m.location}
                    </Text>
                  </View>
                  <StatusBadge
                    label={status === "active" ? "Active" : "Done"}
                    variant={status}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 22, fontWeight: "700", color: colors.darkText },
  subGreeting: { fontSize: 13, color: colors.gray, marginTop: 4 },
  bellButton: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.red, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: colors.white },
  statsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 24, gap: 10 },
  warningBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFF7E6", borderRadius: 12, padding: 12, marginTop: 16,
  },
  warningText: { fontSize: 12, color: "#92400E", flex: 1, lineHeight: 17 },
  warningLink: { fontWeight: "700", color: colors.primaryBlue, textDecorationLine: "underline" },
  createWrap: { marginTop: 16 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.darkText },
  seeAll: { fontSize: 12, fontWeight: "500", color: colors.primaryBlue },
  retrySection: { alignItems: "center", marginTop: 24, gap: 8 },
  retryText: { fontSize: 13, color: colors.gray },
  retryBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.grayLight },
  retryBtnText: { fontSize: 12, fontWeight: "600", color: colors.primaryBlue },
  manifestList: { marginTop: 12, gap: 8 },
  manifestRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1, gap: 12,
  },
  manifestIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EBF2FF", alignItems: "center", justifyContent: "center" },
  manifestInfo: { flex: 1 },
  manifestTitle: { fontSize: 14, fontWeight: "600", color: colors.darkText },
  manifestMeta: { fontSize: 11, color: colors.gray, marginTop: 2 },
  emptyText: { fontSize: 13, color: colors.gray, textAlign: "center", marginTop: 20 },
});
