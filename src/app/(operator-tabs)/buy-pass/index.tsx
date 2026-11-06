import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import AnimatedKpiValue from "../../../components/AnimatedKpiValue";
import { BuyPassProgress, ContentContainer } from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

const MAX_PER_ORDER = 100;
const PRESET_QUANTITIES = [5, 10, 20, 50, 100];

interface TransactionItem {
  id: string;
  amount: number;
  reference_number: string;
  status: "pending" | "verified" | "rejected";
  created_at: string;
}

function formatTxDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeFormatted = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dateFormatted} • ${timeFormatted}`;
  } catch {
    return dateStr;
  }
}

export default function BuyPassSelectionScreen() {
  const router = useRouter();
  const { user, unreadCount } = useAuth();

  const [quantity, setQuantity] = useState<number>(1);
  const [qtyText, setQtyText] = useState("1");

  // Server-read pricing (pass_pricing.code = 'one_day')
  const [oneDayPrice, setOneDayPrice] = useState<number | null>(null);
  const [pricingError, setPricingError] = useState(false);

  // Live ledger metrics
  const [oneDayLeft, setOneDayLeft] = useState<number | null>(null);
  const [oneDayPurchased, setOneDayPurchased] = useState<number | null>(null);

  // Recent transactions
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: pricing, error: pricingErr } = await supabase
        .from("pass_pricing")
        .select("price, code");
      if (pricingErr) throw pricingErr;
      for (const row of pricing || []) {
        if (row.code === "one_day") setOneDayPrice(Number(row.price));
      }
    } catch (e) {
      console.warn("Could not load pass pricing:", e);
      setPricingError(true);
    }

    try {
      const { data: ledger, error: ledgerErr } = await supabase
        .from("operator_pass_ledger")
        .select("*")
        .eq("operator_id", user.id)
        .maybeSingle();
      if (ledgerErr) throw ledgerErr;
      if (ledger) {
        setOneDayLeft(ledger.remaining_passes ?? 0);
        setOneDayPurchased(ledger.purchased_passes ?? 0);
      } else {
        setOneDayLeft(0);
        setOneDayPurchased(0);
      }
    } catch (e) {
      console.warn("Could not load operator pass ledger:", e);
    }

    try {
      setTxLoading(true);
      const { data: txData, error: txErr } = await supabase
        .from("payment_transactions")
        .select("id, amount, reference_number, status, created_at")
        .eq("operator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (txErr) throw txErr;
      setTransactions((txData as TransactionItem[]) || []);
    } catch (e) {
      console.warn("Could not load transactions:", e);
    } finally {
      setTxLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const unitPrice = oneDayPrice;
  const pricingReady = unitPrice !== null && unitPrice > 0;
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

  const handleDecrease = () => commitQty(quantity - 1);
  const handleIncrease = () => commitQty(quantity + 1);

  const handleQtyText = (v: string) => {
    const digits = v.replace(/[^0-9]/g, "").slice(0, 3);
    setQtyText(digits);
    const n = Number(digits);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_PER_ORDER) {
      setQuantity(n);
    }
  };

  const handleQtyBlur = () => {
    if (!qtyValid) setQtyText(String(quantity));
  };

  
  const handleProceed = () => {
    if (!canProceed) return;
    router.push({
      pathname: "/(operator-tabs)/buy-pass/payment",
      params: {
        passId: "one-day-pass",
        passLabel: "One-Day Dive Pass",
        passCount: String(effectiveQty),
        quantity: String(effectiveQty),
        total: String(total),
        unitPrice: String(unitPrice),
      },
    });
  };

  const peso = "\u20B1";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Ocean Gradient and Wave Background Header */}
      <View style={styles.headerBackgroundWrap} pointerEvents="none">
        <Svg
          width="100%"
          height={240}
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
          <Rect x="0" y="0" width="100%" height={240} fill="url(#screenTopGrad)" />
        </Svg>

        <Svg
          viewBox="0 0 1024 496"
          preserveAspectRatio="none"
          style={styles.headerWaveSvg}
        >
          <Path
            d="M0 296C170 226 320 396 490 258 C700 86 791 90 878 85C951 77 1000 34 1024 0 V496H0Z"
            fill="#FFFFFF"
            opacity={0.16}
          />
        </Svg>
      </View>

      <View style={styles.fixedPassSummary}>
        <ContentContainer maxWidth={480} paddingH={14}>
          {/* Top Atmospheric Header Row */}
          <View style={styles.topHeaderRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.headerCircleBtn}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color="#07156c" />
            </TouchableOpacity>

            <Text style={styles.headerTitleText}>Dive Pass</Text>

            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              hitSlop={10}
              style={styles.headerCircleBtn}
              accessibilityRole="button"
              accessibilityLabel={`Notifications, ${unreadCount} unread`}
            >
              <Ionicons name="notifications" size={18} color="#07156c" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <BuyPassProgress currentStep={1} />

          {/* Pass balance KPI */}
          <View style={styles.summaryCardSingle}>
            <View style={styles.summaryCardTopRow}>
              <View style={styles.labelRow}>
                <View style={styles.kpiIconOneDay}>
                  <Ionicons name="ticket" size={16} color="#006bff" />
                </View>
                <Text style={styles.cardHeaderTitle}>One-Day Dive Pass</Text>
              </View>
              <Text style={styles.subCreditsText}>
                of {oneDayPurchased !== null ? oneDayPurchased : "—"} purchased
              </Text>
            </View>

            <View style={styles.kpiBottomRow}>
              <View style={styles.kpiMetricRow}>
                <AnimatedKpiValue
                  value={oneDayLeft}
                  placeholder="—"
                  style={styles.balanceNumberLarge}
                />
                <Text style={styles.kpiMetricLabel}>credits left</Text>
              </View>

              {/* Sparkline chart directly under "of X purchased" */}
              <View style={styles.kpiChartWrap}>
                <Svg
                  width={72}
                  height={32}
                  viewBox="0 0 145 80"
                  pointerEvents="none"
                >
                  <Defs>
                    <LinearGradient id="kpiSparkFill" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#38bdf8" stopOpacity={0.55} />
                      <Stop offset="1" stopColor="#0065fa" stopOpacity={0.05} />
                    </LinearGradient>
                  </Defs>
                  <Path
                    d="M0 60 H20 L35 48 L50 52 L68 34 L92 42 L116 16 L138 8 V80 H0 Z"
                    fill="url(#kpiSparkFill)"
                  />
                  <Path
                    d="M0 60 H20 L35 48 L50 52 L68 34 L92 42 L116 16 L138 8"
                    fill="none"
                    stroke="#006bff"
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Circle
                    cx={138}
                    cy={8}
                    r={5}
                    fill="#0065fa"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                </Svg>
              </View>
            </View>
          </View>
        </ContentContainer>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={480} paddingH={14}>
          {/* Main Purchase Card */}
          <View style={styles.purchaseCard}>
            <View style={styles.sectionHeaderTitleRow}>
              <View style={styles.cartIconBubble}>
                <Ionicons name="cart" size={18} color="#006bff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.purchaseHeading}>
                  Purchase Dive Pass Credits
                </Text>
                <Text style={styles.purchaseSubtitle}>
                  Choose a pass, set quantity, then review
                </Text>
              </View>
            </View>

            {/* One-Day Pass Info Banner */}
            <View style={styles.passInfoBanner}>
              <View style={styles.passInfoIcon}>
                <Ionicons name="ticket" size={20} color="#006bff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passInfoTitle}>One-Day Dive Pass</Text>
                <Text style={styles.passInfoPrice}>
                  {oneDayPrice !== null ? `${peso}${oneDayPrice.toLocaleString()} per pass` : "Official municipal rate"}
                </Text>
              </View>
            </View>

            <View style={styles.stageHeading}>
              <Text style={styles.stageNumber}>01</Text>
              <Text style={styles.stageTitle}>Quantity</Text>
            </View>

            {/* Stepper Quantity Controller */}
            <View style={styles.quantitySection}>
              <Text style={styles.quantityCaption}>How many passes?</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.stepBtnMinus}
                  onPress={handleDecrease}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                >
                  <Ionicons name="remove" size={24} color="#006bff" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={qtyText}
                  onChangeText={handleQtyText}
                  onBlur={handleQtyBlur}
                  keyboardType="phone-pad"
                  maxLength={3}
                  accessibilityLabel="Quantity, type a number from 1 to 100"
                />

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.stepBtnPlus}
                  onPress={handleIncrease}
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                >
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Quick Bulk Preset Chips */}
              <View style={styles.presetsRow}>
                {PRESET_QUANTITIES.map((val) => {
                  const isSelected = effectiveQty === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.presetChip,
                        isSelected && styles.presetChipActive,
                      ]}
                      onPress={() => commitQty(val)}
                      accessibilityRole="button"
                      accessibilityLabel={`Set quantity to ${val}`}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          isSelected && styles.presetChipTextActive,
                        ]}
                      >
                        {val === MAX_PER_ORDER ? `${MAX_PER_ORDER} Max` : `+${val}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {qtyText.length > 0 && !qtyValid && (
              <Text style={styles.errorText}>
                Enter a whole number from 1 to {MAX_PER_ORDER}.
              </Text>
            )}

            {pricingError && (
              <Text style={styles.errorText}>
                Couldn&apos;t load pricing. Check your connection.
              </Text>
            )}

            <View style={styles.stageHeading}>
              <Text style={styles.stageNumber}>02</Text>
              <Text style={styles.stageTitle}>Order Summary</Text>
            </View>

            {/* Itemized Calculation Breakdown */}
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownPlanRow}>
                <View style={styles.breakdownPlanIcon}>
                  <Ionicons name="ticket-outline" size={16} color="#006bff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.breakdownPlanTitle}>One-Day Dive Pass</Text>
                  <Text style={styles.breakdownPlanHint}>Ready for review</Text>
                </View>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Price per pass</Text>
                <Text style={styles.breakdownValue}>
                  {unitPrice !== null ? `${peso}${unitPrice.toLocaleString()}` : "—"}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Selected Quantity</Text>
                <Text style={styles.breakdownValue}>{effectiveQty} passes</Text>
              </View>
            </View>

            {/* Total Row (Distinct vertical row) */}
            <View style={styles.totalRow}>
              <Text style={styles.totalSubLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.totalPrice}>{peso}{total.toLocaleString()}</Text>
            </View>

            {/* Dedicated Full-Width Proceed to Pay CTA */}
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.primaryProceedBtn,
                !canProceed && styles.primaryProceedBtnDisabled,
              ]}
              onPress={() => canProceed && handleProceed()}
              disabled={!canProceed}
              accessibilityRole="button"
              accessibilityLabel="Proceed to pay"
            >
              <Ionicons name="card" size={18} color="#FFFFFF" />
              <Text style={styles.primaryProceedBtnText}>Proceed to Pay</Text>
              <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Recent Transactions Section */}
          <View style={styles.transactionsHeaderRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="time" size={16} color="#006bff" />
              <Text style={styles.transactionsTitle}>Recent Transactions</Text>
            </View>
            <TouchableOpacity
              onPress={() => {}}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="See all transactions"
            >
              <Text style={styles.seeAllText}>See all ›</Text>
            </TouchableOpacity>
          </View>

          {txLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primaryBlue}
              style={{ marginVertical: 14 }}
            />
          ) : transactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {transactions.map((tx) => {
                const isVerified = tx.status === "verified";
                const isUnderReview = tx.status === "pending";

                return (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={styles.txIconBubble}>
                      <Ionicons name="ticket" size={17} color="#006bff" />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txPlanName} numberOfLines={1}>
                        Dive Pass Credits
                      </Text>
                      <Text style={styles.txDate} numberOfLines={1}>
                        {formatTxDate(tx.created_at)}
                      </Text>
                      {tx.reference_number ? (
                        <Text style={styles.txRefText} numberOfLines={1}>
                          Ref: {tx.reference_number}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.txEndCol}>
                      <View
                        style={[
                          styles.statusPill,
                          isVerified
                            ? styles.statusPillApproved
                            : isUnderReview
                              ? styles.statusPillReview
                              : styles.statusPillRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isVerified
                              ? styles.statusTextApproved
                              : isUnderReview
                                ? styles.statusTextReview
                                : styles.statusTextRejected,
                          ]}
                        >
                          {isVerified
                            ? "Approved"
                            : isUnderReview
                              ? "Under Review"
                              : "Rejected"}
                        </Text>
                      </View>
                      <Text style={styles.txAmount}>
                        ₱{tx.amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={26} color="#94A3B8" />
              <Text style={styles.emptyText}>No transactions recorded yet.</Text>
            </View>
          )}
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f1f9ff",
  },
  headerBackgroundWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    overflow: "hidden",
    zIndex: -1,
  },
  headerWaveSvg: {
    position: "absolute",
    top: 10,
    left: 0,
    width: "100%",
    height: 190,
  },
  container: {
    flex: 1,
    minHeight: 0,
  },
  fixedPassSummary: {
    flexShrink: 0,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 76,
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    marginBottom: 14,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitleText: {
    fontSize: 21,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ff404b",
    borderWidth: 1.2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  notificationBadgeText: {
    fontSize: 7.5,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  summaryCardSingle: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.28)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    shadowColor: "#4089dc",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 6,
  },
  summaryCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceNumberLarge: {
    fontSize: 28,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    lineHeight: 32,
  },
  summaryCardFull: {
    flex: 1,
    minWidth: "100%",
  },
  passInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0F7FF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CCE3FF",
    padding: 12,
    marginBottom: 16,
  },
  passInfoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  passInfoTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0F2E6B",
  },
  passInfoPrice: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.28)",
    padding: 11,
    shadowColor: "#4089dc",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  kpiIconOneDay: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: "#e8f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiBottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 2,
  },
  kpiChartWrap: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  kpiMetricRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },
  kpiMetricLabel: {
    flexShrink: 1,
    fontSize: 9.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#5368b1",
  },
  summaryCardLeft: {
    flex: 1.35,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 11,
    shadowColor: "#4089dc",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  summaryCardRight: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 11,
    shadowColor: "#4089dc",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    flex: 1,
  },
  creditContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceNumber: {
    fontSize: 32,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    lineHeight: 36,
  },
  subCreditsText: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    marginTop: 1,
  },
  ringSvg: {
    width: 52,
    height: 52,
    flexShrink: 0,
  },
  emeraldCheckBubble: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: "#129b83",
    alignItems: "center",
    justifyContent: "center",
  },
  emeraldHeaderTitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#078c77",
    flex: 1,
  },
  activeCountRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },
  activeBigCount: {
    fontSize: 28,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
    lineHeight: 32,
  },
  validityText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    marginTop: 3,
  },
  purchaseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#4089dc",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  cartIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d7ebff",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseHeading: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  purchaseSubtitle: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    marginTop: 1,
  },
  stageHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  stageNumber: {
    minWidth: 25,
    height: 22,
    borderRadius: 8,
    overflow: "hidden",
    textAlign: "center",
    textAlignVertical: "center",
    paddingTop: 3,
    backgroundColor: "#e8f3ff",
    color: "#006bff",
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
  },
  stageTitle: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  passOptionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    maxWidth: "100%",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8e6ff",
    backgroundColor: "#f4f9ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  tabButtonSelected: {
    borderColor: "#006bff",
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabButtonText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#07156c",
    flexShrink: 1,
  },
  tabButtonTextSelected: {
    color: "#FFFFFF",
    fontFamily: "Quicksand_700Bold",
  },
  tabSubText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    marginTop: 1,
  },
  tabSubTextSelected: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  quantitySection: {
    backgroundColor: "#f8fbff",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e4eeff",
    marginBottom: 10,
  },
  quantityCaption: {
    textAlign: "center",
    marginBottom: 8,
    fontSize: 10.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#5368b1",
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  stepBtnMinus: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: "#3697ff",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    width: 88,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d8e6ff",
    backgroundColor: "#FFFFFF",
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  stepBtnPlus: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#006bff",
    alignItems: "center",
    justifyContent: "center",
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
    rowGap: 6,
  },
  presetChip: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#d8e6ff",
  },
  presetChipActive: {
    backgroundColor: "#006bff",
    borderColor: "#006bff",
  },
  presetChipText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#07156c",
  },
  presetChipTextActive: {
    color: "#FFFFFF",
    fontFamily: "Quicksand_700Bold",
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#b6223a",
    textAlign: "center",
    marginVertical: 4,
  },
  breakdownCard: {
    backgroundColor: "#f1f7fe",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 4,
  },
  breakdownPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingBottom: 8,
    marginBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#dfeaff",
  },
  breakdownPlanIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  breakdownPlanTitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  breakdownPlanHint: {
    fontSize: 9.5,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  breakdownValue: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e1eaff",
    paddingTop: 10,
    marginBottom: 12,
  },
  totalSubLabel: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#6382cf",
    letterSpacing: 0.5,
  },
  totalPrice: {
    fontSize: 24,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  primaryProceedBtn: {
    width: "100%",
    height: 52,
    borderRadius: 18,
    backgroundColor: "#0065fa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
    shadowColor: "#0065fa",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  primaryProceedBtnDisabled: {
    opacity: 0.45,
    backgroundColor: "#7baeff",
  },
  primaryProceedBtnText: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  transactionsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  transactionsTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  seeAllText: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
  transactionsList: {
    gap: 6,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.22)",
    gap: 10,
    shadowColor: "#4089dc",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  txIconBubble: {
    width: 36,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#e7f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: {
    flex: 1,
    minWidth: 0,
  },
  txPlanName: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginBottom: 1,
  },
  txDate: {
    fontSize: 9,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  txRefText: {
    fontSize: 8.5,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
    marginTop: 1,
  },
  txEndCol: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 2,
  },
  statusPillApproved: {
    backgroundColor: "#cdf3e0",
  },
  statusPillReview: {
    backgroundColor: "#d2e8ff",
  },
  statusPillRejected: {
    backgroundColor: "#fee2e2",
  },
  statusPillText: {
    fontSize: 8,
    fontFamily: "Quicksand_700Bold",
  },
  statusTextApproved: {
    color: "#007c6e",
  },
  statusTextReview: {
    color: "#0058f5",
  },
  statusTextRejected: {
    color: "#dc2626",
  },
  txAmount: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
});
