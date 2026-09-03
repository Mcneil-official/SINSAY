import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import {
  Button,
  Card,
  ErrorState,
  ProgressBar,
  ScreenHeader,
  StatusBadge,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { spacing } from "../../../constants/spacing";
import { typography } from "../../../constants/typography";
import { useLayout } from "../../../context/LayoutContext";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

export default function EcoDiveIDScreen() {
  const router = useRouter();
  const { user, profile, ecoId, isLoading, refreshProfile } = useAuth();
  const { isDesktop, isTablet } = useLayout();
  const isWide = isDesktop || isTablet;
  const [completionPct, setCompletionPct] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/loginpage");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (
      !isLoading &&
      (ecoId?.status === "complete" || ecoId?.status === "active")
    ) {
      router.replace("/eco-dive-id/complete");
    }
  }, [isLoading, ecoId, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("dive_profile_completion")
      .select("completion_pct")
      .eq("tourist_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setCompletionPct(data.completion_pct);
      });
  }, [user, profile]);

  if (isLoading) {
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

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          message="Unable to load profile data."
          description="Your account may not be fully set up. Please contact support or try again."
          onRetry={() => refreshProfile()}
        />
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
    ...(isCertified
      ? [
          profile?.certification_level,
          profile?.date_accredited,
          profile?.renewal_date,
        ]
      : []),
  ].filter(Boolean).length;

  const localPct = Math.round((filledCount / totalFields) * 100);
  const pct = completionPct ?? localPct;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScreenHeader
        title="Digital Diver ID"
        subtitle="Your official dive identity in Mabini"
        onBack={() => router.back()}
        size="large"
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isWide ? (
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
                <Text style={styles.idCardName}>
                  {profile?.full_name || "Diver"}
                </Text>
                <Text style={styles.idCardCode}>
                  ECO-{new Date().getFullYear()}-
                  {String(
                    profile?.id?.charCodeAt(0) ||
                      Math.floor(Math.random() * 999),
                  ).padStart(6, "0")}
                </Text>
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
                  Complete your diver profile to be eligible for dive
                  activities.
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
              <Text style={styles.idCardName}>
                {profile?.full_name || "Diver"}
              </Text>
              <Text style={styles.idCardCode}>
                ECO-{new Date().getFullYear()}-
                {String(
                  profile?.id?.charCodeAt(0) || Math.floor(Math.random() * 999),
                ).padStart(6, "0")}
              </Text>
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
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
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
    marginTop: spacing.lg,
    height: 200,
    borderRadius: 24,
    backgroundColor: colors.navy,
    padding: spacing.lg,
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
    ...typography.overline,
    color: colors.white,
    letterSpacing: 1,
  },
  idCardName: {
    ...typography.h1,
    color: colors.white,
  },
  idCardCode: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  completionSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  completionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completionLabel: {
    ...typography.overline,
  },
  completionPct: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
  },
  completionCaption: {
    ...typography.caption,
    lineHeight: 16,
  },
  infoBox: {
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  infoTitle: {
    ...typography.h3,
    color: colors.amberDark,
    marginBottom: spacing.md,
  },
  infoBullets: {
    gap: spacing.sm,
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
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  desktopRow: {
    flexDirection: "row",
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  desktopLeft: {
    flex: 1,
  },
  desktopRight: {
    flex: 1,
    gap: spacing.lg,
  },
});
