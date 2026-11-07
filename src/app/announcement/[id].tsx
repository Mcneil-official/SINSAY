import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { ContentContainer, ErrorState } from "../../components";
import { colors } from "../../constants/colors";
import { safeBack } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import { AnnouncementRow } from "../../types/supabase";

const DEFAULT_BANNER = require("../../../assets/hero-banner.jpg");

const DEFAULT_CONSERVATION_ADVISORY: AnnouncementRow = {
  id: "default-conservation",
  title: "Protect Mabini's Vibrant Coral Reefs",
  body: `Mabini enforces a strict no-touch and no-take policy for all corals, sea turtles, and marine species under Municipal Ordinance No. 031-2023.

All visiting divers, freedivers, and snorkelers are required to:
1. Maintain an active digital Eco-Dive ID before every dive trip.
2. Dive exclusively under the supervision of PCSSD-accredited and DOT-recognized dive centers and certified local dive guides.
3. Master neutral buoyancy control—never rest, stand, or kick fins against live coral formations or sandy muck habitats.
4. Strictly refrain from using single-use plastics aboard dive boats and use only reef-safe sunscreen (free of oxybenzone and octinoxate).

Failure to comply with local marine sanctuary ordinances is subject to municipal fines and revocation of diving privileges. Let's work together to preserve the world-class biodiversity of the Verde Island Passage for future generations.`,
  active: true,
  priority: 10,
  image_url: null,
  photo_url: null,
  barangay: "Mabini Marine Sanctuaries",
  start_date: null,
  end_date: null,
  created_at: new Date().toISOString(),
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (id === "default-conservation") {
      setAnnouncement(DEFAULT_CONSERVATION_ADVISORY);
      setLoading(false);
      return;
    }

    let active = true;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    async function loadAnnouncement() {
      // 1. Try exact lookup by UUID or title
      let query = supabase.from("announcements").select("*");
      if (isUuid) {
        query = query.eq("id", id);
      } else {
        const decoded = decodeURIComponent(id).trim();
        query = query.ilike("title", decoded);
      }

      const { data, error } = await query.maybeSingle();
      if (!active) return;
      if (!error && data) {
        setAnnouncement(data);
        setLoading(false);
        return;
      }

      // 2. If title wasn't an exact match, try fuzzy partial match by title
      if (!isUuid) {
        const decoded = decodeURIComponent(id).trim();
        const { data: looseData } = await supabase
          .from("announcements")
          .select("*")
          .ilike("title", `%${decoded}%`)
          .limit(1)
          .maybeSingle();
        if (!active) return;
        if (looseData) {
          setAnnouncement(looseData);
          setLoading(false);
          return;
        }
      }

      // 3. Fallback to default conservation advisory if not found
      setAnnouncement(DEFAULT_CONSERVATION_ADVISORY);
      setLoading(false);
    }

    loadAnnouncement();

    return () => {
      active = false;
    };
  }, [id]);

  const heroSource = announcement?.image_url
    ? { uri: announcement.image_url }
    : announcement?.photo_url
    ? { uri: announcement.photo_url }
    : DEFAULT_BANNER;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Screen Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeBack(router, "/(tabs)")}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcement</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
          <Text style={styles.loadingText}>Loading announcement...</Text>
        </View>
      ) : !announcement ? (
        <ErrorState
          message="Announcement not found."
          onRetry={() => safeBack(router, "/(tabs)")}
          retryLabel="Go Back"
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContentContainer maxWidth={720} paddingH={16}>
            {/* Hero Image Card */}
            <View style={styles.heroWrap}>
              <Image
                source={heroSource}
                style={styles.heroImage}
                contentFit="cover"
                priority="high"
              />

              {/* Gradient overlay for contrast */}
              <View style={styles.gradientOverlay} pointerEvents="none">
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <Defs>
                    <LinearGradient id="heroNoticeGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#020817" stopOpacity="0" />
                      <Stop offset="0.4" stopColor="#020817" stopOpacity="0.3" />
                      <Stop offset="0.8" stopColor="#020817" stopOpacity="0.85" />
                      <Stop offset="1" stopColor="#020817" stopOpacity="0.96" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroNoticeGrad)" />
                </Svg>
              </View>

              {/* Hero Badges on photo */}
              <View style={styles.heroBadgeRow}>
                <View style={styles.officialBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.officialBadgeText}>MABINI TOURISM OFFICE</Text>
                </View>
                {announcement.priority >= 5 && (
                  <View style={styles.priorityBadge}>
                    <Ionicons name="alert-circle" size={12} color="#FFFFFF" />
                    <Text style={styles.priorityBadgeText}>Official Announcement</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Content Article Section */}
            <View style={styles.articleCard}>
              <Text style={styles.titleText}>{announcement.title}</Text>

              {/* Meta Row: Date, Location, Effective Range */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.primaryBlue} />
                  <Text style={styles.metaText}>{formatDate(announcement.created_at)}</Text>
                </View>

                {announcement.barangay ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#059669" />
                    <Text style={styles.metaText}>{announcement.barangay}</Text>
                  </View>
                ) : null}

                {(announcement.start_date || announcement.end_date) && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color="#D97706" />
                    <Text style={styles.metaText}>
                      {[announcement.start_date, announcement.end_date]
                        .filter(Boolean)
                        .map((s) => formatDate(s!))
                        .join(" – ")}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Body Text */}
              <View style={styles.bodyWrap}>
                {(announcement.body || "")
                  .split("\n\n")
                  .map((paragraph, idx) => (
                    <Text key={idx} style={styles.paragraphText}>
                      {paragraph.trim()}
                    </Text>
                  ))}
              </View>

              {/* Back to Home CTA */}
              <TouchableOpacity
                style={styles.backHomeBtn}
                onPress={() => safeBack(router, "/(tabs)")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Return to home screen"
              >
                <Ionicons name="arrow-back" size={16} color={colors.white} />
                <Text style={styles.backHomeBtnText}>Back to Home</Text>
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
    backgroundColor: "#F8FAFC",
  },
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerSpacer: {
    width: 36,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  heroWrap: {
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    position: "relative",
    backgroundColor: "#0B192C",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
  },
  heroBadgeRow: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(2, 132, 199, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#67E8F9",
  },
  officialBadgeText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    letterSpacing: 0.5,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    letterSpacing: 0.3,
  },
  articleCard: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  titleText: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#475569",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 18,
  },
  bodyWrap: {
    gap: 14,
  },
  paragraphText: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Quicksand_500Medium",
    color: "#334155",
  },
  backHomeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    backgroundColor: colors.primaryBlue,
    height: 48,
    borderRadius: 12,
  },
  backHomeBtnText: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
});
