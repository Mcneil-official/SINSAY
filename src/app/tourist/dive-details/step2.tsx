import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, TextInput, Dropdown, FileUpload, ContentContainer } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";
import { uploadFile, FileInfo } from "../../../lib/storage";
import * as DocumentPicker from "expo-document-picker";

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

const certLevelOptions = [
  { label: "Open Water Diver", value: "open-water" },
  { label: "Advanced Open Water", value: "advanced" },
  { label: "Rescue Diver", value: "rescue" },
  { label: "Dive Master", value: "dive-master" },
  { label: "Instructor", value: "instructor" },
];

export default function DiveDetailsStep2() {
  const router = useRouter();
  const { profile, isLoading, updateProfile, refreshProfile } = useAuth();
  const [nationality, setNationality] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [divePassType, setDivePassType] = useState("");
  const [certLevel, setCertLevel] = useState("");
  const [dateAccredited, setDateAccredited] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [certFile, setCertFile] = useState<FileInfo | null>(null);
  const [certError, setCertError] = useState("");
  const [expiredWarning, setExpiredWarning] = useState("");

  useEffect(() => {
    if (profile) {
      if (profile.nationality) setNationality(profile.nationality);
      if (profile.emergency_contact_name) setEmergencyName(profile.emergency_contact_name);
      if (profile.emergency_contact_number) setEmergencyPhone(profile.emergency_contact_number);
      if (profile.dive_pass_type) setDivePassType(profile.dive_pass_type);
      if (profile.certification_level) setCertLevel(profile.certification_level);
      if (profile.date_accredited) setDateAccredited(profile.date_accredited);
      if (profile.renewal_date) setRenewalDate(profile.renewal_date);
    }
  }, [profile]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!nationality) errs.nationality = "Required";
    if (!emergencyName.trim()) errs.emergencyName = "Required";
    if (!emergencyPhone.trim()) errs.emergencyPhone = "Required";
    else if (!/^\+63\s9\d{9}$/.test(emergencyPhone.trim())) {
      errs.emergencyPhone = "Format: +63 9XXXXXXXXX";
    }
    if (!divePassType) errs.divePassType = "Required";
    if (!certLevel) errs.certLevel = "Required";
    if (!dateAccredited.trim()) errs.dateAccredited = "Required";
    if (!renewalDate.trim()) errs.renewalDate = "Required";
    if (dateAccredited.trim() && renewalDate.trim() && renewalDate < dateAccredited) {
      errs.renewalDate = "Renewal date must be after accredited date";
    }
    if (!agreed) errs.agreed = "You must agree to continue";
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      }
    } catch {
      setCertError("Failed to pick file.");
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");

    // Soft warning if renewal date is in the past (doesn't block submit)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (renewalDate.trim()) {
      const rd = new Date(renewalDate.trim());
      rd.setHours(0, 0, 0, 0);
      setExpiredWarning(rd < today ? "This certification is expired. Please renew as needed." : "");
    }

    try {
      const updates: Record<string, any> = {
        nationality,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_number: emergencyPhone.trim(),
        dive_pass_type: divePassType,
        type_of_dive: "certified",
        certification_level: certLevel,
        date_accredited: dateAccredited.trim(),
        renewal_date: renewalDate.trim(),
      };

      if (certFile) {
        const { path: certPath, error: certUploadError } = await uploadFile(
          "tourist_uploads", "certifications", certFile, profile?.id || ""
        );
        if (certUploadError) { setSaveError(certUploadError); setSaving(false); return; }
        if (certPath) updates.cert_upload_path = certPath;
      }

      const { error: profileError } = await updateProfile(updates);

      if (profileError) { setSaveError(profileError); setSaving(false); return; }

      // Create or update eco_dive_id
      if (profile) {
        const year = new Date().getFullYear();
        const hash = String(profile.id.charCodeAt(0) || Math.floor(Math.random() * 999)).padStart(6, "0");
        const ecoIdNumber = `ECO-${year}-${hash}`;

        const { data: existing } = await supabase
          .from("eco_dive_ids")
          .select("id")
          .eq("tourist_id", profile.id)
          .single();

        if (existing) {
          const { error: updateError } = await supabase
            .from("eco_dive_ids")
            .update({ status: "complete", eco_id_number: ecoIdNumber })
            .eq("tourist_id", profile.id);
          if (updateError) { setSaveError("Failed to update Eco-Dive ID."); setSaving(false); return; }
        } else {
          const { error: insertError } = await supabase
            .from("eco_dive_ids")
            .insert({ tourist_id: profile.id, eco_id_number: ecoIdNumber, status: "complete" });
          if (insertError) { setSaveError("Failed to create Eco-Dive ID."); setSaving(false); return; }
        }
      }

      await refreshProfile();
      setSaving(false);
      // Route resolves to /(tabs)/eco-dive-id/complete via route-group collapse
      router.push("/eco-dive-id/complete");
    } catch { setSaveError("Something went wrong. Please try again."); setSaving(false); }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Dive Details</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer maxWidth={720}>
          {/* Basic Information */}
          <Text style={styles.sectionLabel}>Basic Information</Text>
        <View style={styles.divider} />

        <Dropdown
          label="Nationality"
          placeholder="e.g Filipino"
          value={nationality}
          options={nationalityOptions}
          onSelect={setNationality}
          error={errors.nationality}
        />

        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <TextInput
              label="Emergency Contact Name"
              placeholder="Juan Dela Cruz"
              value={emergencyName}
              onChangeText={setEmergencyName}
              error={errors.emergencyName}
            />
          </View>
          <View style={styles.twoColItem}>
            <TextInput
              label="Phone Number"
              placeholder="+63 9XXXXXXXXX"
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              keyboardType="phone-pad"
              error={errors.emergencyPhone}
            />
          </View>
        </View>

        {/* Dive Pass */}
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionLabel}>Dive Pass</Text>
        <View style={styles.divider} />

        <Dropdown
          label="Type of Dive Pass"
          placeholder="Select dive pass type"
          value={divePassType}
          options={divePassOptions}
          onSelect={setDivePassType}
          error={errors.divePassType}
        />

        {/* Certification */}
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionLabel}>Certification</Text>
        <View style={styles.divider} />

        <Dropdown
          label="Certification Level"
          placeholder="Select certification level"
          value={certLevel}
          options={certLevelOptions}
          onSelect={setCertLevel}
          error={errors.certLevel}
        />

        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <TextInput
              label="Date Accredited"
              placeholder="YYYY-MM-DD"
              value={dateAccredited}
              onChangeText={setDateAccredited}
              error={errors.dateAccredited}
            />
          </View>
          <View style={styles.twoColItem}>
            <TextInput
              label="Renewal Date"
              placeholder="YYYY-MM-DD"
              value={renewalDate}
              onChangeText={(v) => {
                setRenewalDate(v);
                const rd = new Date(v);
                rd.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setExpiredWarning(rd < today ? "This certification is expired. Please renew as needed." : "");
              }}
              error={errors.renewalDate}
            />
          </View>
        </View>

        {expiredWarning ? <Text style={styles.warningText}>{expiredWarning}</Text> : null}

        {/* Uploads */}
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionLabel}>Uploads</Text>
        <View style={styles.divider} />

        <FileUpload label="Upload Certification" onPress={pickCertFile} fileName={certFile?.name} showCamera />
        {certError ? <Text style={styles.errorText}>{certError}</Text> : null}

        {/* Data Privacy */}
        <View style={styles.sectionSpacer} />
        <Text style={styles.sectionLabel}>Data Privacy</Text>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={agreed ? "checkbox" : "square-outline"}
            size={20}
            color={agreed ? colors.primaryBlue : colors.gray}
          />
          <Text style={styles.checkboxLabel}>
            I consent to the collection and processing of my personal data in accordance with the
            Data Privacy Act of 2012.
          </Text>
        </TouchableOpacity>
        {errors.agreed && <Text style={styles.errorText}>{errors.agreed}</Text>}

        <View style={styles.spacer} />

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <Button title={saving ? "Saving..." : "Save"} onPress={handleSave} disabled={saving} />

        <View style={{ height: 40 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.darkText,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkText,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginBottom: 16,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  twoColItem: {
    flex: 1,
  },
  sectionSpacer: {
    marginTop: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.gray,
    lineHeight: 18,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    marginTop: 4,
  },
  warningText: {
    color: "#92400E",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
  },
  spacer: {
    height: 24,
  },
});
