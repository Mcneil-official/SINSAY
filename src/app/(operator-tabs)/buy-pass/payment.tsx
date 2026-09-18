import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { ContentContainer } from "../../../components";

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

  const [copied, setCopied] = useState(false);

  const totalNum = Number(total) || 4500;
  const countNum = Number(passCount) || 50;
  const unitNum = Number(unitPrice) || 90;

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              {countNum} Dive Passes (₱{unitNum}/pass · {countNum >= 50 ? "10% Bulk Discount" : "Standard Rate"})
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
                <Ionicons name="qr-code" size={140} color="#005EEC" />
              </View>
            </View>

            <Text style={styles.merchantName}>Mabini Tourism Office</Text>

            <View style={styles.accountRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.accountNumber}>0917 123 4567</Text>
                <Text style={styles.accountOrg}>MABINI TOURISM TREASURY</Text>
              </View>
              <TouchableOpacity
                style={styles.copyBtn}
                activeOpacity={0.8}
                onPress={handleCopy}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={15}
                  color={colors.primaryBlue}
                />
                <Text style={styles.copyBtnText}>{copied ? "Copied" : "Copy"}</Text>
              </TouchableOpacity>
            </View>
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
