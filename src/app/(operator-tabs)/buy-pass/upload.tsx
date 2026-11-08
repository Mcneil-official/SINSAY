import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
    TextInput,
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
import { BuyPassProgress, ContentContainer } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import type { FileInfo } from "../../../lib/storage";
import { uploadFile, validateFile } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";

export default function UploadReceiptScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { passId, passLabel, passCount, quantity } =
    useLocalSearchParams<{
      passId?: string;
      passLabel?: string;
      passCount?: string;
      quantity?: string;
      total?: string;
    }>();

  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState<FileInfo | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [unitPrice, setUnitPrice] = useState<number | null>(null);
  const [passesPerPack, setPassesPerPack] = useState<number | null>(null);
  const [passCode, setPassCode] = useState<string | null>(null);
  const [priceLoading, setPriceLoading] = useState(true);
  const [priceError, setPriceError] = useState(false);

  const pricingCode =
    passId === "annual-pass"
      ? "annual"
      : passId === "one-day-pass"
        ? "one_day"
        : null;

  useEffect(() => {
    queueMicrotask(() => {
      if (!pricingCode) {
        setPriceLoading(false);
        setPriceError(true);
        return;
      }
      (async () => {
        try {
          const { data, error: priceFetchError } = await supabase
            .from("pass_pricing")
            .select("price, passes, code")
            .eq("code", pricingCode)
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
    });
  }, [pricingCode]);

  const rawQty = Number(quantity) || 0;
  const qtyValid = Number.isInteger(rawQty) && rawQty >= 1 && rawQty <= 100;
  const qty = qtyValid ? rawQty : 0;
  const rawCustomCount = Number(passCount) || 0;
  const customCountValid =
    Number.isInteger(rawCustomCount) &&
    rawCustomCount >= 1 &&
    rawCustomCount <= 100;
  const isUnitRow = passesPerPack === 1;

  const verifiedPasses =
    passesPerPack !== null
      ? Math.min(100, isUnitRow ? rawCustomCount : passesPerPack * qty)
      : 0;
  const verifiedTotal =
    unitPrice !== null ? unitPrice * (isUnitRow ? rawCustomCount : qty) : 0;
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
    unitPrice > 0 &&
    passesPerPack !== null &&
    verifiedTotal > 0 &&
    (!isUnitRow || customCountValid) &&
    (isUnitRow || qtyValid);

  const refDigits = referenceNumber.replace(/\D/g, "");
  const refValid = /^\d{13}$/.test(refDigits);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const file: FileInfo = {
        uri: asset.uri,
        name: asset.name,
        size: asset.size || 0,
        mimeType: asset.mimeType || "image/jpeg",
      };

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError("");
      setReceiptFile(file);
    } catch (e) {
      console.warn("Document picker error:", e);
      setError("Failed to open file picker. Please try again.");
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!refValid) {
      setError("Please enter the 13-digit GCash reference number.");
      return;
    }
    if (!receiptFile) {
      setError("Please upload your payment receipt first.");
      return;
    }
    if (!pricingReady) {
      setError(
        "Pricing isn't verified yet. Please go back and reselect your passes.",
      );
      return;
    }
    if (!user) {
      setError("Please sign in to continue.");
      return;
    }

    setSaving(true);
    setError("");

    let receiptPath = "";
    try {
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

      const { error: rpcError } = await supabase.rpc("create_buy_pass_order", {
        p_pass_type: verifiedPassType,
        p_pass_label: passLabel || "",
        p_total_passes: verifiedPasses,
        p_amount: verifiedTotal,
        p_reference_number: refDigits,
        p_receipt_path: receiptPath,
      });

      if (rpcError) {
        try {
          await supabase.storage
            .from("operator_uploads")
            .remove([receiptPath]);
        } catch {
          // ignore
        }
        const msg = rpcError.message.includes("already submitted")
          ? "This GCash reference number was already submitted. Please check your history."
          : `Failed to save payment record: ${rpcError.message}`;
        setError(msg);
        setSaving(false);
        return;
      }

      setSubmitted(true);
    } catch (e) {
      console.error("Receipt submit failed:", e);
      if (receiptPath) {
        try {
          await supabase.storage
            .from("operator_uploads")
            .remove([receiptPath]);
        } catch {
          // ignore
        }
      }
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    }
    setSaving(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/loginpage");
  }, [authLoading, user, router]);

  const formattedFileSize = receiptFile?.size
    ? `${Math.ceil(receiptFile.size / 1024)} KB`
    : "245 KB";

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
              <Text style={styles.headerTitleText}>
                {submitted ? "Receipt Submitted" : "Submit Receipt"}
              </Text>
              <Text style={styles.headerSubtitleText}>
                {submitted ? "Verification in progress" : "Upload proof of payment"}
              </Text>
            </View>

            <View style={{ width: 36 }} />
          </View>

          <BuyPassProgress currentStep={3} />

          {/* If Submitted: Celebration Confirmation Card */}
          {submitted ? (
            <View style={styles.confirmedCard}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>

              <Text style={styles.confirmedTitle}>Receipt Submitted!</Text>
              <Text style={styles.confirmedSubtitle}>
                Your payment is recorded and sent to the Tourism Office queue for review.
              </Text>

              <View style={styles.recapDetailsTable}>
                <View style={styles.recapDetailRow}>
                  <Text style={styles.recapDetailLabel}>Package</Text>
                  <Text style={styles.recapDetailValue}>
                    {verifiedPasses} Dive Passes
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.recapDetailRow}>
                  <Text style={styles.recapDetailLabel}>Amount</Text>
                  <Text style={styles.recapDetailValue}>
                    ₱{verifiedTotal.toLocaleString()}.00
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.recapDetailRow}>
                  <Text style={styles.recapDetailLabel}>Reference No.</Text>
                  <Text style={styles.recapDetailValue}>{refDigits}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.recapDetailRow}>
                  <Text style={styles.recapDetailLabel}>Status</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>UNDER REVIEW</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Order Summary Recap Strip */}
              <View style={styles.recapCard}>
                <View style={styles.recapRow}>
                  <View style={styles.recapIconBubble}>
                    <Ionicons name="ticket" size={15} color="#006bff" />
                  </View>
                  <Text style={styles.recapText} numberOfLines={1}>
                    <Text style={{ fontFamily: "Quicksand_700Bold" }}>
                      {verifiedPasses} Dive Passes
                    </Text>{" "}
                    · ₱{verifiedTotal.toLocaleString()}.00
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
                  </View>
                </View>
              </View>

              {/* Upload Zone (or Selected Receipt Preview) */}
              {!receiptFile ? (
                <TouchableOpacity
                  style={styles.uploadZone}
                  activeOpacity={0.8}
                  onPress={handlePickDocument}
                  accessibilityRole="button"
                  accessibilityLabel="Upload GCash e-receipt"
                >
                  <View style={styles.uploadCloudBubble}>
                    <Ionicons name="cloud-upload" size={32} color="#006bff" />
                  </View>
                  <Text style={styles.uploadZoneTitle}>
                    Upload GCash E-Receipt
                  </Text>
                  <Text style={styles.uploadZoneSub}>
                    Tap to choose JPG, PNG or PDF (Max 5MB)
                  </Text>
                  <View style={styles.browsePill}>
                    <Text style={styles.browsePillText}>Browse Document</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.previewContainer}>
                  <Text style={styles.sectionHeaderTitle}>Selected Receipt</Text>
                  <View style={styles.receiptPreviewCard}>
                    <View style={styles.receiptThumbBox}>
                      {receiptFile.mimeType?.startsWith("image/") ? (
                        <Image
                          source={{ uri: receiptFile.uri }}
                          style={styles.receiptThumbImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.receiptThumbPdfText}>PDF</Text>
                      )}
                    </View>

                    <View style={styles.receiptInfoCol}>
                      <Text style={styles.receiptName} numberOfLines={1}>
                        {receiptFile.name}
                      </Text>
                      <Text style={styles.receiptSize}>{formattedFileSize}</Text>
                    </View>

                    <TouchableOpacity
                      onPress={handleRemoveFile}
                      hitSlop={8}
                      style={styles.removeFileBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Remove receipt file"
                    >
                      <Ionicons name="close" size={18} color="#6c7caa" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* GCash Reference Number Input */}
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>
                  GCash Reference Number (13 digits)
                </Text>
                <TextInput
                  style={[
                    styles.refInput,
                    referenceNumber.length > 0 &&
                      !refValid &&
                      styles.refInputError,
                  ]}
                  placeholder="e.g. 1002 9384 7561"
                  placeholderTextColor="#94A3B8"
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                  keyboardType="phone-pad"
                  maxLength={16}
                  accessibilityLabel="GCash Reference Number"
                />
                {referenceNumber.length > 0 && !refValid && (
                  <Text style={styles.inlineErrorText}>
                    Please enter the complete 13-digit reference number.
                  </Text>
                )}
              </View>
            </>
          )}

          {error ? <Text style={styles.mainErrorText}>{error}</Text> : null}

          {/* Transaction Status Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>Verification Workflow</Text>

            <View style={styles.timeline}>
              {/* Step 1 */}
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    submitted ? styles.timelineDotDone : styles.timelineDotActive,
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color="#FFFFFF"
                  />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStepTitle}>
                    {submitted ? "Receipt submitted" : "Submit receipt"}
                  </Text>
                  <Text style={styles.timelineStepSub}>
                    {submitted ? "Recorded in verification queue" : "Ready for submission"}
                  </Text>
                </View>
              </View>

              {/* Connecting line 1 */}
              <View
                style={[
                  styles.timelineConnector,
                  submitted && styles.timelineConnectorActive,
                ]}
              />

              {/* Step 2 */}
              <View style={styles.timelineItem}>
                <View
                  style={[
                    styles.timelineDot,
                    submitted ? styles.timelineDotCurrent : styles.timelineDotPending,
                  ]}
                >
                  <View style={styles.innerDot} />
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineStepTitle,
                      submitted && styles.timelineStepTitleActive,
                    ]}
                  >
                    Under Tourism Office Review
                  </Text>
                  <Text style={styles.timelineStepSub}>
                    {submitted ? "Review in progress..." : "Queued upon submission"}
                  </Text>
                </View>
              </View>

              {/* Connecting line 2 */}
              <View style={styles.timelineConnector} />

              {/* Step 3 */}
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotPending]}>
                  <Ionicons name="card" size={11} color="#94A3B8" />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineStepTitle}>
                    Approved – Credits Added
                  </Text>
                  <Text style={styles.timelineStepSub}>
                    Pass inventory automatically credited
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Notice Alert */}
          <View style={styles.reviewNotice}>
            <Ionicons name="time" size={17} color="#003cda" />
            <Text style={styles.reviewNoticeText}>
              Turnaround time: usually verified within 24–48 hours.
            </Text>
          </View>

          {/* Action Button */}
          {!submitted ? (
            <TouchableOpacity
              activeOpacity={0.88}
              style={[
                styles.primarySubmitBtn,
                (!refValid || !receiptFile || saving) &&
                  styles.primarySubmitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!refValid || !receiptFile || saving}
              accessibilityRole="button"
              accessibilityLabel="Submit receipt"
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.primarySubmitBtnText}>
                    Submit Receipt for Verification
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.outlineBackBtn}
              onPress={() => router.replace("/(operator-tabs)/buy-pass")}
              accessibilityRole="button"
              accessibilityLabel="Back to Dive Pass"
            >
              <Ionicons name="arrow-back" size={16} color="#006bff" />
              <Text style={styles.outlineBackBtnText}>Back to Dive Pass</Text>
            </TouchableOpacity>
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
  confirmedCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#4089dc",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#129b83",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#129b83",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  confirmedTitle: {
    fontSize: 19,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginBottom: 4,
  },
  confirmedSubtitle: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 16,
  },
  recapDetailsTable: {
    width: "100%",
    backgroundColor: "#f4f8fe",
    borderRadius: 14,
    padding: 12,
  },
  recapDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  recapDetailLabel: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  recapDetailValue: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  divider: {
    height: 1,
    backgroundColor: "#e4eeff",
    marginVertical: 4,
  },
  pendingBadge: {
    backgroundColor: "#d2e8ff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#0058f5",
  },
  recapCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
  },
  recapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recapIconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#d7ebff",
    alignItems: "center",
    justifyContent: "center",
  },
  recapText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#07156c",
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  verifiedBadgeText: {
    fontSize: 8.5,
    fontFamily: "Quicksand_700Bold",
    color: "#16a34a",
  },
  uploadZone: {
    minHeight: 140,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#428fff",
    backgroundColor: "rgba(219, 237, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 5,
    marginBottom: 12,
  },
  uploadCloudBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    shadowColor: "#006bff",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  uploadZoneTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  uploadZoneSub: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  browsePill: {
    marginTop: 4,
    backgroundColor: "#006bff",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  browsePillText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  previewContainer: {
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginBottom: 6,
  },
  receiptPreviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf3fc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0eaff",
    padding: 10,
    gap: 12,
  },
  receiptThumbBox: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  receiptThumbImg: {
    width: "100%",
    height: "100%",
  },
  receiptThumbPdfText: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  receiptInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  receiptName: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginBottom: 2,
  },
  receiptSize: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
  },
  removeFileBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  inputCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginBottom: 6,
  },
  refInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1e0ff",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#07156c",
  },
  refInputError: {
    borderColor: "#b6223a",
  },
  inlineErrorText: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#b6223a",
    marginTop: 4,
    marginLeft: 2,
  },
  mainErrorText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#b6223a",
    marginBottom: 10,
    textAlign: "center",
  },
  timelineSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(111, 185, 237, 0.24)",
    padding: 14,
    marginBottom: 12,
    shadowColor: "#4089dc",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
    marginBottom: 12,
  },
  timeline: {
    paddingHorizontal: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotActive: {
    backgroundColor: "#006bff",
  },
  timelineDotDone: {
    backgroundColor: "#129b83",
  },
  timelineDotCurrent: {
    borderWidth: 2,
    borderColor: "#006bff",
    backgroundColor: "#d7ebff",
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#006bff",
  },
  timelineDotPending: {
    borderWidth: 1.5,
    borderColor: "#c6d2ec",
    backgroundColor: "#f4f9ff",
  },
  timelineConnector: {
    width: 2,
    height: 20,
    backgroundColor: "#b9c9e9",
    marginLeft: 10,
    marginVertical: 2,
  },
  timelineConnectorActive: {
    backgroundColor: "#006bff",
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#07156c",
  },
  timelineStepTitleActive: {
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
  timelineStepSub: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#5368b1",
    marginTop: 1,
  },
  reviewNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#e9f4ff",
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#cfe5ff",
  },
  reviewNoticeText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#07156c",
  },
  primarySubmitBtn: {
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
  primarySubmitBtnDisabled: {
    opacity: 0.45,
    backgroundColor: "#7baeff",
  },
  primarySubmitBtnText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  outlineBackBtn: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#006bff",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineBackBtnText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#006bff",
  },
});
