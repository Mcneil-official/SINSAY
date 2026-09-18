import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
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
import { supabase } from "../../../lib/supabase";

export default function PaymentScreen() {
  const router = useRouter();
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

  // No magic fallbacks: without a real order this screen is meaningless.
  const totalNum = Number(total) || 0;
  const countNum = Number(passCount) || 0;
  const unitNum = Number(unitPrice) || 0;
  const passTypeLabel = passId === "annual-pass" ? "Annual Dive Pass" : passLabel || "One-Day Dive Pass";
  const hasOrder =
    (passId === "one-day-pass" || passId === "annual-pass") &&
    Number.isInteger(countNum) &&
    countNum >= 1 &&
    countNum <= 50 &&
    totalNum > 0;

  if (!hasOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.topTitles}>
            <Text style={styles.topHeader}>GCash Payment</Text>
          </View>
        </View>
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>No order found</Text>
          <Text style={styles.centerSub}>Please select a dive pass first.</Text>
          <TouchableOpacity style={styles.uploadBtn} activeOpacity={0.88} onPress={() => router.back()}>
            <Text style={styles.uploadBtnText}>Back to Passes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.topTitles}>
          <Text style={styles.topHeader}>GCash Payment</Text>
          <Text style={styles.topSubtitle}>Scan QR or send to the details below</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={540}>
          {/* Amount to Pay Box */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountTotal}>₱{totalNum.toLocaleString()}.00</Text>
            <Text style={styles.amountDetail}>
              {countNum} × {passTypeLabel} (₱{unitNum.toLocaleString()}/pass)
            </Text>
          </View>

          {/* GCash QR Card */}
          <View style={styles.qrCard}>
            <View style={styles.gcashPill}>
              <Text style={styles.gcashPillText}>GCash</Text>
            </View>

            {/* Styled QR Code Box with framing corners */}
            <View style={styles.qrContainer}>
              <View style={styles.qrCornerTL} />
              <View style={styles.qrCornerTR} />
              <View style={styles.qrCornerBL} />
              <View style={styles.qrCornerBR} />

              <View style={styles.qrInner}>
                {config?.qr_code_url && config.qr_code_url.startsWith("http") ? (
                  <Image
                    source={{ uri: config.qr_code_url }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="qr-code" size={140} color="#005EEC" />
                )}
              </View>
            </View>

            <Text style={styles.merchantName}>
              {config?.account_name || "Mabini Tourism Office"}
            </Text>

            <View style={styles.accountRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountNumber}>
                  {configLoading ? "Loading…" : config?.account_number || "Not yet configured"}
                </Text>
                <Text style={styles.accountOrg}>
                  {(config?.account_name || "MABINI TOURISM TREASURY").toUpperCase()}
                </Text>
              </View>
            </View>
            {!configLoading && !config && (
              <Text style={styles.configNote}>
                Payment details aren&apos;t configured yet. Please contact the Tourism Office directly.
              </Text>
            )}
          </View>

          {/* Step Instructions */}
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Payment Instructions</Text>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                Open GCash and scan the QR code above or send via Express Send
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                Pay the exact amount of <Text style={{ fontWeight: "700" }}>₱{totalNum.toLocaleString()}.00</Text>
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Save or take a screenshot of your transaction receipt
              </Text>
            </View>

            <View style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>4</Text>
              </View>
              <Text style={styles.stepText}>
                Click &quot;Upload Receipt&quot; below to submit proof of payment
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.uploadBtn}
            activeOpacity={0.88}
            onPress={() =>
              router.push({
                pathname: "/(operator-tabs)/buy-pass/upload",
                params: { passId, passLabel, passCount, quantity, total, unitPrice },
              })
            }
          >
            <Text style={styles.uploadBtnText}>I Have Paid — Upload Receipt →</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 24, paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { paddingRight: 8 },
  topTitles: { flex: 1 },
  topHeader: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  topSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  amountBox: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  amountTotal: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 4,
  },
  amountDetail: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563EB",
  },
  qrCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  gcashPill: {
    backgroundColor: "#007DFE",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 100,
    marginBottom: 16,
  },
  gcashPillText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  qrContainer: {
    width: 180,
    height: 180,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  qrCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#007DFE",
    borderTopLeftRadius: 6,
  },
  qrCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#007DFE",
    borderTopRightRadius: 6,
  },
  qrCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#007DFE",
    borderBottomLeftRadius: 6,
  },
  qrCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#007DFE",
    borderBottomRightRadius: 6,
  },
  qrInner: {
    width: 154,
    height: 154,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
  },
  configNote: {
    fontSize: 12,
    color: "#B45309",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 17,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  centerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  centerSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  accountNumber: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  accountOrg: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  stepsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
    marginBottom: 20,
    gap: 12,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  uploadBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 24,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
