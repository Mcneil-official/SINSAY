import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, Card, TextInput, FileUpload } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";
import { uploadFile, validateFile } from "../../../lib/storage";

export default function UploadReceiptScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { passLabel, passCount, quantity, total } = useLocalSearchParams<{
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

  const totalNum = Number(total) || 0;
  const totalPasses = (Number(quantity) || 1) * (Number(passCount) || 1);
  const canSubmit = referenceNumber.length >= 6 && receiptFile !== null && !saving;

  const handlePickFile = (file: File | { name: string; mimeType?: string; size?: number; uri: string }) => {
    const validationError = validateFile(file as File);
    if (validationError) {
      setError(validationError);
      return;
    }
    setReceiptFile(file as File);
    setError("");
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user || !receiptFile) return;
    setSaving(true);
    setError("");

    try {
      // 1. Upload receipt to storage
      const { path: receiptPath, error: uploadError } = await uploadFile(
        "operator_uploads", "receipts", receiptFile, user.id
      );

      if (uploadError || !receiptPath) {
        setError(uploadError || "Upload failed. Please try again.");
        setSaving(false);
        return;
      }

      // 2. Create dive pass inventory
      const { data: inventory, error: invError } = await supabase
        .from("dive_pass_inventory")
        .insert({
          operator_id: user.id,
          pass_type: "single",
          pass_label: passLabel || "",
          total_passes: totalPasses,
          remaining_passes: totalPasses,
          amount: totalNum,
        })
        .select("id")
        .single();

      if (invError || !inventory) {
        setError("Failed to create inventory record.");
        setSaving(false);
        return;
      }

      // 3. Create payment transaction
      const { error: txError } = await supabase
        .from("payment_transactions")
        .insert({
          operator_id: user.id,
          dive_pass_inventory_id: inventory.id,
          amount: totalNum,
          reference_number: referenceNumber.trim(),
          receipt_url: receiptPath,
          status: "pending",
        });

      if (txError) {
        setError("Failed to save payment record.");
        setSaving(false);
        return;
      }

      setSubmitted(true);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!user) {
      router.replace("/loginpage");
    }
  }, [user, router]);

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
          </View>
          <Text style={styles.heading}>Receipt Submitted</Text>
          <Text style={styles.subtext}>
            Your payment is now pending verification.{"\n"}You will be notified once confirmed.
          </Text>
          <Card style={styles.infoCard}>
            <Ionicons name="information-circle" size={18} color={colors.primaryBlue} />
            <Text style={styles.infoText}>
              Verification typically takes 15-30 minutes during business hours.
            </Text>
          </Card>
          <View style={{ gap: 10, marginTop: 20 }}>
            <Button title="Back to Dashboard" onPress={() => router.replace("/(operator-tabs)")} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Upload Receipt</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        {/* Progress steps */}
        <View style={styles.progressRow}>
          <View style={styles.progressStepWrap}>
            <View style={styles.progressDotDone}>
              <Ionicons name="checkmark" size={8} color={colors.white} />
            </View>
            <Text style={styles.progressTextDone}>Payment</Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={styles.progressStepWrap}>
            <View style={styles.progressDotActive} />
            <Text style={styles.progressTextActive}>Upload Receipt</Text>
          </View>
        </View>

        {/* Amount recap */}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>₱ {totalNum.toLocaleString()}</Text>
          <Text style={styles.amountDetail}>
            {passLabel} · Qty: {quantity} ({totalPasses} total passes)
          </Text>
        </Card>

        {/* File upload */}
        <FileUpload
          label="Upload Payment Screenshot"
          onFileSelect={handlePickFile}
          fileName={receiptFile?.name}
          showCamera
        />

        {/* Reference Number */}
        <View style={{ marginTop: 8 }}>
          <TextInput
            label="GCash Reference No."
            placeholder="e.g. GCF202606150001"
            value={referenceNumber}
            onChangeText={setReferenceNumber}
          />
        </View>
        <Text style={styles.hint}>
          Enter the reference number from your GCash, Maya, or bank transfer confirmation.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title={saving ? "Submitting..." : "Submit for Verification"}
          onPress={handleSubmit}
          disabled={!canSubmit}
        />

        <View style={{ height: 60 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24, gap: 0 },
  progressStepWrap: { alignItems: "center", gap: 4 },
  progressDotDone: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#16A34A", alignItems: "center", justifyContent: "center" },
  progressDotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryBlue },
  progressTextDone: { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  progressTextActive: { fontSize: 11, fontWeight: "600", color: colors.primaryBlue },
  progressLine: { width: 48, height: 2, backgroundColor: colors.grayLight, marginHorizontal: 8, marginBottom: 18 },
  progressLineActive: { backgroundColor: colors.primaryBlue },
  amountCard: { padding: 16, alignItems: "center", marginBottom: 20 },
  amountLabel: { fontSize: 13, color: colors.gray },
  amountValue: { fontSize: 28, fontWeight: "700", color: colors.primaryBlue, marginTop: 4 },
  amountDetail: { fontSize: 11, color: colors.gray, marginTop: 6 },
  hint: { fontSize: 11, color: colors.gray, marginTop: 6, marginBottom: 24 },
  checkWrap: { alignItems: "center", marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.darkText, textAlign: "center" },
  subtext: { fontSize: 13, color: colors.gray, textAlign: "center", lineHeight: 20, marginTop: 6 },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, marginTop: 20, backgroundColor: "#EBF2FF" },
  infoText: { flex: 1, fontSize: 12, color: colors.darkText, lineHeight: 18 },
  uploadChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: colors.cardBorder, borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: colors.cardBg, marginBottom: 16,
  },
  uploadChipText: { fontSize: 13, color: colors.primaryBlue, fontWeight: "500", flex: 1 },
  errorText: { fontSize: 13, color: colors.red, textAlign: "center", marginBottom: 12 },
});
