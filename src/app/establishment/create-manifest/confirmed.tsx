import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
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
import { useAuth } from "../../../hooks/useAuth";
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
  } = useLocalSearchParams<{
    manifestId?: string;
    location?: string;
    diverCount?: string;
    boatName?: string;
    captainName?: string;
    remainingBalance?: string;
    diveMasters?: string;
    crewMembers?: string;
  }>();

  const { user } = useAuth();
  const [balance, setBalance] = useState<string | undefined>(remainingBalance);

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

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const displayId = manifestId
    ? manifestId.length > 12
      ? `MFT-2026-${manifestId.slice(0, 5).toUpperCase()}`
      : manifestId
    : "MFT-SUBMITTED";

  const numDivers = parseInt(diverCount || "1", 10) || 1;

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

          {/* Structured Manifest Metadata Card */}
          <View style={styles.detailsCard}>
            {/* Card Header with Manifest ID Badge */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderLeft}>
                <Ionicons name="document-text" size={17} color={colors.primaryBlue} />
                <Text style={styles.cardHeaderTitle}>Manifest Summary</Text>
              </View>
              <View style={styles.manifestIdBadge}>
                <Text style={styles.manifestIdText}>{displayId}</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Dive Site */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelGroup}>
                <Ionicons name="location-outline" size={16} color="#64748B" style={styles.rowIcon} />
                <Text style={styles.detailLabel}>Dive Site</Text>
              </View>
              <Text style={styles.detailValue} numberOfLines={1}>
                {location || "Anilao Cove, Mabini"}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            {/* Tourist Divers */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelGroup}>
                <Ionicons name="people-outline" size={16} color="#64748B" style={styles.rowIcon} />
                <Text style={styles.detailLabel}>Tourist Divers</Text>
              </View>
              <View style={styles.diverValuePill}>
                <Text style={styles.diverValuePillText}>
                  {numDivers} Diver{numDivers === 1 ? "" : "s"} Activated
                </Text>
              </View>
            </View>

            {/* Vessel / Boat Details */}
            {boatName ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelGroup}>
                    <Ionicons name="boat-outline" size={16} color="#64748B" style={styles.rowIcon} />
                    <Text style={styles.detailLabel}>Boat Name</Text>
                  </View>
                  <Text style={styles.detailValue}>{boatName}</Text>
                </View>
              </>
            ) : null}

            {/* Captain / Guide */}
            {captainName ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelGroup}>
                    <Ionicons name="navigate-outline" size={16} color="#64748B" style={styles.rowIcon} />
                    <Text style={styles.detailLabel}>Captain / Guide</Text>
                  </View>
                  <Text style={styles.detailValue}>{captainName}</Text>
                </View>
              </>
            ) : null}

            {/* Dive Master(s) */}
            {diveMasters ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelGroup}>
                    <Ionicons name="ribbon-outline" size={16} color="#64748B" style={styles.rowIcon} />
                    <Text style={styles.detailLabel}>Dive Master(s)</Text>
                  </View>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {diveMasters}
                  </Text>
                </View>
              </>
            ) : null}

            {/* Boat Crew */}
            {crewMembers ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelGroup}>
                    <Ionicons name="person-outline" size={16} color="#64748B" style={styles.rowIcon} />
                    <Text style={styles.detailLabel}>Boat Crew</Text>
                  </View>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {crewMembers}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={styles.cardDivider} />

            {/* Submitted Date & Time */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabelGroup}>
                <Ionicons name="time-outline" size={16} color="#64748B" style={styles.rowIcon} />
                <Text style={styles.detailLabel}>Submitted At</Text>
              </View>
              <Text style={styles.detailValue}>
                {formattedDate} • {formattedTime}
              </Text>
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
          </View>

          {/* Action Buttons */}
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
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
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 48,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  container: {
    width: "100%",
    alignSelf: "center",
  },

  /* Hero Section */
  heroSection: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 8,
  },
  checkRingOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#A7F3D0",
  },
  checkRingMiddle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  checkRingInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 420,
  },

  /* LGU Real-Time Activation Banner */
  lguBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  lguIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  lguContent: {
    flex: 1,
  },
  lguTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  lguTitle: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#166534",
  },
  liveSyncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  liveSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A34A",
  },
  liveSyncText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    color: "#166534",
    letterSpacing: 0.4,
  },
  lguBody: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#15803D",
    lineHeight: 18,
  },
  boldText: {
    fontFamily: "Quicksand_700Bold",
  },

  /* Details Card */
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  manifestIdBadge: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
  },
  manifestIdText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  detailLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  rowIcon: {
    width: 18,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  detailValue: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    textAlign: "right",
    flexShrink: 1,
  },
  diverValuePill: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diverValuePillText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#15803D",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },

  /* Pass Credit Summary Strip */
  creditStrip: {
    marginTop: 14,
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#D6E8FF",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  creditStripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  creditIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  creditStripLabel: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: "#1E3A8A",
  },
  creditStripSub: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#3B82F6",
  },
  creditBalanceBadge: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  creditBalanceNumber: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
    lineHeight: 18,
  },
  creditBalanceUnit: {
    fontSize: 9.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
    marginTop: -1,
  },

  /* Buttons */
  btnGroup: {
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  outlineBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    borderRadius: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnText: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
});
