import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    Checkbox,
    DateField,
    Dropdown,
    FileUpload,
    ProgressiveWizardShell,
    TextInput,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { spacing } from "../../../constants/spacing";
import { typography } from "../../../constants/typography";
import { useAuth } from "../../../hooks/useAuth";
import { toLocalPhDigits, toDbPhPhone, isValidPhDigits } from "../../../lib/phone";
import { FileInfo, uploadFile } from "../../../lib/storage";
import { safeBack } from "../../../lib/navigation";
import { supabase } from "../../../lib/supabase";

const nationalityOptions = [
  { label: "Filipino", value: "filipino" },
  { label: "American", value: "american" },
  { label: "Japanese", value: "japanese" },
  { label: "Korean", value: "korean" },
  { label: "Chinese", value: "chinese" },
  { label: "Australian", value: "australian" },
  { label: "European", value: "european" },
  { label: "Other", value: "other" },
];

const diveTypeOptions = [
  { label: "Fun Dive / Intro Dive / Guest", value: "fun-intro-guest" },
  { label: "Dive Instructor / Master", value: "instructor-master" },
];

const privacyLabel = "I consent to the collection and processing of my personal data in accordance with the Data Privacy Act of 2012.";

export default function DiveDetailsStep1() {
  const router = useRouter();
  const { profile, isLoading, updateProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [diveType, setDiveType] = useState("");
  const [certFile, setCertFile] = useState<FileInfo | null>(null);
  const [certFileError, setCertFileError] = useState("");
  const [renewalFile, setRenewalFile] = useState<FileInfo | null>(null);
  const [renewalFileError, setRenewalFileError] = useState("");
  const [dateAccredited, setDateAccredited] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      if (!profile) return;
      setFullName(profile.full_name || "");
      setNationality(profile.nationality || "");
      setEmergencyName(profile.emergency_contact_name || "");
      setEmergencyPhone(toLocalPhDigits(profile.emergency_contact_number || ""));
      let initialType = profile.type_of_dive || "";
      if (["fun", "intro", "guest", "guest-tourist", "intro-fun", "fun-intro-guest"].includes(initialType)) {
        initialType = "fun-intro-guest";
      } else if (["dive-master", "instructor", "certified", "instructor-master"].includes(initialType)) {
        initialType = "instructor-master";
      }
      setDiveType(initialType);
      setDateAccredited(profile.date_accredited || "");
      setRenewalDate(profile.renewal_date || "");
    });
  }, [profile]);

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!fullName.trim()) nextErrors.fullName = "Required";
      if (!nationality) nextErrors.nationality = "Required";
      if (!emergencyName.trim()) nextErrors.emergencyName = "Required";
      if (!emergencyPhone.trim()) nextErrors.emergencyPhone = "Required";
      else if (!isValidPhDigits(emergencyPhone)) {
        nextErrors.emergencyPhone = "Format: 9XXXXXXXXX";
      }
    } else if (currentStep === 1) {
      if (!diveType) nextErrors.diveType = "Required";
      if (diveType === "instructor-master") {
        // Require at least one of: newly picked cert file OR previously uploaded cert
        if (!certFile && !profile?.cert_upload_path) nextErrors.certFile = "Certification proof required";
        if (!dateAccredited.trim()) nextErrors.dateAccredited = "Required";
        if (!renewalDate.trim()) nextErrors.renewalDate = "Required";
      }
      if (!agreed) nextErrors.agreed = "You must agree to continue";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const pickCertFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setCertFile({ name: asset.name, mimeType: asset.mimeType, size: asset.size, uri: asset.uri });
        setCertFileError("");
        setErrors((current) => {
          const next = { ...current };
          delete next.certFile;
          return next;
        });
      }
    } catch {
      setCertFileError("Failed to pick file.");
    }
  };

  const pickRenewalFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setRenewalFile({ name: asset.name, mimeType: asset.mimeType, size: asset.size, uri: asset.uri });
        setRenewalFileError("");
        setErrors((current) => {
          const next = { ...current };
          delete next.renewalFile;
          return next;
        });
      }
    } catch {
      setRenewalFileError("Failed to pick file.");
    }
  };

  const ensureCompletedEcoId = async (touristId: string) => {
    const year = new Date().getFullYear();
    const ecoIdNumber = diveType === "certified"
      ? `ECO-${year}-${String(profile?.id.charCodeAt(0) || Math.floor(Math.random() * 999)).padStart(6, "0")}`
      : `ECO-${year}-${Date.now()}`;

    if (diveType !== "certified") {
      const { error } = await supabase.from("eco_dive_ids").upsert(
        { tourist_id: touristId, status: "complete", eco_id_number: ecoIdNumber, updated_at: new Date().toISOString() },
        { onConflict: "tourist_id" },
      );
      if (error) throw new Error("Failed to create Eco-Dive ID.");
      return;
    }

    const { data: existing, error: lookupError } = await supabase
      .from("eco_dive_ids")
      .select("id")
      .eq("tourist_id", touristId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    const result = existing
      ? await supabase.from("eco_dive_ids").update({ status: "complete", eco_id_number: ecoIdNumber }).eq("tourist_id", touristId)
      : await supabase.from("eco_dive_ids").insert({ tourist_id: touristId, eco_id_number: ecoIdNumber, status: "complete" });
    if (result.error) throw new Error(existing ? "Failed to update Eco-Dive ID." : "Failed to create Eco-Dive ID.");
  };

  const handleContinue = async () => {
    if (!validateCurrentStep()) return;
    setSaveError("");
    if (currentStep < 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        full_name: fullName.trim(),
        nationality,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_number: toDbPhPhone(emergencyPhone),
        type_of_dive: diveType,
      };

      if (diveType === "instructor-master") {
        updates.certification_level = "dive-master";
        if (dateAccredited.trim()) {
          updates.date_accredited = dateAccredited.trim();
        }
        if (renewalDate.trim()) {
          updates.renewal_date = renewalDate.trim();
        }
        if (certFile) {
          const { path, error } = await uploadFile("tourist_uploads", "cert", certFile, profile?.id || "");
          if (error) {
            setSaveError(error);
            setSaving(false);
            return;
          }
          if (path) updates.cert_upload_path = path;
        }
        if (renewalFile) {
          const { path, error } = await uploadFile("tourist_uploads", "renewal", renewalFile, profile?.id || "");
          if (error) {
            setSaveError(error);
            setSaving(false);
            return;
          }
          if (path) updates.renewal_cert_path = path;
        }
      } else {
        updates.certification_level = null;
      }

      const { error } = await updateProfile(updates);
      if (error) {
        setSaveError(error);
        setSaving(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) await ensureCompletedEcoId(user.id);
      await refreshProfile();
      setSaving(false);
      router.push("/(tabs)/eco-dive-id");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const goBack = () => {
    setErrors({});
    setSaveError("");
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <ProgressiveWizardShell
      eyebrow="DIVER PROFILE"
      title="Complete Dive Profile"
      subtitle="Set up your diver details in a few quick steps."
      steps={["Personal Info", "Dive Credentials"]}
      currentIndex={currentStep}
      stepDescription={currentStep === 0
        ? "Confirm your account name, nationality, and emergency contact."
        : "Provide your dive details and credentials."}
      onHeaderBack={() => currentStep > 0 ? goBack() : safeBack(router, "/(tabs)/eco-dive-id")}
      secondaryAction={currentStep > 0 ? { label: "Back", onPress: goBack } : undefined}
      primaryLabel={currentStep === 1 ? "Complete Profile" : "Continue"}
      onPrimaryPress={handleContinue}
      primaryDisabled={saving}
      primaryLoading={saving}
    >
      <View style={styles.stepCard}>
        {currentStep === 0 ? (
          <>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="person-outline" size={17} color="#087bff" /></View>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>Personal Info</Text>
                <Text style={styles.sectionHint}>Your name is filled from your account details.</Text>
              </View>
            </View>
            <View style={styles.fieldsGroup}>
              <TextInput label="Full Name" placeholder="Your full name" value={fullName} onChangeText={setFullName} error={errors.fullName} />
              <Dropdown label="Nationality" placeholder="Select your nationality" value={nationality} options={nationalityOptions} onSelect={setNationality} error={errors.nationality} />
            </View>
            <View style={styles.subsection}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}><Ionicons name="call-outline" size={16} color="#087bff" /></View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.subsectionTitle}>Emergency Contact</Text>
                  <Text style={styles.sectionHint}>Provide someone we can reach if needed.</Text>
                </View>
              </View>
              <View style={styles.fieldsGroup}>
                <TextInput label="Contact Name" placeholder="Juan Dela Cruz" value={emergencyName} onChangeText={setEmergencyName} error={errors.emergencyName} />
                <TextInput
                  label="Phone Number"
                  placeholder="9XXXXXXXXX"
                  prefix="+63"
                  maxLength={10}
                  value={emergencyPhone}
                  onChangeText={(val) => setEmergencyPhone(toLocalPhDigits(val))}
                  keyboardType="phone-pad"
                  error={errors.emergencyPhone}
                />
              </View>
            </View>
          </>
        ) : null}

        {currentStep === 1 ? (
          <>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="ribbon-outline" size={17} color="#087bff" /></View>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>Dive Credentials</Text>
                <Text style={styles.sectionHint}>Credentials are required for Dive Instructors & Dive Masters.</Text>
              </View>
            </View>
            <View style={styles.fieldsGroup}>
              <Dropdown
                label="Type of Dive"
                placeholder="Select dive type"
                value={diveType}
                options={diveTypeOptions}
                onSelect={(value) => {
                  setDiveType(value);
                  setErrors((current) => {
                    const next = { ...current };
                    delete next.certLevel;
                    delete next.certFile;
                    delete next.renewalFile;
                    return next;
                  });
                }}
                error={errors.diveType}
              />

              {diveType === "instructor-master" ? (
                <View style={styles.certificationGroup}>
                  {/* Card 1: Uploads */}
                  <View style={styles.credCard}>
                    <View style={styles.credCardHeader}>
                      <View style={styles.credCardIcon}>
                        <Ionicons name="document-text-outline" size={16} color="#087bff" />
                      </View>
                      <View style={styles.credCardCopy}>
                        <Text style={styles.credCardTitle}>Certification Documents</Text>
                        <Text style={styles.sectionHint}>
                          Upload your accreditation certificate and renewal documents (JPG, PNG or PDF).
                        </Text>
                      </View>
                    </View>

                    {/* Certification Proof (required) */}
                    <View style={styles.uploadSlot}>
                      <View style={styles.uploadSlotLabel}>
                        <Text style={styles.uploadSlotTitle}>CERTIFICATION PROOF</Text>
                        <Text style={styles.requiredDot}> *</Text>
                      </View>
                      <FileUpload
                        label="Upload Here"
                        onPress={pickCertFile}
                        fileName={certFile?.name || (profile?.cert_upload_path ? "Previously uploaded" : undefined)}
                        showCamera
                      />
                      {errors.certFile ? <Text style={styles.errorText}>{errors.certFile}</Text> : null}
                      {certFileError ? <Text style={styles.errorText}>{certFileError}</Text> : null}
                    </View>

                    {/* Renewal Proof (optional) */}
                    <View style={styles.uploadSlot}>
                      <View style={styles.uploadSlotLabel}>
                        <Text style={styles.uploadSlotTitle}>RENEWAL PROOF</Text>
                        <Text style={styles.optionalTag}> (optional)</Text>
                      </View>
                      <FileUpload
                        label="Upload Here"
                        onPress={pickRenewalFile}
                        fileName={renewalFile?.name || (profile?.renewal_cert_path ? "Previously uploaded" : undefined)}
                        showCamera
                      />
                      {renewalFileError ? <Text style={styles.errorText}>{renewalFileError}</Text> : null}
                    </View>
                  </View>

                  {/* Card 2: Dates */}
                  <View style={styles.credCard}>
                    <View style={styles.credCardHeader}>
                      <View style={styles.credCardIcon}>
                        <Ionicons name="calendar-outline" size={16} color="#087bff" />
                      </View>
                      <View style={styles.credCardCopy}>
                        <Text style={styles.credCardTitle}>Accreditation Dates</Text>
                        <Text style={styles.sectionHint}>
                          Specify when your certification was issued and when it expires.
                        </Text>
                      </View>
                    </View>
                    <View style={styles.twoCol}>
                      <View style={styles.twoColItem}>
                        <DateField
                          label="Date Accredited *"
                          value={dateAccredited}
                          onChangeText={(val) => {
                            setDateAccredited(val);
                            setErrors((curr) => { const next = { ...curr }; delete next.dateAccredited; return next; });
                          }}
                          placeholder="Select date"
                          error={errors.dateAccredited}
                        />
                      </View>
                      <View style={styles.twoColItem}>
                        <DateField
                          label="Renewal Date *"
                          value={renewalDate}
                          onChangeText={(val) => {
                            setRenewalDate(val);
                            setErrors((curr) => { const next = { ...curr }; delete next.renewalDate; return next; });
                          }}
                          placeholder="Select date"
                          error={errors.renewalDate}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}

              {diveType === "fun-intro-guest" ? (
                <View style={styles.infoHint}>
                  <Text style={styles.infoHintText}>
                    Fun, Intro, and Guest divers can continue without uploading credentials.
                  </Text>
                </View>
              ) : null}
              <View style={styles.privacyCard}>
                <Text style={styles.privacyTitle}>Data privacy</Text>
                <Checkbox checked={agreed} onToggle={() => setAgreed(!agreed)} label={privacyLabel} error={errors.agreed} />
              </View>
            </View>
          </>
        ) : null}

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
      </View>
    </ProgressiveWizardShell>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { flex: 1, backgroundColor: "#f4f8fd" },
  stepCard: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#e7edf5", padding: 18, gap: 18, shadowColor: "#2f5684", shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#e7f3ff" },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 15, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  sectionHint: { marginTop: 2, fontSize: 10, lineHeight: 14, fontFamily: "Quicksand_500Medium", color: "#70819a" },
  fieldsGroup: { gap: 14 },
  subsection: { gap: 12, paddingTop: 2 },
  certificationGroup: { gap: 12, paddingTop: 4 },
  proCredentialsGroup: { gap: 12, paddingTop: 8 },
  subsectionTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#17366e" },
  twoCol: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  twoColStacked: { flexDirection: "column" },
  twoColItem: { flex: 1, minWidth: 0 },
  credCard: {
    gap: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddeaf8",
    backgroundColor: "#f8fbff",
  },
  credCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  credCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f3ff",
  },
  credCardCopy: { flex: 1, minWidth: 0 },
  credCardTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  uploadSlot: { gap: 6 },
  uploadSlotLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadSlotTitle: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#5075a0",
    letterSpacing: 0.6,
  },
  requiredDot: {
    fontSize: 12,
    color: "#e53935",
    fontFamily: "Quicksand_700Bold",
  },
  optionalTag: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#94a3b8",
  },
  uploadCard: { gap: 6, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: "#e4eef8", backgroundColor: "#fbfdff" },
  uploadTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  privacyCard: { gap: 8, padding: 13, borderRadius: 14, backgroundColor: "#f5f9fe" },
  privacyTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  infoHint: { padding: 12, borderRadius: 12, backgroundColor: "#eaf4ff" },
  infoHintText: { fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_500Medium", color: "#315b92" },
  warningText: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, color: "#92400e", backgroundColor: "#fef3c7", fontSize: 11, fontFamily: "Quicksand_600SemiBold" },
  errorText: { ...typography.caption, color: colors.red, marginTop: spacing.xs },
});
