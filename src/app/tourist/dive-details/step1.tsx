import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Checkbox,
  Dropdown,
  FileUpload,
  ProgressiveWizardShell,
  TextInput,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { spacing } from "../../../constants/spacing";
import { typography } from "../../../constants/typography";
import { useAuth } from "../../../hooks/useAuth";
import { FileInfo, uploadFile } from "../../../lib/storage";
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

const divePassOptions = [
  { label: "One-Day Dive Pass", value: "one-day" },
  { label: "Annual Dive Pass", value: "annual" },
];

const diveTypeOptions = [
  { label: "Intro/Fun Dive", value: "intro-fun" },
  { label: "Certified", value: "certified" },
];

const certLevelOptions = [
  { label: "Open Water Diver", value: "open-water" },
  { label: "Advanced Open Water", value: "advanced" },
  { label: "Rescue Diver", value: "rescue" },
  { label: "Dive Master", value: "dive-master" },
  { label: "Instructor", value: "instructor" },
];

const privacyLabel = "I consent to the collection and processing of my personal data in accordance with the Data Privacy Act of 2012.";

export default function DiveDetailsStep1() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile, isLoading, updateProfile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [divePassType, setDivePassType] = useState("");
  const [diveType, setDiveType] = useState("");
  const [certLevel, setCertLevel] = useState("");
  const [dateAccredited, setDateAccredited] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [certFile, setCertFile] = useState<FileInfo | null>(null);
  const [certError, setCertError] = useState("");
  const [expiredWarning, setExpiredWarning] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setNationality(profile.nationality || "");
    setEmergencyName(profile.emergency_contact_name || "");
    setEmergencyPhone(profile.emergency_contact_number || "");
    setDivePassType(profile.dive_pass_type || "");
    setDiveType(profile.type_of_dive || "");
    setCertLevel(profile.certification_level || "");
    setDateAccredited(profile.date_accredited || "");
    setRenewalDate(profile.renewal_date || "");
  }, [profile]);

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!fullName.trim()) nextErrors.fullName = "Required";
      if (!nationality) nextErrors.nationality = "Required";
      if (!emergencyName.trim()) nextErrors.emergencyName = "Required";
      if (!emergencyPhone.trim()) nextErrors.emergencyPhone = "Required";
      else if (!/^\+63\s9\d{9}$/.test(emergencyPhone.trim())) {
        nextErrors.emergencyPhone = "Format: +63 9XXXXXXXXX";
      }
    } else if (currentStep === 1) {
      if (!divePassType) nextErrors.divePassType = "Required";
      if (!diveType) nextErrors.diveType = "Required";
      if (diveType === "certified") {
        if (!certLevel) nextErrors.certLevel = "Required";
        if (!dateAccredited.trim()) nextErrors.dateAccredited = "Required";
        if (!renewalDate.trim()) nextErrors.renewalDate = "Required";
        if (!certFile && !profile?.cert_upload_path) nextErrors.certFile = "Certification proof is required";
        if (dateAccredited.trim() && renewalDate.trim() && renewalDate < dateAccredited) {
          nextErrors.renewalDate = "Renewal date must be after accredited date";
        }
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
        setCertError("");
        setErrors((current) => {
          const next = { ...current };
          delete next.certFile;
          return next;
        });
      }
    } catch {
      setCertError("Failed to pick file.");
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
        emergency_contact_number: emergencyPhone.trim(),
        dive_pass_type: divePassType,
        type_of_dive: diveType,
      };

      if (diveType === "certified") {
        updates.certification_level = certLevel;
        updates.date_accredited = dateAccredited.trim();
        updates.renewal_date = renewalDate.trim();
        if (certFile) {
          const { path, error } = await uploadFile("tourist_uploads", "certifications", certFile, profile?.id || "");
          if (error) {
            setSaveError(error);
            setSaving(false);
            return;
          }
          if (path) updates.cert_upload_path = path;
        }
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
      router.push(diveType === "certified" ? "/eco-dive-id/complete" : "/(tabs)/eco-dive-id");
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
        : "Choose your pass and provide your dive credentials."}
      onHeaderBack={() => currentStep > 0 ? goBack() : router.back()}
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
                <TextInput label="Phone Number" placeholder="+63 9XXXXXXXXX" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" error={errors.emergencyPhone} />
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
                <Text style={styles.sectionHint}>Certification details are required for certified divers.</Text>
              </View>
            </View>
            <View style={styles.fieldsGroup}>
              <Dropdown label="Type of Dive Pass" placeholder="Select dive pass type" value={divePassType} options={divePassOptions} onSelect={setDivePassType} error={errors.divePassType} />
              <Dropdown label="Type of Dive" placeholder="Select dive type" value={diveType} options={diveTypeOptions} onSelect={(value) => { setDiveType(value); setErrors((current) => { const next = { ...current }; delete next.certLevel; delete next.dateAccredited; delete next.renewalDate; delete next.certFile; return next; }); }} error={errors.diveType} />
              {diveType === "certified" ? (
                <View style={styles.certificationGroup}>
                  <Text style={styles.subsectionTitle}>Certification details</Text>
                  <Dropdown label="Certification Level" placeholder="Select certification level" value={certLevel} options={certLevelOptions} onSelect={setCertLevel} error={errors.certLevel} />
                  <View style={[styles.twoCol, width < 600 && styles.twoColStacked]}>
                    <View style={styles.twoColItem}>
                      <TextInput label="Date Accredited" placeholder="YYYY-MM-DD" value={dateAccredited} onChangeText={setDateAccredited} error={errors.dateAccredited} />
                    </View>
                    <View style={styles.twoColItem}>
                      <TextInput label="Renewal Date" placeholder="YYYY-MM-DD" value={renewalDate} onChangeText={(value) => { setRenewalDate(value); const date = new Date(value); date.setHours(0, 0, 0, 0); const today = new Date(); today.setHours(0, 0, 0, 0); setExpiredWarning(date < today ? "This certification is expired. Please renew as needed." : ""); }} error={errors.renewalDate} />
                    </View>
                  </View>
                  {expiredWarning ? <Text style={styles.warningText}>{expiredWarning}</Text> : null}
                  <View style={styles.uploadCard}>
                    <Text style={styles.uploadTitle}>Certification proof</Text>
                    <Text style={styles.sectionHint}>Add a clear photo or PDF of your certification.</Text>
                    <FileUpload label="Upload Certification" onPress={pickCertFile} fileName={certFile?.name || (profile?.cert_upload_path ? "Previously uploaded" : undefined)} showCamera />
                    {errors.certFile ? <Text style={styles.errorText}>{errors.certFile}</Text> : null}
                    {certError ? <Text style={styles.errorText}>{certError}</Text> : null}
                  </View>
                </View>
              ) : null}
              {diveType === "intro-fun" ? (
                <View style={styles.infoHint}>
                  <Text style={styles.infoHintText}>Intro/Fun divers can continue without certification details.</Text>
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
  subsectionTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#17366e" },
  twoCol: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  twoColStacked: { flexDirection: "column" },
  twoColItem: { flex: 1, minWidth: 0 },
  uploadCard: { gap: 6, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: "#e4eef8", backgroundColor: "#fbfdff" },
  uploadTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  privacyCard: { gap: 8, padding: 13, borderRadius: 14, backgroundColor: "#f5f9fe" },
  privacyTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  infoHint: { padding: 12, borderRadius: 12, backgroundColor: "#eaf4ff" },
  infoHintText: { fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_500Medium", color: "#315b92" },
  warningText: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, color: "#92400e", backgroundColor: "#fef3c7", fontSize: 11, fontFamily: "Quicksand_600SemiBold" },
  errorText: { ...typography.caption, color: colors.red, marginTop: spacing.xs },
});
