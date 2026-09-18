import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ContentContainer } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

type PassType = "one-day" | "annual";

export default function BuyPassSelectionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [passType, setPassType] = useState<PassType>("one-day");
  const [quantity, setQuantity] = useState<number>(50);

  // Live or fallback pass inventory metrics
  const [oneDayPassesLeft, setOneDayPassesLeft] = useState<number>(128);
  const oneDayTotal = 365;

  const [annualPassesLeft, setAnnualPassesLeft] = useState<number>(7);
  const annualTotal = 15;

  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        const { data: ledger } = await supabase
          .from("operator_pass_ledger")
          .select("remaining_passes")
          .eq("operator_id", user.id)
          .maybeSingle();

        if (
          ledger?.remaining_passes !== null &&
          ledger?.remaining_passes !== undefined
        ) {
          setOneDayPassesLeft(ledger.remaining_passes);
        }
      } catch (e) {
        console.warn("Could not load operator pass data:", e);
      }
    })();
  }, [user]);

  const unitPrice = passType === "one-day" ? 150 : 1500;
  const total = quantity * unitPrice;

  const handleDecrease = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => (prev < 365 ? prev + 1 : 365));
  };

  const handleSelectType = (type: PassType) => {
    setPassType(type);
    if (type === "annual" && quantity > 15) {
      setQuantity(1);
    } else if (type === "one-day" && quantity < 5) {
      setQuantity(50);
    }
  };

  const handleProceed = () => {
    router.push({
      pathname: "/(operator-tabs)/buy-pass/payment",
      params: {
        passId: passType === "one-day" ? "one-day-pass" : "annual-pass",
        passLabel: passType === "one-day" ? "One-Day Dive Pass" : "Annual Dive Pass",
        passCount: String(quantity),
        quantity: String(quantity),
        total: String(total),
        unitPrice: String(unitPrice),
      },
    });
  };

  const oneDayPercent = Math.min(100, Math.max(5, Math.round((oneDayPassesLeft / oneDayTotal) * 100)));
  const annualPercent = Math.min(100, Math.max(5, Math.round((annualPassesLeft / annualTotal) * 100)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Back Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={480}>
          {/* Top 2 Metric Cards */}
          <View style={styles.metricsRow}>
            {/* One-Day Dive Pass Card */}
            <View style={styles.oneDayCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.oneDayCardTitle}>{"ONE-DAY DIVE\nPASS"}</Text>
                <Ionicons name="calendar-outline" size={22} color="#2563EB" />
              </View>
              <Text style={styles.oneDayBigNumber}>{oneDayPassesLeft}</Text>
              <Text style={styles.oneDaySubtext}>
                of {oneDayTotal} passes left
              </Text>
              <View style={styles.oneDayTrack}>
                <View style={[styles.oneDayFill, { width: `${oneDayPercent}%` }]} />
              </View>
            </View>

            {/* Annual Dive Pass Card */}
            <View style={styles.annualCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.annualCardTitle}>{"ANNUAL DIVE\nPASS"}</Text>
                <Ionicons name="sunny" size={22} color="#EAB308" />
              </View>
              <Text style={styles.annualBigNumber}>{annualPassesLeft}</Text>
              <Text style={styles.annualSubtext}>
                of {annualTotal} passes available
              </Text>
              <View style={styles.annualTrack}>
                <View style={[styles.annualFill, { width: `${annualPercent}%` }]} />
              </View>
            </View>
          </View>

          {/* Main Purchase Card */}
          <View style={styles.mainCard}>
            {/* Dive Pass Type Section */}
            <Text style={styles.sectionLabel}>Dive Pass Type</Text>
            <View style={styles.toggleRow}>
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.toggleBtn,
                  passType === "one-day" ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => handleSelectType("one-day")}
                accessibilityRole="button"
                accessibilityState={{ selected: passType === "one-day" }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    passType === "one-day"
                      ? styles.toggleBtnTextActive
                      : styles.toggleBtnTextInactive,
                  ]}
                >
                  One-Day Dive Pass
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.toggleBtn,
                  passType === "annual" ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
                onPress={() => handleSelectType("annual")}
                accessibilityRole="button"
                accessibilityState={{ selected: passType === "annual" }}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    passType === "annual"
                      ? styles.toggleBtnTextActive
                      : styles.toggleBtnTextInactive,
                  ]}
                >
                  Annual Dive Pass
                </Text>
              </TouchableOpacity>
            </View>

            {/* Specify Dive Pass Quantity Section */}
            <Text style={[styles.sectionLabel, { marginTop: 22 }]}>
              Specify Dive Pass Quantity
            </Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.stepMinusBtn}
                onPress={handleDecrease}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={24} color="#1D4ED8" />
              </TouchableOpacity>

              <View style={styles.quantityBox}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.stepPlusBtn}
                onPress={handleIncrease}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Pricing Breakdown */}
            <View style={styles.breakdownSection}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Price per pass</Text>
                <Text style={styles.breakdownValue}>₱{unitPrice}</Text>
              </View>
              <View style={[styles.breakdownRow, { marginTop: 12 }]}>
                <Text style={styles.breakdownLabel}>Quantity</Text>
                <Text style={styles.breakdownValue}>{quantity}</Text>
              </View>
            </View>

            {/* Total Highlight Container */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>₱{total.toLocaleString()}</Text>
            </View>
          </View>

          {/* Approval Notice Banner */}
          <View style={styles.noticeBanner}>
            <View style={styles.noticeHeaderRow}>
              <Ionicons name="timer-outline" size={16} color="#1D4ED8" />
              <Text style={styles.noticeTitle}>Approval time</Text>
            </View>
            <Text style={styles.noticeBody}>
              TO verifies within 24 hours. Credits added once approved.
            </Text>
          </View>

          {/* Pay & Upload Receipt Action Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.payBtn}
            onPress={handleProceed}
            accessibilityRole="button"
            accessibilityLabel="Pay and upload receipt"
          >
            <Text style={styles.payBtnText}>Pay & Upload Receipt</Text>
          </TouchableOpacity>
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 40,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  // One-Day Card
  oneDayCard: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  oneDayCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  oneDayBigNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  oneDaySubtext: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#3B82F6",
    marginTop: 4,
    marginBottom: 10,
  },
  oneDayTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DBEAFE",
    overflow: "hidden",
  },
  oneDayFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1D4ED8",
  },

  // Annual Card
  annualCard: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#DCFCE7",
    padding: 16,
  },
  annualCardTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#15803D",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  annualBigNumber: {
    fontSize: 28,
    fontWeight: "900",
    color: "#15803D",
    letterSpacing: -0.5,
  },
  annualSubtext: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#16A34A",
    marginTop: 4,
    marginBottom: 10,
  },
  annualTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DCFCE7",
    overflow: "hidden",
  },
  annualFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16A34A",
  },

  // Main Card
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  sectionLabel: {
    fontSize: 14.5,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },

  // Toggle Row
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  toggleBtnActive: {
    backgroundColor: "#1D4ED8",
  },
  toggleBtnInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  toggleBtnText: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
  },
  toggleBtnTextInactive: {
    color: "#334155",
  },

  // Stepper Row
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepMinusBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1D4ED8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityBox: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },
  stepPlusBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },

  // Breakdown
  breakdownSection: {
    marginTop: 24,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },

  // Total Box
  totalBox: {
    marginTop: 18,
    backgroundColor: "#EBF3FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1D4ED8",
  },

  // Notice Banner
  noticeBanner: {
    marginTop: 16,
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    borderLeftWidth: 4,
    borderLeftColor: "#1D4ED8",
    padding: 14,
  },
  noticeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  noticeBody: {
    fontSize: 12,
    color: "#1E3A8A",
    marginTop: 4,
    lineHeight: 18,
  },

  // Pay Button
  payBtn: {
    marginTop: 18,
    backgroundColor: "#FA6400",
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FA6400",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
