import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { ContentContainer, ManifestSkeleton, Skeleton } from "../../components";
import AnimatedKpiValue from "../../components/AnimatedKpiValue";
import { colors } from "../../constants/colors";
import { useLayout } from "../../context/LayoutContext";
import { useNotificationModal } from "../../context/NotificationModalContext";
import { useAuth } from "../../hooks/useAuth";
import { deriveManifestStatus, formatDiveDate } from "../../lib/diveDate";
import { supabase } from "../../lib/supabase";

interface ManifestItem {
  id: string;
  boat_name: string | null;
  dive_mode: string;
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { openNotifications } = useNotificationModal();
  const { user, operatorApplication, avatarUri, isLoading: authLoading, unreadCount } = useAuth();
  const { isDesktop, isTablet, isCompact } = useLayout();
  const isWide = isDesktop || isTablet;

  const establishmentName =
    operatorApplication?.resort_name ||
    user?.user_metadata?.full_name?.split(" ")[0] ||
    "Operator";

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
      const { data: stats, error: statsErr } =
        await supabase.rpc("get_operator_stats");
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
      if (statsErr)
        console.warn("get_operator_stats unavailable, fallback:", statsErr);
      await loadStatsLegacy();
    } catch (e) {
      console.warn("Stats load error", e);
      setStatError(true);
      setStatLoading(false);
    }
  }, [loadStatsLegacy]);

  const loadManifests = useCallback(async () => {
    setManifestLoading(true);
    setManifestError(false);
    try {
      const { data: mfData, error: mfErr } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, dive_mode, location, dive_date, manifest_divers(count)")
        .eq("operator_id", user!.id)
        .order("dive_date", { ascending: false })
        .limit(10);
      if (mfErr) throw mfErr;

      setManifests(
        (mfData || []).map(
          (m: {
            id: string;
            boat_name: string | null;
            dive_mode: string;
            location: string;
            dive_date: string;
            manifest_divers?: { count: number }[] | { count: number };
          }) => {
            const dc = m.manifest_divers;
            const diver_count = Array.isArray(dc)
              ? dc[0]?.count ?? 0
              : dc?.count ?? 0;
            return {
              id: m.id,
              boat_name: m.boat_name,
              dive_mode: m.dive_mode,
              location: m.location,
              dive_date: m.dive_date,
              diver_count,
            };
          },
        ),
      );
    } catch (e) {
      console.warn("Manifests load error", e);
      setManifestError(true);
    }
    setManifestLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void loadStats();
      void loadManifests();
    }, [user, loadStats, loadManifests]),
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.authLoading}>
          <View style={styles.authLoadingHeader}>
            <Skeleton width={152} height={42} radius={10} />
            <Skeleton width={40} height={40} radius={20} />
          </View>
          <View style={styles.authLoadingStats}>
            <Skeleton height={88} radius={16} />
            <Skeleton height={88} radius={16} />
          </View>
          <ManifestSkeleton />
          <ManifestSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  const deltaDivers = todayDivers - yesterdayDivers;
  const deltaText =
    deltaDivers > 0
      ? `+${deltaDivers} from yesterday`
      : deltaDivers < 0
        ? `${deltaDivers} from yesterday`
        : "Equal to yesterday";

  // Remaining passes ring ratio
  const totalPurchased = purchasedPasses > 0 ? purchasedPasses : 100;
  const currentRemaining = remainingPasses ?? 0;
  const passUsagePercent = Math.min(
    100,
    Math.max(0, Math.round((currentRemaining / totalPurchased) * 100)),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" />

      {/* Top Ocean Gradient and Wave Background Header */}
      <View
        style={[
          styles.headerBackgroundWrap,
          { top: -insets.top, height: 275 + insets.top },
        ]}
        pointerEvents="none"
      >
        <Svg
          width="100%"
          height={275 + insets.top}
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
          <Rect
            x="0"
            y="0"
            width="100%"
            height={275 + insets.top}
            fill="url(#screenTopGrad)"
          />
        </Svg>

        <Svg
          viewBox="0 0 1024 496"
          preserveAspectRatio="none"
          style={[styles.headerWaveSvg, { height: 220 + insets.top }]}
        >
          <Path
            d="M0 296C170 226 320 396 490 258 C700 86 791 90 878 85C951 77 1000 34 1024 0 V496H0Z"
            fill="#FFFFFF"
            opacity={0.16}
          />
        </Svg>
      </View>

      <View style={styles.fixedDashboard}>
        <ContentContainer maxWidth={isWide ? 900 : 480} paddingH={18}>
          {/* Header Top Bar: SINSAY White Logo on left, Notification + Resort/Profile Avatar on right */}
          <View style={styles.topBar}>
            <Image
              source={require("../../../assets/sinsay-white-home.webp")}
              style={[styles.logoImage, isCompact && styles.compactLogoImage]}
              contentFit="contain"
              contentPosition={{ left: 0, top: "50%" }}
              priority="high"
              cachePolicy="memory-disk"
              accessibilityLabel="SINSAY"
            />

            <View style={[styles.topBarActions, isCompact && { gap: 6 }]}>
              <TouchableOpacity
                style={styles.notificationBtn}
                onPress={openNotifications}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Notifications, ${unreadCount} unread`}
              >
                <Ionicons name="notifications" size={20} color="#0b206b" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={() => router.push("/(operator-tabs)/profile")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Operator profile"
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImg}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="business" size={20} color="#006bff" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting Section below Logo */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle} numberOfLines={1}>
              Hi, {establishmentName || "Operator"}!
            </Text>
            <Text style={styles.greetingSubtitle}>Logged in as Operator</Text>
          </View>

          {/* Pass Gate Depletion Warning */}
          {!statLoading &&
            !statError &&
            remainingPasses !== null &&
            remainingPasses <= 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="alert-circle" size={16} color="#D97706" />
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

          {/* 3 Overview Stat Cards */}
          {statError ? (
            <View style={styles.retrySection}>
              <Text style={styles.retryText}>Failed to load statistics</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadStats}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.statsRow, isCompact && styles.compactStatsRow]}>
              {/* Card 1: Today's Divers */}
              <View style={[styles.statCard, isCompact && styles.compactStatCard]}>
                <View style={styles.statHeadingRow}>
                  <View style={styles.statIconBubble}>
                    <Ionicons name="calendar" size={12} color="#006bff" />
                  </View>
                  <Text style={styles.statHeadingText}>TODAY&apos;S DIVERS</Text>
                </View>

                <AnimatedKpiValue
                  value={todayDivers}
                  loading={statLoading}
                  style={styles.statValue}
                />

                {/* Top-Right Sparkline */}
                <Svg
                  style={styles.sparkline}
                  viewBox="0 0 145 80"
                  pointerEvents="none"
                >
                  <Defs>
                    <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#5cb6fa" stopOpacity={0.55} />
                      <Stop offset="1" stopColor="#5cb6fa" stopOpacity={0} />
                    </LinearGradient>
                  </Defs>
                  <Path
                    d="M0 56H20L35 45 50 46 65 37 91 42Q116 11 138 7V80H0Z"
                    fill="url(#sparkFill)"
                  />
                  <Path
                    d="M0 56H20L35 45 50 46 65 37 91 42Q116 11 138 7"
                    fill="none"
                    stroke="#168bff"
                    strokeWidth={2.8}
                  />
                  <Circle
                    cx={138}
                    cy={7}
                    r={4}
                    fill="#006bff"
                    stroke="#FFFFFF"
                    strokeWidth={1.8}
                  />
                </Svg>

                <View style={styles.statNoteRow}>
                  <Ionicons
                    name={deltaDivers >= 0 ? "arrow-up" : "arrow-down"}
                    size={9.5}
                    color="#00bc88"
                  />
                  <Text style={styles.statNoteText} numberOfLines={1}>
                    {deltaText}
                  </Text>
                </View>
              </View>

              {/* Card 2: Remaining Passes */}
              <View style={[styles.statCard, isCompact && styles.compactStatCard]}>
                <View style={styles.statHeadingRow}>
                  <View style={styles.statIconBubble}>
                    <Ionicons name="ticket" size={12} color="#006bff" />
                  </View>
                  <Text style={styles.statHeadingText}>REMAINING PASSES</Text>
                </View>

                <AnimatedKpiValue
                  value={currentRemaining}
                  loading={statLoading}
                  style={styles.statValue}
                />

                {/* Top-Right Mini Donut Ring */}
                <Svg
                  style={styles.miniRing}
                  viewBox="0 0 100 100"
                  pointerEvents="none"
                >
                  <Circle
                    cx={50}
                    cy={50}
                    r={40}
                    fill="none"
                    stroke="#d5e8ff"
                    strokeWidth={11}
                  />
                  <Circle
                    cx={50}
                    cy={50}
                    r={40}
                    fill="none"
                    stroke="#168bff"
                    strokeWidth={11}
                    strokeDasharray={`${(passUsagePercent / 100) * 251.3} 251.3`}
                    transform="rotate(-90 50 50)"
                  />
                  <SvgText
                    x={50}
                    y={55}
                    textAnchor="middle"
                    fill="#0b206b"
                    fontSize={17}
                    fontFamily="Quicksand_700Bold"
                  >
                    {passUsagePercent}%
                  </SvgText>
                </Svg>

                <Text style={styles.statMutedNote} numberOfLines={1}>
                  of {totalPurchased} purchased
                </Text>
              </View>

              {/* Card 3: Manifesto Sent */}
              <View style={[styles.statCard, isCompact && styles.compactStatCard]}>
                <View style={styles.statHeadingRow}>
                  <View style={styles.statIconBubble}>
                    <Ionicons name="paper-plane" size={11} color="#006bff" />
                  </View>
                  <Text style={styles.statHeadingText}>MANIFESTO SENT</Text>
                </View>

                <AnimatedKpiValue
                  value={weekCount}
                  loading={statLoading}
                  style={styles.statValue}
                />

                {/* Top-Right 4 Ascending Mini Bars */}
                <View style={styles.barsContainer} pointerEvents="none">
                  <View style={[styles.miniBar, { height: 10, backgroundColor: "#b7deff" }]} />
                  <View style={[styles.miniBar, { height: 18, backgroundColor: "#86d7ff" }]} />
                  <View style={[styles.miniBar, { height: 25, backgroundColor: "#62cefc" }]} />
                  <View style={[styles.miniBar, { height: 33, backgroundColor: "#78dfd8" }]} />
                </View>

                <Text style={styles.statMutedNote} numberOfLines={1}>
                  This week
                </Text>
              </View>
            </View>
          )}

          {/* Dual Action Buttons directly under the 3 KPI cards */}
          <View style={styles.actionsRow}>
            {/* Action 1: Create Dive Manifest */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.88}
              onPress={() => router.push("/establishment/create-manifest/step1")}
              accessibilityRole="button"
              accessibilityLabel="Create Dive Manifest"
            >
              <Svg
                style={StyleSheet.absoluteFill}
                preserveAspectRatio="none"
                pointerEvents="none"
              >
                <Defs>
                  <LinearGradient id="ctaGrad1" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#0061f6" />
                    <Stop offset="1" stopColor="#0D68D0" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={10} fill="url(#ctaGrad1)" />
              </Svg>
              <View style={styles.actionContent}>
                <View style={styles.actionSymbol}>
                  <Ionicons name="add" size={15} color="#0061f6" />
                </View>
                <Text
                  style={styles.actionBtnText}
                  numberOfLines={2}
                  ellipsizeMode="clip"
                >
                  Create Dive Manifest
                </Text>
              </View>
            </TouchableOpacity>

            {/* Action 2: Buy Dive Credits */}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.88}
              onPress={() => router.push("/(operator-tabs)/buy-pass")}
              accessibilityRole="button"
              accessibilityLabel="Buy Dive Credits"
            >
              <Svg
                style={StyleSheet.absoluteFill}
                preserveAspectRatio="none"
                pointerEvents="none"
              >
                <Defs>
                  <LinearGradient id="ctaGrad2" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#1682ff" />
                    <Stop offset="1" stopColor="#1267CF" />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" rx={10} fill="url(#ctaGrad2)" />
              </Svg>
              <View style={styles.actionContent}>
                <View style={styles.actionSymbol}>
                  <Ionicons name="card" size={14} color="#0061f6" />
                </View>
                <Text
                  style={styles.actionBtnText}
                  numberOfLines={2}
                  ellipsizeMode="clip"
                >
                  Buy Dive Credits
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ContentContainer>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={isWide ? 900 : 480} paddingH={18}>
          {/* Recent Manifests Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Manifests</Text>
            <TouchableOpacity
              onPress={() => router.push("/(operator-tabs)/manifests")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="See all manifests"
            >
              <Text style={styles.seeAllLink}>See all ›</Text>
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
              style={{ marginVertical: 20 }}
            />
          ) : manifests.length > 0 ? (
            <View style={styles.manifestList}>
              {manifests.slice(0, 5).map((m) => {
                const realStatus = deriveManifestStatus(m.dive_date);
                const statusLabel = realStatus === "active" ? "Active" : realStatus === "upcoming" ? "Upcoming" : "Completed";
                const isBoatDive = m.dive_mode === "Boat Dive";
                const title = m.boat_name || m.dive_mode || "Dive Group";

                return (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.manifestCard}
                    activeOpacity={0.78}
                    onPress={() => router.push("/(operator-tabs)/manifests")}
                    accessibilityRole="button"
                    accessibilityLabel={`${title}, ${m.location}, ${statusLabel}`}
                  >
                    <View
                      style={[
                        styles.manifestSymbol,
                        !isBoatDive && styles.manifestSymbolShore,
                      ]}
                    >
                      <Ionicons
                        name={isBoatDive ? "boat" : m.dive_mode === "Night Dive" ? "moon" : "umbrella"}
                        size={20}
                        color="#006bff"
                      />
                    </View>

                    <View style={styles.manifestInfo}>
                      <Text style={styles.manifestTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={styles.manifestMeta} numberOfLines={1}>
                        {formatDiveDate(m.dive_date)} · {m.diver_count} divers ·{" "}
                        {m.location}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        realStatus === "active"
                          ? styles.statusPillActive
                          : realStatus === "upcoming"
                          ? styles.statusPillUpcoming
                          : styles.statusPillDone,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
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
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={32}
                color="#94A3B8"
              />
              <Text style={styles.emptyText}>
                No manifests yet. Create your first one!
              </Text>
            </View>
          )}
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  authLoadingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authLoadingStats: {
    flexDirection: "row",
    gap: 12,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f9ff",
    paddingBottom: 0,
  },
  container: {
    flex: 1,
    minHeight: 0,
  },
  fixedDashboard: {
    flexShrink: 0,
    paddingTop: 0,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerBackgroundWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 275,
    overflow: "hidden",
    zIndex: -1,
  },
  headerWaveSvg: {
    position: "absolute",
    top: 10,
    left: 0,
    width: "100%",
    height: 220,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 4,
  },
  logoImage: {
    width: 140,
    height: 42,
    marginLeft: -1,
  },
  compactLogoImage: {
    width: 113,
    height: 34,
    marginLeft: -1,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#006bff",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notificationBadgeText: {
    fontSize: 8.5,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  greetingBlock: {
    marginTop: 4,
    marginBottom: 12,
  },
  greetingTitle: {
    fontSize: 25,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  greetingSubtitle: {
    fontSize: 14,
    fontFamily: "Quicksand_600SemiBold",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 3,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#92400E",
    flex: 1,
    lineHeight: 16,
  },
  warningLink: {
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
    textDecorationLine: "underline",
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  compactStatsRow: {
    gap: 4,
  },
  statCard: {
    flex: 1,
    height: 94,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    padding: 8,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.22)",
    shadowColor: "#6fb9ed",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  compactStatCard: {
    padding: 5,
    borderRadius: 8,
  },
  statHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statIconBubble: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#d7ebff",
    alignItems: "center",
    justifyContent: "center",
  },
  statHeadingText: {
    fontSize: 6.8,
    fontFamily: "Quicksand_700Bold",
    color: "#6382cf",
    letterSpacing: 0.1,
  },
  statValue: {
    fontSize: 28,
    fontFamily: "Quicksand_700Bold",
    color: "#0b206b",
    lineHeight: 32,
    marginTop: 2,
  },
  sparkline: {
    position: "absolute",
    top: 36,
    right: 4,
    width: 52,
    height: 30,
  },
  miniRing: {
    position: "absolute",
    top: 28,
    right: 5,
    width: 38,
    height: 38,
  },
  barsContainer: {
    position: "absolute",
    top: 34,
    right: 8,
    height: 34,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2.5,
  },
  miniBar: {
    width: 5,
    borderRadius: 3,
  },
  statNoteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  statNoteText: {
    fontSize: 7.2,
    fontFamily: "Quicksand_600SemiBold",
    color: "#00bc88",
  },
  statMutedNote: {
    fontSize: 7.2,
    fontFamily: "Quicksand_500Medium",
    color: "#6382cf",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6fb9ed",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  actionSymbol: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    maxWidth: "100%",
  },
  actionBtnText: {
    flexShrink: 1,
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: "#0b206b",
  },
  seeAllLink: {
    fontSize: 13,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
  manifestList: {
    gap: 8,
  },
  manifestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    gap: 12,
    shadowColor: "#4089dc",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  manifestSymbol: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#e7f3ff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  manifestSymbolShore: {
    backgroundColor: "#fee2e2",
  },
  manifestInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  manifestTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  manifestMeta: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 8,
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPillActive: {
    backgroundColor: "#d4f7ed",
  },
  statusPillUpcoming: {
    backgroundColor: "#e0f2fe",
  },
  statusTextUpcoming: {
    color: "#0284c7",
  },
  statusPillDone: {
    backgroundColor: "#d9eaff",
  },
  statusPillText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    letterSpacing: 0.1,
  },
  statusTextActive: {
    color: "#00a671",
  },
  statusTextDone: {
    color: "#006bff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    textAlign: "center",
  },
  retrySection: {
    alignItems: "center",
    marginVertical: 14,
    gap: 6,
  },
  retryText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  retryBtnText: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
});
