import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, Card, ContentContainer } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

export default function ManifestConfirmedScreen() {
  const router = useRouter();
  const { manifestId, location, diverCount, boatName, captainName, remainingBalance } = useLocalSearchParams<{
    manifestId?: string;
    location?: string;
    diverCount?: string;
    boatName?: string;
    captainName?: string;
    remainingBalance?: string;
  }>();

  const { user } = useAuth();
  // Re-fetch the ledger for the displayed balance: the remainingBalance
  // param is client-computed from a possibly-stale ledger value.
  const [balance, setBalance] = useState<string | undefined>(remainingBalance);

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
        // Keep the param fallback on failure.
      }
    })();
  }, [user]);

  const now = new Date();  const formattedDate = now.toLocaleDateString("en-US", {
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
    ? (manifestId.length > 12 ? `MFT-2026-${manifestId.slice(0, 5).toUpperCase()}` : manifestId)
    : "MFT-2026-04261";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.replace("/(operator-tabs)")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Manifest Submitted</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={540} style={styles.container}>
          {/* Centered Check Icon from Design */}
          <View style={styles.checkOuter}>
            <View style={styles.checkInner}>
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.heading}>Manifest Submitted!</Text>
          <Text style={styles.subheading}>
            The dive manifest has been submitted to the MTO.
          </Text>
          <Text style={styles.subheading}>
            Eco-Dive IDs for {diverCount || "4"} tourists are now ACTIVE.
          </Text>

          <Text style={styles.creditsText}>
            Dive pass credits remaining: {balance ?? "82"}
          </Text>

          {/* Details Card from Design */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manifest ID</Text>
              <Text style={styles.detailValue}>{displayId}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dive Site</Text>
              <Text style={styles.detailValue}>{location || "Anilao Cove, Mabini"}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Divers</Text>
              <Text style={styles.detailValue}>
                {diverCount || "4"} tourists activated
              </Text>
            </View>
          </View>

          {/* Action Buttons from Design */}
          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={styles.primaryBlueBtn}
              activeOpacity={0.88}
              onPress={() => router.replace("/(operator-tabs)")}
            >
              <Text style={styles.primaryBlueBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineBlueBtn}
              activeOpacity={0.88}
              onPress={() => router.replace("/(operator-tabs)/manifests")}
            >
              <Text style={styles.outlineBlueBtnText}>View Manifest Details</Text>
            </TouchableOpacity>
          </View>
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  container: { width: "100%", alignSelf: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  checkOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  checkInner: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  creditsText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryBlue,
    textAlign: "center",
    marginTop: 14,
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailLabel: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  cardDivider: { height: 1, backgroundColor: "#F1F5F9" },
  btnGroup: { gap: 12 },
  primaryBlueBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBlueBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  outlineBlueBtn: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBlueBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
});
