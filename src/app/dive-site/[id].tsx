import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { supabase } from "../../lib/supabase";
import { colors } from "../../constants/colors";
import { DiveSiteRow } from "../../types/supabase";
import { ContentContainer, ErrorState } from "../../components";

const difficultyColors: Record<string, string> = {
  Beginner: "#10B981",
  Intermediate: "#F59E0B",
  Advanced: "#EF4444",
};

export default function DiveSiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [site, setSite] = useState<DiveSiteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase.from("dive_sites").select("*").eq("id", id).single().then(({ data, error }) => {
      if (!error && data) setSite(data);
      setLoading(false);
    });
  }, [id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Dive Site</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : !site ? (
        <ErrorState
          message="Dive site not found"
          onRetry={() => router.back()}
          retryLabel="Go Back"
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <ContentContainer maxWidth={720} paddingH={16}>
          <>
            <View style={styles.hero}>
              <View style={styles.heroOverlay}>
                <Ionicons name="water" size={40} color={colors.white} />
              </View>
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => setLiked(!liked)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? colors.heartRed : colors.white}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.contentSection}>
              <View style={styles.titleRow}>
                <Text style={styles.siteName}>{site.name}</Text>
                {site.rating && (
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={14} color={colors.starYellow} />
                    <Text style={styles.ratingText}>{site.rating}</Text>
                  </View>
                )}
              </View>

              {site.difficulty && (
                <View style={styles.difficultyRow}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: difficultyColors[site.difficulty] || colors.gray },
                    ]}
                  >
                    <Text style={styles.difficultyText}>{site.difficulty}</Text>
                  </View>
                </View>
              )}

              {site.description && (
                <Text style={styles.description}>{site.description}</Text>
              )}
            </View>
          </>
          </ContentContainer>
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  hero: {
    height: 200,
    backgroundColor: colors.navy,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroOverlay: {
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  heartBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentSection: {
    paddingTop: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  siteName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.darkText,
    flex: 1,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.grayLight,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
  },
  difficultyRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  difficultyBadge: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  description: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 22,
    marginTop: 16,
  },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, gap: 12, marginTop: 80,
  },
});
