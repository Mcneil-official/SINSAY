import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  Button,
  Card,
  ContentContainer,
  FileUpload,
  StepProgress,
  TextInput,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { uploadFile, validateFile } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";

export default function UploadReceiptScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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
  // Server-truth pricing: route params are display hints only and must never
  // be trusted for the DB insert (deep-links can be tampered with).
  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [passesPerPack, setPassesPerPack] = useState<number | null>(null);
  const [passCode, setPassCode] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);

  useEffect(() => {
    if (!passId) {
      setPriceLoading(false);
      setPriceError(true);
      return;
    }
    (async () => {
      try {
        const { data, error: priceFetchError } = await supabase
          .from("pass_pricing")
          .select("price, passes, code")
          .eq("id", passId)
          .maybeSingle();
        if (priceFetchError) throw priceFetchError;
        if (!data) {
          setPriceError(true);
          return;
        }
        setUnitPrice(Number(data.price));
        setPassesPerPack(Number(data.passes));
        setPassCode((data as { code?: string }).code ?? null);
      } catch (e) {
        console.warn("Failed to verify pass pricing:", e);
        setPriceError(true);
      } finally {
        setPriceLoading(false);
      }
    })();
  }, [passId]);

  const qty = Math.max(1, Number(quantity) || 1);
  // Unit-priced rows (passes = 1: one-day / annual) sell a custom count that
  // arrives in the passCount param; pack rows (passes > 1) multiply by qty.
  // Server clamps the same 1–50 bounds the selection screen enforces.
  const rawCustomCount = Number(passCount) || 0;
  const customCountValid =
    Number.isInteger(rawCustomCount) && rawCustomCount >= 1 && rawCustomCount <= 50;
  const isUnitRow = passesPerPack === 1;
  const verifiedPasses =
    passesPerPack !== null
      ? isUnitRow
        ? rawCustomCount
        : passesPerPack * qty
      : (Number(quantity) || 1) * (Number(passCount) || 1);
  const verifiedTotal =
    unitPrice !== null
      ? unitPrice * (isUnitRow ? rawCustomCount : qty)
      : Number(total) || 0;
  const verifiedPassType =
    passCode === "annual"
      ? "annual"
      : passesPerPack !== null && passesPerPack > 1
        ? "multi"
        : "single";
  const pricingReady =
    !priceLoading &&
    !priceError &&
    unitPrice !== null &&
    passesPerPack !== null &&
    verifiedTotal > 0 &&
    (!isUnitRow || customCountValid);
  const canSubmit =
    referenceNumber.trim().length >= 6 && receiptFile !== null && !saving && pricingReady;

  const handlePickFile = (
    file:
      | File
      | { name: string; mimeType?: string; size?: number; uri: string },
  ) => {
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

    let receiptPath: string | null = null;
    let inventoryId: string | null = null;
    try {
      // 1. Upload receipt to storage
      const { path: uploadedPath, error: uploadError } = await uploadFile(
        "operator_uploads",
        "receipts",
        receiptFile,
        user.id,
      );

      if (uploadError || !uploadedPath) {
        setError(uploadError || "Upload failed. Please try again.");
        setSaving(false);
        return;
      }
      receiptPath = uploadedPath;

      // 2. Create dive pass inventory (server-verified amounts only)
      const { data: inventory, error: invError } = await supabase
        .from("dive_pass_inventory")
        .insert({
          operator_id: user.id,
          pass_type: verifiedPassType,
          pass_label: passLabel || "",
          total_passes: verifiedPasses,
          remaining_passes: verifiedPasses,
          amount: verifiedTotal,
        })
        .select("id")
        .single();

      if (invError || !inventory) {
        await supabase.storage.from("operator_uploads").remove([receiptPath]);
        setError(invError ? `Failed to create inventory record: ${invError.message}` : "Failed to create inventory record.");
        setSaving(false);
        return;
      }
      inventoryId = inventory.id;

      // 3. Create payment transaction
      const { error: txError } = await supabase
        .from("payment_transactions")
        .insert({
          operator_id: user.id,
          dive_pass_inventory_id: inventory.id,
          amount: verifiedTotal,
          reference_number: referenceNumber.trim(),
          receipt_url: receiptPath,
          status: "pending",
        });

      if (txError) {
        // Roll back the partial write: inventory row + storage object.
        await supabase.from("dive_pass_inventory").delete().eq("id", inventory.id);
        await supabase.storage.from("operator_uploads").remove([receiptPath]);
        setError(`Failed to save payment record: ${txError.message}`);
        setSaving(false);
        return;
      }

      setSubmitted(true);
    } catch (e) {
      console.error("Receipt submit failed:", e);
      // Best-effort rollback of anything created before the throw.
      if (inventoryId) {
        await supabase.from("dive_pass_inventory").delete().eq("id", inventoryId);
      }
      if (receiptPath) {
        await supabase.storage.from("operator_uploads").remove([receiptPath]);
      }
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/loginpage");
    }
  }, [authLoading, user, router]);

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
          <ContentContainer maxWidth={720}>
            <View style={styles.checkWrap}>
              <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
            </View>
            <Text style={styles.heading}>Receipt Submitted</Text>
            <Text style={styles.subtext}>
              Your payment is now pending verification.{"\n"}You will be notified
              once confirmed.
            </Text>
            <Card style={styles.infoCard}>
              <Ionicons
                name="information-circle"
                size={18}
                color={colors.primaryBlue}
              />
              <Text style={styles.infoText}>
                Verification typically takes 15-30 minutes during business hours.
              </Text>
            </Card>
            <View style={{ gap: 10, marginTop: 20 }}>
              <Button
                title="Back to Dashboard"
                onPress={() => router.replace("/(operator-tabs)")}
              />
            </View>
            <View style={{ height: 110 }} />
          </ContentContainer>
        </ScrollView>
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

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ContentContainer maxWidth={720}>
        {/* Progress steps */}
        <StepProgress steps={["Payment", "Upload Receipt"]} currentIndex={1} />

        {/* Amount recap (server-verified once pricing loads) */}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amountValue}>₱ {verifiedTotal.toLocaleString()}</Text>
          <Text style={styles.amountDetail}>
            {passLabel} · Qty: {qty} ({verifiedPasses} total passes)
          </Text>
        </Card>

        {priceLoading && (
          <Text style={styles.verifyText}>Verifying pricing…</Text>
        )}
        {priceError && (
          <Text style={styles.errorText}>
            Couldn&apos;t verify pricing for this pass. Please go back and reselect it.
          </Text>
        )}

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
            label="Payment Reference No."
            placeholder="e.g. GCF202606150001"
            value={referenceNumber}
            onChangeText={setReferenceNumber}
          />
        </View>
        <Text style={styles.hint}>
          Enter the reference number from your GCash, Maya, or bank transfer
          confirmation.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title="Submit for Verification"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={saving}
        />

        <View style={{ height: 110 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 24 },
  successContent: { flexGrow: 1, justifyContent: "center", paddingTop: 24, paddingBottom: 24 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  amountCard: { padding: 16, alignItems: "center", marginBottom: 20 },
  amountLabel: { fontSize: 13, color: colors.gray },
  amountValue: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primaryBlue,
    marginTop: 4,
  },
  amountDetail: { fontSize: 11, color: colors.gray, marginTop: 6 },
  verifyText: { fontSize: 12, color: colors.gray, textAlign: "center", marginBottom: 12 },
  hint: { fontSize: 11, color: colors.gray, marginTop: 6, marginBottom: 24 },
  checkWrap: { alignItems: "center", marginBottom: 16 },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.darkText,
    textAlign: "center",
  },
  subtext: {
    fontSize: 13,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 6,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginTop: 20,
    backgroundColor: "#EBF2FF",
  },
  infoText: { flex: 1, fontSize: 12, color: colors.darkText, lineHeight: 18 },
  uploadChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
    marginBottom: 16,
  },
  uploadChipText: {
    fontSize: 13,
    color: colors.primaryBlue,
    fontWeight: "500",
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: colors.red,
    textAlign: "center",
    marginBottom: 12,
  },
});
