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
import { Button, TextInput, Dropdown, ContentContainer } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
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

export default function DiveDetailsStep1() {
  const router = useRouter();
  const { profile, isLoading, updateProfile, refreshProfile } = useAuth();
  const [nationality, setNationality] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [divePassType, setDivePassType] = useState("");
  const [diveType, setDiveType] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (profile) {
      if (profile.nationality) setNationality(profile.nationality);
      if (profile.emergency_contact_name) setEmergencyName(profile.emergency_contact_name);
      if (profile.emergency_contact_number) setEmergencyPhone(profile.emergency_contact_number);
      if (profile.dive_pass_type) setDivePassType(profile.dive_pass_type);
      if (profile.type_of_dive) setDiveType(profile.type_of_dive);
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
    if (!diveType) errs.diveType = "Required";
    if (!agreed) errs.agreed = "You must agree to continue";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");
    try {
      const { error } = await updateProfile({
        nationality,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_number: emergencyPhone.trim(),
        dive_pass_type: divePassType,
        type_of_dive: diveType,
      });
      if (error) { setSaveError(error); setSaving(false); return; }
      if (diveType === "intro-fun") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("eco_dive_ids").upsert({
            tourist_id: user.id,
            status: "complete",
            eco_id_number: `ECO-${new Date().getFullYear()}-${Date.now()}`,
            updated_at: new Date().toISOString(),
          }, { onConflict: "tourist_id" });
        }
      }
      await refreshProfile();
      setSaving(false);
      if (diveType === "certified") {
        router.push("/tourist/dive-details/step2");
      } else {
        router.push("/(tabs)/eco-dive-id");
      }
    } catch { setSaveError("Failed to save. Please try again."); setSaving(false); }
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
        <Text style={styles.sectionLabel}>Dive Pass & Type</Text>
        <View style={styles.divider} />

        <Dropdown
          label="Type of Dive Pass"
          placeholder="Select dive pass type"
          value={divePassType}
          options={divePassOptions}
          onSelect={setDivePassType}
          error={errors.divePassType}
        />

        <Dropdown
          label="Type of Dive"
          placeholder="Select dive type"
          value={diveType}
          options={diveTypeOptions}
          onSelect={setDiveType}
          error={errors.diveType}
        />

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

        <Button title={saving ? "Saving..." : "Continue"} onPress={handleContinue} disabled={saving} />

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
  spacer: {
    height: 24,
  },
});
