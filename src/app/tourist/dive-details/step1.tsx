import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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
  { label: "Intro Dive", value: "intro" },
  { label: "Fun Dive", value: "fun" },
  { label: "Guest or Tourist", value: "guest-tourist" },
  { label: "Certified", value: "certified" },
];

const certLevelOptions = [
  { label: "Open Water Diver", value: "open-water" },
  { label: "Advanced Open Water", value: "advanced" },
  { label: "Rescue Diver", value: "rescue" },
  { label: "Dive Master / Instructor", value: "dive-master" },
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
  const [diveType, setDiveType] = useState("");
  const [certLevel, setCertLevel] = useState("");
  const [pcssdAccreditationNo, setPcssdAccreditationNo] = useState("");
  const [pcssdFile, setPcssdFile] = useState<FileInfo | null>(null);
  const [pcssdError, setPcssdError] = useState("");
  const [permitToOperateNo, setPermitToOperateNo] = useState("");
  const [permitFile, setPermitFile] = useState<FileInfo | null>(null);
  const [permitError, setPermitError] = useState("");
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
      setDiveType(profile.type_of_dive || "");
      setCertLevel(profile.certification_level || "");
      setPcssdAccreditationNo(profile.pcssd_accreditation_no || "");
      setPermitToOperateNo(profile.permit_to_operate_no || "");
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
      if (diveType === "certified") {
        if (!certLevel) nextErrors.certLevel = "Required";
        if (certLevel === "dive-master") {
          if (!pcssdAccreditationNo.trim()) nextErrors.pcssdAccreditationNo = "Required";
          if (!pcssdFile && !profile?.pcssd_url) nextErrors.pcssdFile = "PCSSD Certificate required";
          if (!permitToOperateNo.trim()) nextErrors.permitToOperateNo = "Required";
          if (!permitFile && !profile?.permit_to_operate_url) nextErrors.permitFile = "Permit to Operate required";
        }
      }
      if (!agreed) nextErrors.agreed = "You must agree to continue";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const pickPcssdFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPcssdFile({ name: asset.name, mimeType: asset.mimeType, size: asset.size, uri: asset.uri });
        setPcssdError("");
        setErrors((current) => {
          const next = { ...current };
          delete next.pcssdFile;
          return next;
        });
      }
    } catch {
      setPcssdError("Failed to pick file.");
    }
  };

  const pickPermitFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPermitFile({ name: asset.name, mimeType: asset.mimeType, size: asset.size, uri: asset.uri });
        setPermitError("");
        setErrors((current) => {
          const next = { ...current };
          delete next.permitFile;
          return next;
        });
      }
    } catch {
      setPermitError("Failed to pick file.");
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

      if (diveType === "certified") {
        updates.certification_level = certLevel;
        if (pcssdAccreditationNo.trim()) {
          updates.pcssd_accreditation_no = pcssdAccreditationNo.trim();
        }
        if (permitToOperateNo.trim()) {
          updates.permit_to_operate_no = permitToOperateNo.trim();
        }
        if (pcssdFile) {
          const { path, error } = await uploadFile("tourist_uploads", "pcssd", pcssdFile, profile?.id || "");
          if (error) {
            setSaveError(error);
            setSaving(false);
            return;
          }
          if (path) updates.pcssd_url = path;
        }
        if (permitFile) {
          const { path, error } = await uploadFile("tourist_uploads", "permits", permitFile, profile?.id || "");
          if (error) {
            setSaveError(error);
            setSaving(false);
            return;
          }
          if (path) updates.permit_to_operate_url = path;
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
                <Text style={styles.sectionHint}>Certification details are required for certified divers.</Text>
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
                    delete next.pcssdAccreditationNo;
                    delete next.pcssdFile;
                    delete next.permitToOperateNo;
                    delete next.permitFile;
                    return next;
                  });
                }}
                error={errors.diveType}
              />

              {diveType === "certified" ? (
                <View style={styles.certificationGroup}>
                  <Dropdown
                    label="Type of Diver"
                    placeholder="Select diver certification level"
                    value={certLevel}
                    options={certLevelOptions}
                    onSelect={(val) => {
                      setCertLevel(val);
                      setErrors((curr) => {
                        const next = { ...curr };
                        delete next.certLevel;
                        return next;
                      });
                    }}
                    error={errors.certLevel}
                  />

                  {/* PCSSD Accreditation */}
                  <View style={styles.uploadCard}>
                    <Text style={styles.uploadTitle}>PCSSD Accreditation</Text>
                    <Text style={styles.sectionHint}>
                      {certLevel === "dive-master"
                        ? "Mandatory for Dive Masters & Instructors. Accreditation number & certificate."
                        : "Official Philippine Commission on Sports Scuba Diving number & certificate (if accredited)."}
                    </Text>
                    <TextInput
                      label="PCSSD Accreditation Number"
                      placeholder="e.g. PCSSD-2024-XXXX"
                      value={pcssdAccreditationNo}
                      onChangeText={(val) => {
                        setPcssdAccreditationNo(val);
                        setErrors((curr) => { const next = { ...curr }; delete next.pcssdAccreditationNo; return next; });
                      }}
                      error={errors.pcssdAccreditationNo}
                    />
                    <FileUpload
                      label="Upload PCSSD Certificate"
                      onPress={pickPcssdFile}
                      fileName={pcssdFile?.name || (profile?.pcssd_url ? "Previously uploaded" : undefined)}
                      showCamera
                    />
                    {errors.pcssdFile ? <Text style={styles.errorText}>{errors.pcssdFile}</Text> : null}
                    {pcssdError ? <Text style={styles.errorText}>{pcssdError}</Text> : null}
                  </View>

                  {/* Permit to Operate */}
                  <View style={styles.uploadCard}>
                    <Text style={styles.uploadTitle}>Permit to Operate</Text>
                    <Text style={styles.sectionHint}>
                      {certLevel === "dive-master"
                        ? "Mandatory municipal guide permit number & document for commercial dives."
                        : "Local government / MTO municipal dive permit number & document (if issued)."}
                    </Text>
                    <TextInput
                      label="Permit to Operate Number"
                      placeholder="e.g. PTO-PG-2024-XXXX"
                      value={permitToOperateNo}
                      onChangeText={(val) => {
                        setPermitToOperateNo(val);
                        setErrors((curr) => { const next = { ...curr }; delete next.permitToOperateNo; return next; });
                      }}
                      error={errors.permitToOperateNo}
                    />
                    <FileUpload
                      label="Upload Permit to Operate"
                      onPress={pickPermitFile}
                      fileName={permitFile?.name || (profile?.permit_to_operate_url ? "Previously uploaded" : undefined)}
                      showCamera
                    />
                    {errors.permitFile ? <Text style={styles.errorText}>{errors.permitFile}</Text> : null}
                    {permitError ? <Text style={styles.errorText}>{permitError}</Text> : null}
                  </View>
                </View>
              ) : null}

              {diveType && diveType !== "certified" ? (
                <View style={styles.infoHint}>
                  <Text style={styles.infoHintText}>
                    Intro, Fun, and Guest/Tourist divers can continue without certification details.
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
  uploadCard: { gap: 6, padding: 13, borderRadius: 15, borderWidth: 1, borderColor: "#e4eef8", backgroundColor: "#fbfdff" },
  uploadTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  privacyCard: { gap: 8, padding: 13, borderRadius: 14, backgroundColor: "#f5f9fe" },
  privacyTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  infoHint: { padding: 12, borderRadius: 12, backgroundColor: "#eaf4ff" },
  infoHintText: { fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_500Medium", color: "#315b92" },
  warningText: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, color: "#92400e", backgroundColor: "#fef3c7", fontSize: 11, fontFamily: "Quicksand_600SemiBold" },
  errorText: { ...typography.caption, color: colors.red, marginTop: spacing.xs },
});
