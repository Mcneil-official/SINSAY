import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ContentContainer } from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

type PassType = "one-day" | "annual";

const MAX_PER_ORDER = 50;

export default function BuyPassSelectionScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [passType, setPassType] = useState<PassType>("one-day");
  const [quantity, setQuantity] = useState<number>(1);

  // Server-read pricing (pass_pricing.code = 'one_day' | 'annual'). Annual
  // row is seeded by the TO — absence means "not yet available", never a
  // hardcoded fallback price.
  const [oneDayPrice, setOneDayPrice] = useState<number | null>(null);
  const [annualPrice, setAnnualPrice] = useState<number | null>(null);
  const [pricingError, setPricingError] = useState(false);

  // Live ledger metrics; null = not loaded yet (never magic fallbacks).
  const [oneDayLeft, setOneDayLeft] = useState<number | null>(null);
  const [oneDayPurchased, setOneDayPurchased] = useState<number | null>(null);
  const [annualSlots, setAnnualSlots] = useState<number | null>(null);
  const [annualPurchased, setAnnualPurchased] = useState<number | null>(null);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    (async () => {
      try {
        const { data: pricing, error: pricingErr } = await supabase
          .from("pass_pricing")
          .select("price, code");
        if (pricingErr) throw pricingErr;
        for (const row of pricing || []) {
          if (row.code === "one_day") setOneDayPrice(Number(row.price));
          else if (row.code === "annual") setAnnualPrice(Number(row.price));
        }
      } catch (e) {
        console.warn("Could not load pass pricing:", e);
        setPricingError(true);
      }
      try {
        const { data: ledger, error: ledgerErr } = await supabase
          .from("operator_pass_ledger")
          // select("*"): annual_* columns arrive with 027; pre-027 the view
          // lacks them and ?? null degrades gracefully instead of erroring.
          .select("*")
          .eq("operator_id", user.id)
          .maybeSingle();
        if (ledgerErr) throw ledgerErr;
        if (ledger) {
          setOneDayLeft(ledger.remaining_passes ?? 0);
          setOneDayPurchased(ledger.purchased_passes ?? 0);
          // Annual slot accounting only exists post-027; otherwise unknown.
          setAnnualSlots(ledger.annual_remaining ?? null);
          setAnnualPurchased(ledger.annual_purchased ?? null);
        } else {
          setOneDayLeft(0);
          setOneDayPurchased(0);
        }
      } catch (e) {
        console.warn("Could not load operator pass data:", e);
        setMetricsError(true);
      }
    })();
  }, [user, authLoading]);

  const unitPrice = passType === "one-day" ? oneDayPrice : annualPrice;
  const pricingReady = unitPrice !== null && unitPrice > 0;
  // Direct-entry text mirrors quantity; total/proceed only trust it when it
  // parses to a whole number in range (empty/partial input blocks Proceed
  // instead of silently using a stale quantity).
  const [qtyText, setQtyText] = useState("1");
  const parsedQty = Number(qtyText);
  const qtyValid =
    Number.isInteger(parsedQty) && parsedQty >= 1 && parsedQty <= MAX_PER_ORDER;
  const effectiveQty = qtyValid ? parsedQty : 0;
  const total = pricingReady ? effectiveQty * (unitPrice as number) : 0;
  const canProceed = pricingReady && qtyValid;

  const commitQty = (q: number) => {
    const clamped = Math.min(Math.max(q, 1), MAX_PER_ORDER);
    setQuantity(clamped);
    setQtyText(String(clamped));
  };

  const handleDecrease = () => {
    commitQty(quantity - 1);
  };

  const handleIncrease = () => {
    commitQty(quantity + 1);
  };

  const handleQtyText = (v: string) => {
    const digits = v.replace(/[^0-9]/g, "").slice(0, 3);
    setQtyText(digits);
    const n = Number(digits);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_PER_ORDER) {
      setQuantity(n);
    }
  };

  const handleQtyBlur = () => {
    // Snap partial/invalid typing back to the last committed quantity.
    if (!qtyValid) setQtyText(String(quantity));
  };

  const handleSelectType = (type: PassType) => {
    setPassType(type);
    commitQty(quantity);
  };

  const handleProceed = () => {
    if (!canProceed) return;
    router.push({
      pathname: "/(operator-tabs)/buy-pass/payment",
      params: {
        passId: passType === "one-day" ? "one-day-pass" : "annual-pass",
        passLabel: passType === "one-day" ? "One-Day Dive Pass" : "Annual Dive Pass",
        passCount: String(effectiveQty),
        quantity: String(effectiveQty),
        total: String(total),
        unitPrice: String(unitPrice),
      },
    });
  };

  const oneDayPercent =
    oneDayLeft !== null && (oneDayPurchased ?? 0) > 0
      ? Math.min(100, Math.max(5, Math.round((oneDayLeft / (oneDayPurchased as number)) * 100)))
      : 5;
  const annualPercent =
    annualSlots !== null && (annualPurchased ?? 0) > 0
      ? Math.min(100, Math.max(5, Math.round((annualSlots / (annualPurchased as number)) * 100)))
      : 5;
  const annualAvailable = annualPrice !== null && annualPrice > 0;

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
              <Text style={styles.oneDayBigNumber}>{oneDayLeft ?? "…"}</Text>
              <Text style={styles.oneDaySubtext}>
                of {oneDayPurchased ?? "…"} passes left
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
              <Text style={styles.annualBigNumber}>{annualSlots ?? "…"}</Text>
              <Text style={styles.annualSubtext}>
                of {annualPurchased ?? "…"} slots available
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
                  !annualAvailable && styles.toggleBtnDisabled,
                ]}
                onPress={() => annualAvailable && handleSelectType("annual")}
                accessibilityRole="button"
                accessibilityState={{ selected: passType === "annual", disabled: !annualAvailable }}
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

              <TextInput
                style={styles.qtyInput}
                value={qtyText}
                onChangeText={handleQtyText}
                onBlur={handleQtyBlur}
                keyboardType="phone-pad"
                maxLength={3}
                accessibilityLabel="Quantity, type a number from 1 to 50"
              />

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
            {qtyText.length > 0 && !qtyValid && (
              <Text style={styles.qtyErrorText}>
                Enter a whole number from 1 to {MAX_PER_ORDER}.
              </Text>
            )}

            {/* Pricing Breakdown */}
            {pricingError ? (
              <Text style={styles.pricingErrorText}>
                Couldn&apos;t load pricing. Check your connection and reopen this screen.
              </Text>
            ) : !annualAvailable && passType === "annual" ? (
              <Text style={styles.pricingErrorText}>
                Annual pricing hasn&apos;t been set by the Tourism Office yet.
              </Text>
            ) : (
              <View style={styles.breakdownSection}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Price per pass</Text>
                  <Text style={styles.breakdownValue}>
                    {unitPrice !== null ? `₱${unitPrice.toLocaleString()}` : "…"}
                  </Text>
                </View>
                <View style={[styles.breakdownRow, { marginTop: 12 }]}>
                  <Text style={styles.breakdownLabel}>Quantity</Text>
                  <Text style={styles.breakdownValue}>{quantity}</Text>
                </View>
              </View>
            )}

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
            style={[styles.payBtn, !canProceed && styles.payBtnDisabled]}
            onPress={() => canProceed && handleProceed()}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel="Pay and upload receipt"
            accessibilityState={{ disabled: !canProceed }}
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
    paddingBottom: 110,
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
  toggleBtnDisabled: {
    opacity: 0.45,
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
  qtyInput: {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    padding: 0,
  },
  qtyErrorText: {
    fontSize: 12,
    color: colors.red,
    marginTop: 8,
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
  payBtnDisabled: {
    opacity: 0.5,
  },
  pricingErrorText: {
    fontSize: 13,
    color: colors.red,
    textAlign: "center",
    marginVertical: 12,
    lineHeight: 18,
  },
});
