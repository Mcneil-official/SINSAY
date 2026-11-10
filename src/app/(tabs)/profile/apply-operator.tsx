import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Dropdown,
  FileUpload,
  ProgressiveWizardShell,
  ResortLogoBadge,
  TextInput,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import {
  isValidPhDigits,
  toDbPhPhone,
  toLocalPhDigits,
} from "../../../lib/phone";
import { uploadFile } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";

const roleOptions = [
  { label: "Owner / Proprietor", value: "owner" },
  { label: "Staff", value: "staff" },
];

export default function ApplyOperatorScreen() {
  const router = useRouter();
  const { user, operatorApplication, isLoading: authLoading } = useAuth();
  const [resortName, setResortName] = useState("");
  const [resortLocation, setResortLocation] = useState("");
  const [unclaimedEstablishments, setUnclaimedEstablishments] = useState<{
    id: string;
    name: string;
    location: string | null;
    phone: string | null;
    website: string | null;
    facebook: string | null;
    description: string | null;
    logo_url?: string | null;
  }[]>([]);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [role, setRole] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [businessPermitUrl, setBusinessPermitUrl] = useState<string | null>(
    null,
  );
  const [pcssdUrl, setPcssdUrl] = useState<string | null>(null);
  const [dotUrl, setDotUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState<"permit" | "pcssd" | "dot" | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [agreed, setAgreed] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/loginpage");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !operatorApplication) return;
    if (operatorApplication.status === "approved") {
      router.replace("/(operator-tabs)");
    }
  }, [authLoading, operatorApplication, router]);

  useEffect(() => {
    let active = true;
    supabase
      .from("establishments")
      .select("id, name, location, phone, website, facebook, description, logo_url")
      .eq("accredited", true)
      .eq("is_claimed", false)
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (active && data) {
          setUnclaimedEstablishments(data);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const matchingSuggestions = useMemo(() => {
    const q = resortName.trim().toLowerCase();
    if (!q || !showSuggestions) return [];
    return unclaimedEstablishments
      .filter((est) => est.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [resortName, showSuggestions, unclaimedEstablishments]);

  const handleResortNameChange = (val: string) => {
    setResortName(val);
    setShowSuggestions(true);
    if (errors.resortName) {
      setErrors((prev) => ({ ...prev, resortName: undefined }));
    }
    if (selectedEstablishmentId) {
      const match = unclaimedEstablishments.find((e) => e.id === selectedEstablishmentId);
      if (!match || match.name.trim().toLowerCase() !== val.trim().toLowerCase()) {
        setSelectedEstablishmentId(null);
      }
    }
  };

  const handleSelectSuggestion = (est: {
    id: string;
    name: string;
    location: string | null;
    phone: string | null;
    website: string | null;
    facebook: string | null;
    description: string | null;
    logo_url?: string | null;
  }) => {
    setResortName(est.name);
    if (est.location) setResortLocation(est.location);
    if (!facebook && est.facebook) setFacebook(est.facebook);
    if (!website && est.website) setWebsite(est.website);
    setSelectedEstablishmentId(est.id);
    setShowSuggestions(false);
    setErrors((prev) => ({
      ...prev,
      resortName: undefined,
      resortLocation: undefined,
    }));
  };

  const validateCurrentStep = () => {
    const errs: Record<string, string> = {};
    if (currentStep === 0) {
      if (!resortName.trim()) errs.resortName = "Required";
      if (!resortLocation.trim()) errs.resortLocation = "Required";
    } else if (currentStep === 1) {
      if (!role) errs.role = "Required";
      if (!contactNumber.trim()) errs.contactNumber = "Required";
      else if (!isValidPhDigits(contactNumber))
        errs.contactNumber = "Format: 9XXXXXXXXX";
    } else {
      if (!businessPermitUrl) errs.businessPermitUrl = "Upload required";
      if (!agreed) errs.agreed = "You must confirm to proceed";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!resortName.trim()) errs.resortName = "Required";
    if (!resortLocation.trim()) errs.resortLocation = "Required";
    if (!role) errs.role = "Required";
    if (!contactNumber.trim()) errs.contactNumber = "Required";
    else if (!isValidPhDigits(contactNumber))
      errs.contactNumber = "Format: 9XXXXXXXXX";
    if (!businessPermitUrl) errs.businessPermitUrl = "Upload required";
    if (!agreed) errs.agreed = "You must confirm to proceed";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validateCurrentStep()) return;
    setSubmitError(null);
    if (currentStep < 2) {
      setCurrentStep((step) => step + 1);
      return;
    }
    void handleSubmit();
  };

  const handleUploadFile = async (
    file:
      File | { name: string; mimeType?: string; size?: number; uri: string },
    bucket: string,
    folder: string,
  ) => {
    const uid = user?.id;
    if (!uid) return { path: null, error: "Not authenticated" };
    const { path, error } = await uploadFile(bucket, folder, file, uid);
    if (error) {
      return { path: null, error };
    }
    return { path, error: null };
  };

  const handleUploadPermit = async (
    file:
      File | { name: string; mimeType?: string; size?: number; uri: string },
  ) => {
    setUploading("permit");
    setUploadError(null);
    const { path: url, error } = await handleUploadFile(
      file,
      "operator_uploads",
      "permits",
    );
    if (error) setUploadError(error);
    else if (url) setBusinessPermitUrl(url);
    setUploading(null);
  };

  const handleUploadPcssd = async (
    file:
      File | { name: string; mimeType?: string; size?: number; uri: string },
  ) => {
    setUploading("pcssd");
    setUploadError(null);
    const { path: url, error } = await handleUploadFile(
      file,
      "operator_uploads",
      "pcssd",
    );
    if (error) setUploadError(error);
    else if (url) setPcssdUrl(url);
    setUploading(null);
  };

  const handleUploadDot = async (
    file:
      File | { name: string; mimeType?: string; size?: number; uri: string },
  ) => {
    setUploading("dot");
    setUploadError(null);
    const { path: url, error } = await handleUploadFile(
      file,
      "operator_uploads",
      "dot",
    );
    if (error) setUploadError(error);
    else if (url) setDotUrl(url);
    setUploading(null);
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    setSubmitError(null);

    const { error } = await supabase.from("operator_applications").insert({
      tourist_id: user.id,
      resort_name: resortName.trim(),
      resort_location: resortLocation.trim(),
      role,
      contact_number: toDbPhPhone(contactNumber) || "",
      facebook_url: facebook.trim() || null,
      website_url: website.trim() || null,
      business_permit_url: businessPermitUrl,
      pcss_url: pcssdUrl,
      pcssd_url: pcssdUrl,
      dot_url: dotUrl,
      establishment_id: selectedEstablishmentId,
    });

    setSaving(false);
    if (error) {
      console.warn("Submit failed", error);
      // 23505 = idx_operator_apps_one_active partial unique violation:
      // user already has a pending/approved application.
      if ((error as { code?: string }).code === "23505") {
        setSubmitError(
          "You already have a pending or approved application. Please wait for review.",
        );
      } else {
        setSubmitError(error.message);
      }
      return;
    }
    setSubmitted(true);
  };

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  if (operatorApplication?.status === "pending" && !submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIcon}>
            <Ionicons name="time-outline" size={64} color={colors.orange} />
          </View>
          <Text style={styles.confirmTitle}>Application Pending</Text>
          <Text style={styles.confirmText}>
            You have already submitted an application to register{" "}
            {operatorApplication.resort_name} as a dive establishment. The
            Tourism Office is reviewing your documents.
          </Text>
          <Text style={styles.confirmSubtext}>
            You&apos;ll receive a notification once your application is approved
            or rejected.
          </Text>
          <View style={styles.confirmButtonWrap}>
            <Button title="Back to Profile" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.green} />
          </View>
          <Text style={styles.confirmTitle}>Application Submitted!</Text>
          <Text style={styles.confirmText}>
            Your application to register {resortName} as a dive establishment
            has been submitted. The Tourism Office will review your documents
            and verify your information.
          </Text>
          <Text style={styles.confirmSubtext}>
            You will be able to manage dive manifests and handle resort guests
            once your application is approved.
          </Text>
          <View style={styles.confirmButtonWrap}>
            <Button title="Back to Profile" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ProgressiveWizardShell
      eyebrow="TOURISM OFFICE"
      title="Operator Application"
      subtitle="Apply to register your resort as a dive establishment."
      steps={["Resort", "Contact", "Documents"]}
      currentIndex={currentStep}
      stepDescription={
        currentStep === 0
          ? "Start with the resort you represent."
          : currentStep === 1
            ? "Add your role and contact details."
            : "Upload documents and review your application."
      }
      onHeaderBack={() => router.back()}
      secondaryAction={{
        label: currentStep === 0 ? "Cancel" : "Back",
        onPress: () =>
          currentStep === 0
            ? router.back()
            : setCurrentStep((step) => step - 1),
      }}
      primaryLabel={currentStep === 2 ? "Submit Application" : "Continue"}
      onPrimaryPress={handleContinue}
      primaryDisabled={saving || uploading !== null}
      primaryLoading={saving}
    >
      {operatorApplication?.status === "rejected" && !submitted ? (
        <View style={styles.rejectedBanner}>
          <Ionicons name="close-circle" size={20} color={colors.red} />
          <View style={styles.rejectedTextWrap}>
            <Text style={styles.rejectedTitle}>
              Previous application not approved
            </Text>
            {operatorApplication.rejection_reason ? (
              <Text style={styles.rejectedReason}>
                Reason: {operatorApplication.rejection_reason}
              </Text>
            ) : null}
            <Text style={styles.rejectedHint}>
              You can update your details below and re-apply.
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.wizardInner}>
        <View style={styles.stepIntro}>
          <View style={styles.stepIcon}>
            <Ionicons
              name={
                currentStep === 2
                  ? "shield-checkmark-outline"
                  : currentStep === 1
                    ? "call-outline"
                    : "business-outline"
              }
              size={19}
              color={colors.primaryBlue}
            />
          </View>
          <View style={styles.stepIntroCopy}>
            <Text style={styles.stepTitle}>
              {currentStep === 0
                ? "Resort details"
                : currentStep === 1
                  ? "Applicant & contact"
                  : "Documents & review"}
            </Text>
            <Text style={styles.stepDescription}>
              {currentStep === 0
                ? "Start with the resort you represent."
                : currentStep === 1
                  ? "Tell us how to reach you and find your resort online."
                  : "Upload verification documents and confirm your application."}
            </Text>
          </View>
        </View>

        {currentStep === 0 ? (
          <View style={styles.fieldsGroup}>
            <View style={styles.resortInputWrapper}>
              <TextInput
                label="Resort Name"
                placeholder="Type your resort name..."
                value={resortName}
                onChangeText={handleResortNameChange}
                error={errors.resortName}
              />
              {selectedEstablishmentId ? (
                <View style={styles.verifiedClaimBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" />
                  <Text style={styles.verifiedClaimText}>
                    Matched with directory listing
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedEstablishmentId(null)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityLabel="Unlink directory listing"
                  >
                    <Ionicons name="close-circle" size={14} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {matchingSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionsHeader}>
                    <Ionicons name="sparkles" size={12} color="#087bff" />
                    <Text style={styles.suggestionsHeaderText}>
                      Directory Matches · Tap to select
                    </Text>
                  </View>
                  {matchingSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                      activeOpacity={0.7}
                    >
                      <ResortLogoBadge
                        name={item.name}
                        logoUrl={item.logo_url}
                        size={30}
                        borderRadius={8}
                        fontSize={11}
                      />
                      <View style={styles.suggestionTextWrap}>
                        <Text style={styles.suggestionName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        {item.location ? (
                          <Text
                            style={styles.suggestionLocation}
                            numberOfLines={1}
                          >
                            {item.location}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#94A3B8"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              label="Resort Location"
              placeholder="e.g. San Teodoro, Mabini, Batangas"
              value={resortLocation}
              onChangeText={(val) => {
                setResortLocation(val);
                if (errors.resortLocation) {
                  setErrors((prev) => ({ ...prev, resortLocation: undefined }));
                }
              }}
              error={errors.resortLocation}
            />
          </View>
        ) : currentStep === 1 ? (
          <View style={styles.fieldsGroup}>
            <Dropdown
              label="Your role at the resort"
              placeholder="Select your role"
              value={role}
              options={roleOptions}
              onSelect={setRole}
              error={errors.role}
            />
            <TextInput
              label="Contact Number"
              placeholder="9XXXXXXXXX"
              prefix="+63"
              maxLength={10}
              value={contactNumber}
              onChangeText={(val) => setContactNumber(toLocalPhDigits(val))}
              keyboardType="phone-pad"
              error={errors.contactNumber}
            />
            <TextInput
              label="Facebook Page (optional)"
              placeholder="https://facebook.com/..."
              value={facebook}
              onChangeText={setFacebook}
            />
            <TextInput
              label="Website (optional)"
              placeholder="https://..."
              value={website}
              onChangeText={setWebsite}
            />
          </View>
        ) : (
          <View style={styles.fieldsGroup}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewTitle}>Application summary</Text>
              <Text style={styles.reviewLabel}>RESORT</Text>
              <Text style={styles.reviewValue}>
                {resortName || "Not provided"}
              </Text>
              {selectedEstablishmentId ? (
                <View style={styles.reviewClaimTag}>
                  <Ionicons name="shield-checkmark" size={12} color="#059669" />
                  <Text style={styles.reviewClaimTagText}>
                    Claiming verified directory listing
                  </Text>
                </View>
              ) : (
                <View style={styles.reviewNewTag}>
                  <Ionicons name="add-circle" size={12} color="#2563EB" />
                  <Text style={styles.reviewNewTagText}>
                    New resort registration
                  </Text>
                </View>
              )}
              <Text style={styles.reviewLabel}>LOCATION</Text>
              <Text style={styles.reviewValue}>
                {resortLocation || "Not provided"}
              </Text>
              <Text style={styles.reviewLabel}>APPLICANT</Text>
              <Text style={styles.reviewValue}>
                {roleOptions.find((item) => item.value === role)?.label ||
                  "Not selected"}
                {contactNumber ? ` · ${contactNumber}` : ""}
              </Text>
            </View>

            {/* Business Permit (Required) */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadCardHeader}>
                <Text style={styles.uploadLabel}>Business Permit</Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>Required</Text>
                </View>
              </View>
              <Text style={styles.uploadHint}>
                Your resort`s business permit.
              </Text>
              <FileUpload
                label="Upload"
                onFileSelect={handleUploadPermit}
                fileName={businessPermitUrl ? "Uploaded" : undefined}
                showCamera
              />
              {errors.businessPermitUrl && (
                <Text style={styles.errorText}>{errors.businessPermitUrl}</Text>
              )}
            </View>

            {/* PCSSD Accreditation (Optional) */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadCardHeader}>
                <Text style={styles.uploadLabel}>PCSSD Accreditation</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              </View>
              <Text style={styles.uploadHint}>
                Philippine Commission on Sports Scuba Diving accreditation
                certificate.
              </Text>
              <FileUpload
                label="Upload"
                onFileSelect={handleUploadPcssd}
                fileName={pcssdUrl ? "Uploaded" : undefined}
                showCamera
              />
            </View>

            {/* DOT Accreditation (Optional) */}
            <View style={styles.uploadCard}>
              <View style={styles.uploadCardHeader}>
                <Text style={styles.uploadLabel}>DOT Accreditation</Text>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              </View>
              <Text style={styles.uploadHint}>
                Department of Tourism accreditation certificate.
              </Text>
              <FileUpload
                label="Upload"
                onFileSelect={handleUploadDot}
                fileName={dotUrl ? "Uploaded" : undefined}
                showCamera
              />
            </View>

            {uploadError ? (
              <Text style={styles.errorText}>{uploadError}</Text>
            ) : null}
            <Checkbox
              checked={agreed}
              onToggle={() => setAgreed(!agreed)}
              label="I confirm that the information provided is accurate and that I am authorized to represent the resort."
              error={errors.agreed}
            />
            {submitError ? (
              <Text style={styles.errorText}>{submitError}</Text>
            ) : null}
          </View>
        )}
      </View>
    </ProgressiveWizardShell>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  wizardInner: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 18,
  },
  stepIntro: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EDF5FD",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIntroCopy: { flex: 1, minWidth: 0, gap: 3 },
  stepEyebrow: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: "#7183A4",
    fontFamily: "Quicksand_700Bold",
  },
  stepTitle: {
    fontSize: 18,
    color: "#07156C",
    fontFamily: "Quicksand_700Bold",
  },
  stepDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: "#7183A4",
    fontFamily: "Quicksand_500Medium",
  },
  fieldsGroup: { gap: 14 },
  reviewCard: {
    backgroundColor: "#F5F9FE",
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  reviewTitle: {
    color: "#07156C",
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    marginBottom: 5,
  },
  reviewLabel: {
    color: "#7183A4",
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: "Quicksand_700Bold",
    marginTop: 6,
  },
  reviewValue: {
    color: "#315B92",
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Quicksand_600SemiBold",
  },
  uploadCard: {
    borderWidth: 1,
    borderColor: "#E4EEF8",
    borderRadius: 15,
    padding: 13,
    backgroundColor: "#FBFDFF",
  },
  uploadCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  uploadLabel: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
  },
  requiredBadge: {
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  requiredBadgeText: {
    color: colors.red,
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
  },
  optionalBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  optionalBadgeText: {
    color: "#64748B",
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
  },
  uploadHint: {
    color: "#7183A4",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
    fontFamily: "Quicksand_500Medium",
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4EEF8",
    paddingVertical: 10,
  },
  footerContent: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerPrimary: { flex: 1 },
  cancelButton: {
    minWidth: 88,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F0F6FD",
  },
  cancelButtonText: {
    color: "#526789",
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
  },
  backStepButton: {
    minWidth: 88,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 13,
    backgroundColor: "#F0F6FD",
  },
  backStepText: {
    color: colors.primaryBlue,
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
  },
  errorText: {
    fontSize: 11,
    color: colors.red,
    fontFamily: "Quicksand_600SemiBold",
  },
  rejectedBanner: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
    marginBottom: 12,
  },
  rejectedTextWrap: { flex: 1, gap: 2 },
  rejectedTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: colors.red,
  },
  rejectedReason: {
    fontSize: 12,
    color: colors.darkText,
    lineHeight: 17,
    fontFamily: "Quicksand_500Medium",
  },
  rejectedHint: {
    fontSize: 11,
    color: colors.gray,
    fontFamily: "Quicksand_500Medium",
  },
  confirmContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  confirmTitle: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    marginBottom: 10,
    textAlign: "center",
  },
  confirmText: {
    fontSize: 14,
    fontFamily: "Quicksand_500Medium",
    color: colors.gray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 6,
  },
  confirmSubtext: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: colors.gray,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
  },
  confirmButtonWrap: {
    width: "100%",
    maxWidth: 280,
  },
  resortInputWrapper: {
    position: "relative",
    gap: 6,
  },
  verifiedClaimBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedClaimText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#065F46",
  },
  suggestionsContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCEAF8",
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 2,
  },
  suggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  suggestionsHeaderText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#087bff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  suggestionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#F0F7FF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  suggestionLogo: {
    width: "100%",
    height: "100%",
  },
  suggestionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  suggestionName: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
  },
  suggestionLocation: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#647797",
    marginTop: 1,
  },
  reviewClaimTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    marginBottom: 4,
  },
  reviewClaimTagText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#065F46",
  },
  reviewNewTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
    marginBottom: 4,
  },
  reviewNewTagText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#1D4ED8",
  },
});
