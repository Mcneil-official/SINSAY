import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { colors } from "../../../constants/colors";
import { Button, ProgressBar, StatusBadge, Card } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { useLayout } from "../../../context/LayoutContext";
import { supabase } from "../../../lib/supabase";

export default function EcoDiveIDScreen() {
  const router = useRouter();
  const { user, profile, ecoId, isLoading, refreshProfile } = useAuth();
  const { isDesktop } = useLayout();
  const [completionPct, setCompletionPct] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/loginpage");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && (ecoId?.status === "complete" || ecoId?.status === "active")) {
      router.replace("/eco-dive-id/complete");
    }
  }, [isLoading, ecoId, router]);

  useEffect(() => {
    if (!user) return;
    supabase.from("dive_profile_completion").select("completion_pct").eq("tourist_id", user.id).single().then(({ data }) => {
      if (data) setCompletionPct(data.completion_pct);
    });
  }, [user, profile]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.red} />
          <Text style={styles.errorText}>Unable to load profile data.</Text>
          <Text style={styles.errorSubText}>Your account may not be fully set up. Please contact support or try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refreshProfile()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCertified = profile?.type_of_dive === "certified";
  const totalFields = isCertified ? 8 : 5;
  const filledCount = [
    profile?.nationality,
    profile?.emergency_contact_name,
    profile?.emergency_contact_number,
    profile?.dive_pass_type,
    profile?.type_of_dive,
    ...(isCertified ? [
      profile?.certification_level,
      profile?.date_accredited,
      profile?.renewal_date,
    ] : []),
  ].filter(Boolean).length;

  const localPct = Math.round((filledCount / totalFields) * 100);
  const pct = completionPct ?? localPct;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Digital Diver ID</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Your official dive identity in Mabini</Text>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDesktop ? (
          <View style={styles.desktopRow}>
            {/* Left column: ID Card */}
            <View style={styles.desktopLeft}>
              <View style={styles.idCard}>
                <View style={styles.idCardTop}>
                  <View style={styles.ecoPill}>
                    <Ionicons name="water" size={14} color={colors.white} />
                    <Text style={styles.ecoPillText}>ECO-DIVE ID</Text>
                  </View>
                  <StatusBadge label="Incomplete" variant="incomplete" />
                </View>
                <Text style={styles.idCardName}>{profile?.full_name || "Diver"}</Text>
                <Text style={styles.idCardCode}>ECO-{new Date().getFullYear()}-{String(profile?.id?.charCodeAt(0) || Math.floor(Math.random() * 999)).padStart(6, "0")}</Text>
              </View>
            </View>
            {/* Right column: Completion + Actions */}
            <View style={styles.desktopRight}>
              <View style={styles.completionSection}>
                <View style={styles.completionHeader}>
                  <Text style={styles.completionLabel}>PROFILE COMPLETION</Text>
                  <Text style={styles.completionPct}>{pct}%</Text>
                </View>
                <ProgressBar progress={pct} showLabel={false} />
                <Text style={styles.completionCaption}>
                  Complete your diver profile to be eligible for dive activities.
                </Text>
              </View>
              <Button
                title="Complete Diver Profile"
                onPress={() => router.push("/tourist/dive-details/step1")}
              />
              <Card variant="info" style={styles.infoBox}>
                <Text style={styles.infoTitle}>Why is this required?</Text>
                <View style={styles.infoBullets}>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>Ensures safe and verified diving activities</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>Required for inclusion in the dive manifest</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>Supports marine conservation and monitoring</Text>
                  </View>
                </View>
              </Card>
            </View>
          </View>
        ) : (
          <>
            {/* Gradient ID Card */}
            <View style={styles.idCard}>
              <View style={styles.idCardTop}>
                <View style={styles.ecoPill}>
                  <Ionicons name="water" size={14} color={colors.white} />
                  <Text style={styles.ecoPillText}>ECO-DIVE ID</Text>
                </View>
                <StatusBadge label="Incomplete" variant="incomplete" />
              </View>
              <Text style={styles.idCardName}>{profile?.full_name || "Diver"}</Text>
              <Text style={styles.idCardCode}>ECO-{new Date().getFullYear()}-{String(profile?.id?.charCodeAt(0) || Math.floor(Math.random() * 999)).padStart(6, "0")}</Text>
            </View>

            {/* Profile Completion */}
            <View style={styles.completionSection}>
              <View style={styles.completionHeader}>
                <Text style={styles.completionLabel}>PROFILE COMPLETION</Text>
                <Text style={styles.completionPct}>{pct}%</Text>
              </View>
              <ProgressBar progress={pct} showLabel={false} />
              <Text style={styles.completionCaption}>
                Complete your diver profile to be eligible for dive activities.
              </Text>
            </View>

            {/* Complete Driver Profile button */}
            <Button
              title="Complete Diver Profile"
              onPress={() => router.push("/tourist/dive-details/step1")}
            />

            {/* Why is this required? info box */}
            <Card variant="info" style={styles.infoBox}>
              <Text style={styles.infoTitle}>Why is this required?</Text>
              <View style={styles.infoBullets}>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Ensures safe and verified diving activities
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Required for inclusion in the dive manifest
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>
                    Supports marine conservation and monitoring
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.darkText,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  idCard: {
    marginTop: 20,
    height: 200,
    borderRadius: 24,
    backgroundColor: colors.navy,
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  idCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ecoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ecoPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  idCardName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  idCardCode: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  completionSection: {
    marginTop: 24,
    gap: 8,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.gray,
    letterSpacing: 0.5,
  },
  completionPct: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
  },
  completionCaption: {
    fontSize: 12,
    color: colors.gray,
    lineHeight: 16,
  },
  infoBox: {
    marginTop: 20,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D97706",
    marginBottom: 10,
  },
  infoBullets: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    color: colors.darkText,
    lineHeight: 18,
  },
  bulletText: {
    fontSize: 13,
    color: colors.darkText,
    lineHeight: 18,
    flex: 1,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  errorText: { fontSize: 14, color: colors.red, textAlign: "center" },
  errorSubText: { fontSize: 13, color: colors.gray, textAlign: "center", marginTop: 8, paddingHorizontal: 24 },
  retryBtn: { borderRadius: 8, backgroundColor: colors.primaryBlue, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { fontSize: 14, fontWeight: "600", color: colors.white },
  desktopRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 12,
  },
  desktopLeft: {
    flex: 1,
  },
  desktopRight: {
    flex: 1,
    gap: 16,
  },
});
