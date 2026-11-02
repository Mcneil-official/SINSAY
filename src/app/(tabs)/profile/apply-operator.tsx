import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Button,
  Checkbox,
  Dropdown,
  FileUpload,
  ProgressiveWizardShell,
  TextInput,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { uploadFile } from "../../../lib/storage";
import { supabase } from "../../../lib/supabase";

const roleOptions = [
  { label: "Staff", value: "staff" },
  { label: "Manager", value: "manager" },
  { label: "Owner", value: "owner" },
  { label: "Dive Master", value: "dive-master" },
  { label: "Instructor", value: "instructor" },
];

export default function ApplyOperatorScreen() {
  const router = useRouter();
  const { user, operatorApplication, isLoading: authLoading } = useAuth();
  const [resortName, setResortName] = useState("");
  const [resortLocation, setResortLocation] = useState("");
  const [role, setRole] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [businessPermitUrl, setBusinessPermitUrl] = useState<string | null>(
    null,
  );
  const [pcssUrl, setPcssUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState<"permit" | "pcss" | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
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

  const validateCurrentStep = () => {
    const errs: Record<string, string> = {};
    if (currentStep === 0) {
      if (!resortName.trim()) errs.resortName = "Required";
      if (!resortLocation.trim()) errs.resortLocation = "Required";
    } else if (currentStep === 1) {
      if (!role) errs.role = "Required";
      if (!contactNumber.trim()) errs.contactNumber = "Required";
    } else {
      if (!businessPermitUrl) errs.businessPermitUrl = "Upload required";
      if (!pcssUrl) errs.pcssUrl = "Upload required";
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
    if (!businessPermitUrl) errs.businessPermitUrl = "Upload required";
    if (!pcssUrl) errs.pcssUrl = "Upload required";
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
      | File
      | { name: string; mimeType?: string; size?: number; uri: string },
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
      | File
      | { name: string; mimeType?: string; size?: number; uri: string },
  ) => {
    setUploading("permit");
    setUploadError(null);
    const { path: url, error } = await handleUploadFile(file, "operator_uploads", "permits");
    if (error) setUploadError(error);
    else if (url) setBusinessPermitUrl(url);
    setUploading(null);
  };

  const handleUploadPcss = async (
    file:
      | File
      | { name: string; mimeType?: string; size?: number; uri: string },
  ) => {
    setUploading("pcss");
    setUploadError(null);
    const { path: url, error } = await handleUploadFile(file, "operator_uploads", "pcss");
    if (error) setUploadError(error);
    else if (url) setPcssUrl(url);
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
      contact_number: contactNumber.trim(),
      facebook_url: facebook.trim() || null,
      website_url: website.trim() || null,
      business_permit_url: businessPermitUrl,
      pcss_url: pcssUrl,
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
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator
          size="large"
          color={colors.primaryBlue}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
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
            You&apos;ll receive a notification once your application is approved or
            rejected.
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
      stepDescription={currentStep === 0 ? "Start with the resort you represent." : currentStep === 1 ? "Add your role and contact details." : "Upload documents and review your application."}
      onHeaderBack={() => router.back()}
      secondaryAction={{
        label: currentStep === 0 ? "Cancel" : "Back",
        onPress: () => currentStep === 0 ? router.back() : setCurrentStep((step) => step - 1),
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
                  Update your details below and resubmit.
                </Text>
              </View>
            </View>
          ) : null}
          <View style={styles.stepCard}>
            <View style={styles.stepIntro}>
              <View style={styles.stepIcon}>
                <Ionicons
                  name={currentStep === 2 ? "shield-checkmark-outline" : currentStep === 1 ? "call-outline" : "business-outline"}
                  size={19}
                  color={colors.primaryBlue}
                />
              </View>
              <View style={styles.stepIntroCopy}>
                <Text style={styles.stepTitle}>
                  {currentStep === 0 ? "Resort details" : currentStep === 1 ? "Applicant & contact" : "Documents & review"}
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
                <TextInput
                  label="Resort Name"
                  placeholder="e.g. Anilao Beach Club"
                  value={resortName}
                  onChangeText={setResortName}
                  error={errors.resortName}
                />
                <TextInput
                  label="Resort Location"
                  placeholder="Anilao, Mabini, Batangas"
                  value={resortLocation}
                  onChangeText={setResortLocation}
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
                  placeholder="+63 9XXXXXXXXX"
                  value={contactNumber}
                  onChangeText={setContactNumber}
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
                  <Text style={styles.reviewValue}>{resortName || "Not provided"}</Text>
                  <Text style={styles.reviewLabel}>LOCATION</Text>
                  <Text style={styles.reviewValue}>{resortLocation || "Not provided"}</Text>
                  <Text style={styles.reviewLabel}>APPLICANT</Text>
                  <Text style={styles.reviewValue}>
                    {roleOptions.find((item) => item.value === role)?.label || "Not selected"}
                    {contactNumber ? ` · ${contactNumber}` : ""}
                  </Text>
                </View>

                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>Business Permit</Text>
                  <Text style={styles.uploadHint}>A clear photo or PDF of your resort’s current permit.</Text>
                  <FileUpload
                    label="Upload Business Permit"
                    onFileSelect={handleUploadPermit}
                    fileName={businessPermitUrl ? "Uploaded" : undefined}
                    showCamera
                  />
                  {errors.businessPermitUrl && (
                    <Text style={styles.errorText}>{errors.businessPermitUrl}</Text>
                  )}
                </View>

                <View style={styles.uploadCard}>
                  <Text style={styles.uploadLabel}>PCSS Accreditation</Text>
                  <Text style={styles.uploadHint}>Upload your PCSS accreditation document.</Text>
                  <FileUpload
                    label="Upload PCSS Accreditation"
                    onFileSelect={handleUploadPcss}
                    fileName={pcssUrl ? "Uploaded" : undefined}
                    showCamera
                  />
                  {errors.pcssUrl && (
                    <Text style={styles.errorText}>{errors.pcssUrl}</Text>
                  )}
                </View>

                {uploadError ? <Text style={styles.errorText}>{uploadError}</Text> : null}
                <Checkbox
                  checked={agreed}
                  onToggle={() => setAgreed(!agreed)}
                  label="I confirm that the information provided is accurate and that I am authorized to represent the resort."
                  error={errors.agreed}
                />
                {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
              </View>
            )}
          </View>
    </ProgressiveWizardShell>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f1f9ff" },
  container: { flex: 1, minHeight: 0 },
  progressContainer: { paddingHorizontal: 16, paddingTop: 12 },
  scrollContent: { paddingTop: 4, paddingBottom: 18 },
  formContainer: { paddingHorizontal: 16 },
  stepCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4EEF8",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#0B206B",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
    gap: 18,
  },
  stepIntro: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#EAF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  stepIntroCopy: { flex: 1, minWidth: 0, gap: 3 },
  stepEyebrow: { fontSize: 9, letterSpacing: 1.2, color: "#7183A4", fontFamily: "Quicksand_700Bold" },
  stepTitle: { fontSize: 18, color: "#07156C", fontFamily: "Quicksand_700Bold" },
  stepDescription: { fontSize: 12, lineHeight: 17, color: "#7183A4", fontFamily: "Quicksand_500Medium" },
  fieldsGroup: { gap: 14 },
  reviewCard: { backgroundColor: "#F5F9FE", borderRadius: 14, padding: 14, gap: 4 },
  reviewTitle: { color: "#07156C", fontSize: 13, fontFamily: "Quicksand_700Bold", marginBottom: 5 },
  reviewLabel: { color: "#7183A4", fontSize: 9, letterSpacing: 0.8, fontFamily: "Quicksand_700Bold", marginTop: 6 },
  reviewValue: { color: "#315B92", fontSize: 12, lineHeight: 17, fontFamily: "Quicksand_600SemiBold" },
  uploadLabel: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
    marginBottom: 4,
  },
  uploadHint: { color: "#7183A4", fontSize: 11, lineHeight: 16, marginBottom: 8, fontFamily: "Quicksand_500Medium" },
  uploadCard: { borderWidth: 1, borderColor: "#E4EEF8", borderRadius: 15, padding: 13, backgroundColor: "#FBFDFF" },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4EEF8",
    paddingVertical: 10,
  },
  footerContent: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  footerPrimary: { flex: 1 },
  cancelButton: { minWidth: 88, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#F0F6FD" },
  cancelButtonText: { color: "#526789", fontSize: 13, fontFamily: "Quicksand_700Bold" },
  backStepButton: { minWidth: 88, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 13, backgroundColor: "#F0F6FD" },
  backStepText: { color: colors.primaryBlue, fontSize: 13, fontFamily: "Quicksand_700Bold" },
  errorText: { fontSize: 11, color: colors.red, fontFamily: "Quicksand_600SemiBold" },
  rejectedBanner: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  rejectedTextWrap: { flex: 1, gap: 2 },
  rejectedTitle: { fontSize: 13, fontFamily: "Quicksand_700Bold", color: colors.red },
  rejectedReason: { fontSize: 12, color: colors.darkText, lineHeight: 17, fontFamily: "Quicksand_500Medium" },
  rejectedHint: { fontSize: 11, color: colors.gray, fontFamily: "Quicksand_500Medium" },
  confirmContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: "#f1f9ff",
  },
  confirmIcon: { marginBottom: 20 },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    color: colors.darkText,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  confirmSubtext: {
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 32,
  },
  confirmButtonWrap: { width: "100%", maxWidth: 420 },
});
