import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { BuyPassProgress, ContentContainer, GCashLogo } from "../../../components";
import { colors } from "../../../constants/colors";
import { useToast } from "../../../context/ToastContext";
import { supabase } from "../../../lib/supabase";

export default function PaymentScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { passId, passLabel, passCount, quantity, total, unitPrice } =
    useLocalSearchParams<{
      passId?: string;
      passLabel?: string;
      passCount?: string;
      quantity?: string;
      total?: string;
      unitPrice?: string;
    }>();

  const [config, setConfig] = useState<{
    account_name: string;
    account_number: string;
    qr_code_url: string | null;
  } | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("payment_config")
          .select("account_name, account_number, qr_code_url")
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (data) setConfig(data);
      } catch (e) {
        console.warn("Failed to load payment config:", e);
      } finally {
        setConfigLoading(false);
      }
    })();
  }, []);

  const totalNum = Number(total) || 0;
  const qtyNum = Number(quantity) || 1;
  const unitNum = Number(unitPrice) || 0;
  const passTypeLabel =
    passId === "annual-pass"
      ? "Annual Dive Pass"
      : passLabel || "One-Day Dive Pass";

  const handleCopy = async () => {
    const textToCopy = config?.account_number || "";
    if (!textToCopy) return;
    try {
      await Clipboard.setStringAsync(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      showToast("GCash account number copied.", { tone: "success" });
    } catch (e) {
      console.warn("Failed to copy GCash account number:", e);
      showToast("Couldn't copy the account number. Please try again.", {
        tone: "error",
      });
    }
  };

  const handleProceedUpload = () => {
    router.push({
      pathname: "/(operator-tabs)/buy-pass/upload",
      params: {
        passId,
        passLabel: passTypeLabel,
        passCount,
        quantity: String(qtyNum),
        total: String(totalNum),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Top Ocean Gradient and Wave Background Header */}
      <View style={styles.headerBackgroundWrap} pointerEvents="none">
        <Svg
          width="100%"
          height={220}
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
          <Rect x="0" y="0" width="100%" height={220} fill="url(#screenTopGrad)" />
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

            <View style={styles.headerCenterCol}>
              <Text style={styles.headerTitleText}>Checkout</Text>
              <Text style={styles.headerSubtitleText}>
                Complete payment via GCash
              </Text>
            </View>

            <View style={{ width: 36 }} />
          </View>

          <BuyPassProgress currentStep={2} />

          {/* Selected Pass Order Summary Card */}
          <View style={styles.selectedPassCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.passIconBubble}>
                <Ionicons name="ticket" size={17} color="#006bff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.passCardBadge}>ORDER SUMMARY</Text>
                <Text style={styles.planNameTitle}>{passTypeLabel}</Text>
              </View>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>{qtyNum} passes</Text>
              </View>
            </View>

            <View style={styles.orderBreakdownRow}>
              <Text style={styles.orderBreakdownLabel}>
                {unitNum > 0 ? `₱${unitNum.toLocaleString()} × ${qtyNum} passes` : "Package total"}
              </Text>
              <Text style={styles.checkoutPrice}>
                ₱{totalNum.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment Card (Pay via GCash) */}
          <View style={styles.paymentCard}>
            <View style={styles.gcashHeaderRow}>
              <View style={styles.gcashLogoContainer}>
                <GCashLogo size={32} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gcashTitle}>Pay via GCash</Text>
                <Text style={styles.merchantBadge}>MABINI TOURISM OFFICIAL MERCHANT</Text>
              </View>
            </View>

            {/* Payment guidance and purchase progress */}
            <View style={styles.stepGuidanceRow}>
              {[
                "Scan QR / Pay",
                "Save Receipt",
                "Upload & Review",
              ].map((label, index) => (
                <View key={label} style={styles.miniStepItem}>
                  <View style={styles.miniStepNum}>
                    <Text style={styles.miniStepNumText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.miniStepText}>{label}</Text>
                </View>
              ))}
            </View>

            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              {configLoading ? (
                <ActivityIndicator size="small" color={colors.primaryBlue} />
              ) : config?.qr_code_url ? (
                <Image
                  source={{ uri: config.qr_code_url }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={48} color="#006bff" />
                  <Text style={styles.qrPlaceholderText}>
                    Merchant QR Code{"\n"}Scan with GCash
                  </Text>
                </View>
              )}
            </View>

            {/* Reference / Account Number Block */}
            <View style={styles.referenceSection}>
              <View style={styles.referenceHeaderRow}>
                <Text style={styles.referenceLabel}>
                  {config?.account_name
                    ? `${config.account_name}`
                    : "Account Name / Number"}
                </Text>
                <TouchableOpacity
                  onPress={handleCopy}
                  hitSlop={8}
                  style={styles.copyBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Copy account number"
                >
                  <Ionicons
                    name={copied ? "checkmark-done" : "copy-outline"}
                    size={15}
                    color={copied ? "#129b83" : "#006bff"}
                  />
                  <Text
                    style={[
                      styles.copyBtnText,
                      copied && { color: "#129b83" },
                    ]}
                  >
                    {copied ? "Copied!" : "Tap to copy"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.referenceBox}>
                <Text style={styles.referenceValue}>
                  {config?.account_number || "GCASH-SINSAY-PAY"}
                </Text>
              </View>
            </View>
          </View>

          {/* Notice Alert Banner */}
          <View style={styles.noticeCard}>
            <Ionicons name="shield-checkmark" size={18} color="#003cda" />
            <Text style={styles.noticeText}>
              Transactions are verified by the Tourism Office within 24 hours. Keep your receipt screenshot handy.
            </Text>
          </View>

          {/* Proceed to Upload Receipt Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.uploadCtaBtn}
            onPress={handleProceedUpload}
            accessibilityRole="button"
            accessibilityLabel="Proceed to upload receipt"
          >
            <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
            <Text style={styles.uploadCtaBtnText}>Proceed to Upload Receipt</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
          </TouchableOpacity>
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
    height: 220,
    overflow: "hidden",
    zIndex: -1,
  },
  headerWaveSvg: {
    position: "absolute",
    top: 10,
    left: 0,
    width: "100%",
    height: 180,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 0,
    marginBottom: 16,
  },
  headerCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerCenterCol: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleText: {
    fontSize: 20,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 1,
  },
  selectedPassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#4089dc",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  passIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#d7ebff",
    alignItems: "center",
    justifyContent: "center",
  },
  passCardBadge: {
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    color: "#6382cf",
    letterSpacing: 0.5,
  },
  planNameTitle: {
    fontSize: 16.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginTop: 1,
  },
  qtyBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  qtyBadgeText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  orderBreakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e4eeff",
    paddingTop: 10,
  },
  orderBreakdownLabel: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  checkoutPrice: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  paymentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#4089dc",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  gcashHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  gcashLogoContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  gcashBubbleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    fontFamily: "sans-serif",
  },
  gcashTitle: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  merchantBadge: {
    fontSize: 8.5,
    fontFamily: "Quicksand_700Bold",
    color: "#00bc88",
    letterSpacing: 0.3,
  },
  stepGuidanceRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    backgroundColor: "#f4f8fe",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 9,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e4eeff",
  },
  miniStepItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 2,
  },
  miniStepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#006bff",
    alignItems: "center",
    justifyContent: "center",
  },
  miniStepNumText: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  miniStepText: {
    width: "100%",
    textAlign: "center",
    fontSize: 9,
    lineHeight: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#07156c",
  },
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  qrImage: {
    width: 170,
    height: 170,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cfe5ff",
    backgroundColor: "#e7f3ff",
  },
  qrPlaceholder: {
    width: 170,
    height: 154,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#cfe5ff",
    backgroundColor: "#e7f3ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 6,
  },
  qrPlaceholderText: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    textAlign: "center",
  },
  referenceSection: {
    marginTop: 2,
  },
  referenceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  referenceLabel: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    flex: 1,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#e7f3ff",
  },
  copyBtnText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
  referenceBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1e0ff",
    backgroundColor: "#f2f7ff",
  },
  referenceValue: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#e9f4ff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#cfe5ff",
  },
  noticeText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#07156c",
    flex: 1,
    lineHeight: 16,
  },
  uploadCtaBtn: {
    height: 48,
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
  uploadCtaBtnText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
});
