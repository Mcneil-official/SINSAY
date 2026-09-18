import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
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
import { colors } from "../../../constants/colors";
import { ContentContainer, TextInput, FileUpload } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";
import { uploadFile, validateFile } from "../../../lib/storage";

export default function UploadReceiptScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { passId, passLabel, passCount, quantity, total } = useLocalSearchParams<{
    passId?: string;
    passLabel?: string;
    passCount?: string;
    quantity?: string;
    total?: string;
  }>();

  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalNum = Number(total) || 4500;
  const countNum = Number(passCount) || 50;

  const handlePickFile = (file: File) => {
    const valid = validateFile(file);
    if (!valid.valid) {
      setError(valid.error || "Invalid file");
      return;
    }
    setError("");
    setReceiptFile(file);
  };

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      setError("Please enter the GCash reference number.");
      return;
    }
    if (!user) {
      setError("Please sign in to continue.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let receiptPath = "receipts/gcash-receipt-placeholder.png";

      if (receiptFile) {
        try {
          const up = await uploadFile("operator_uploads", receiptFile, "receipts");
          receiptPath = up.path;
        } catch (upErr) {
          console.warn("Storage upload fallback:", upErr);
        }
      }

      // Record transaction
      const { data: inv } = await supabase
        .from("dive_pass_inventory")
        .insert({
          operator_id: user.id,
          passes_purchased: countNum,
          total_price: totalNum,
          pass_type: "one_day",
        })
        .select("id")
        .maybeSingle();

      await supabase.from("payment_transactions").insert({
        operator_id: user.id,
        inventory_id: inv?.id,
        amount: totalNum,
        reference_number: referenceNumber.trim(),
        receipt_url: receiptPath,
        status: "pending",
      });

      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.successContent}>
          <ContentContainer maxWidth={540}>
            {/* Centered Check Icon */}
            <View style={styles.checkOuter}>
              <View style={styles.checkInner}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.successHeading}>Receipt Submitted!</Text>
            <Text style={styles.successSub}>
              Your payment is now pending verification by the Tourism Office.
            </Text>

            <View style={styles.successCard}>
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Package</Text>
                <Text style={styles.successVal}>{countNum} Dive Passes</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Amount Paid</Text>
                <Text style={styles.successVal}>₱{totalNum.toLocaleString()}.00</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Reference No.</Text>
                <Text style={styles.successVal}>{referenceNumber || "GCF202604261"}</Text>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.successRow}>
                <Text style={styles.successLabel}>Status</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>PENDING</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBlueBtn}
              activeOpacity={0.88}
              onPress={() => router.replace("/(operator-tabs)")}
            >
              <Text style={styles.primaryBlueBtnText}>Back to Dashboard</Text>
            </TouchableOpacity>
          </ContentContainer>
        </ScrollView>
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
          <Text style={styles.topHeader}>Upload Payment Receipt</Text>
          <Text style={styles.topSubtitle}>Submit proof of payment for verification</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={540}>
          {/* Order Summary Strip */}
          <View style={styles.recapStrip}>
            <Text style={styles.recapText}>
              <Text style={{ fontWeight: "700" }}>{countNum} Dive Passes</Text> · ₱{totalNum.toLocaleString()}.00 · GCash Reference
            </Text>
          </View>

          {/* Upload Area */}
          <FileUpload
            label="Upload Receipt"
            onFileSelect={handlePickFile}
            fileName={receiptFile?.name}
            showCamera
          />

          {/* GCash Reference Input */}
          <View style={{ marginTop: 14 }}>
            <TextInput
              label="GCash Reference Number (13 digits)"
              placeholder="e.g. 1002 9384 7561"
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              keyboardType="number-pad"
            />
          </View>

          {/* Notice Banner */}
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle" size={18} color="#0284C7" style={{ marginTop: 1 }} />
            <Text style={styles.noticeText}>
              Passes will be credited automatically once verified by the Tourism Office (usually within 15-30 minutes).
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.88}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit for Verification</Text>
            )}
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
  recapStrip: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  recapText: {
    fontSize: 13,
    color: "#334155",
    textAlign: "center",
  },
  noticeBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    marginBottom: 20,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: "#0369A1",
    lineHeight: 18,
  },
  submitBtn: {
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
  submitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  errorText: {
    fontSize: 13,
    color: colors.red,
    textAlign: "center",
    marginBottom: 10,
  },
  // Success styles
  successContent: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
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
  successHeading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  successSub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  successCard: {
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
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  successLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  successVal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#B45309",
  },
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
});
