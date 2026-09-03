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
import { uploadFile } from "../../../lib/storage";

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
  const [businessPermitUrl, setBusinessPermitUrl] = useState<string | null>(null);
  const [pcssUrl, setPcssUrl] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState<"permit" | "pcss" | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/loginpage");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !operatorApplication) return;
    if (operatorApplication.status === "approved") {
      router.replace("/profile");
    }
  }, [authLoading, operatorApplication, router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!resortName.trim()) errs.resortName = "Required";
    if (!resortLocation.trim()) errs.resortLocation = "Required";
    if (!role) errs.role = "Required";
    if (!contactNumber.trim()) errs.contactNumber = "Required";
    if (!businessPermitUrl) errs.businessPermitUrl = "Upload required";
    if (!pcssUrl) errs.pcssUrl = "Upload required";
    if (!confirmed) errs.confirmed = "You must confirm to proceed";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUploadFile = async (file: File | { name: string; mimeType?: string; size?: number; uri: string }, bucket: string, folder: string) => {
    const uid = user?.id;
    if (!uid) return;
    const { path, error } = await uploadFile(bucket, folder, file, uid);
    if (error) {
      console.warn(error);
      return null;
    }
    return path;
  };

  const handleUploadPermit = async (file: File | { name: string; mimeType?: string; size?: number; uri: string }) => {
    setUploading("permit");
    const url = await handleUploadFile(file, "operator_uploads", "permits");
    if (url) setBusinessPermitUrl(url);
    setUploading(null);
  };

  const handleUploadPcss = async (file: File | { name: string; mimeType?: string; size?: number; uri: string }) => {
    setUploading("pcss");
    const url = await handleUploadFile(file, "operator_uploads", "pcss");
    if (url) setPcssUrl(url);
    setUploading(null);
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;
    setSaving(true);

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
      return;
    }
    setSubmitted(true);
  };

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
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
            You have already submitted an application to register{' '}
            {operatorApplication.resort_name} as a dive establishment. The Tourism
            Office is reviewing your documents.
          </Text>
          <Text style={styles.confirmSubtext}>
            You'll receive a notification once your application is approved or
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
            Your application to register {resortName} as a dive establishment has
            been submitted. The Tourism Office will review your documents and
            verify your information.
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Resort Operator Application</Text>
          <Text style={styles.subtitle}>
            Manage dive manifests, handle resort guests, and coordinate with the
            Tourism Office.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer maxWidth={720}>
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

        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <Dropdown
              label="Role"
              placeholder="Select"
              value={role}
              options={roleOptions}
              onSelect={setRole}
              error={errors.role}
            />
          </View>
          <View style={styles.twoColItem}>
            <TextInput
              label="Contact Number"
              placeholder="+63 9XXXXXXXXX"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              error={errors.contactNumber}
            />
          </View>
        </View>

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

        {/* Document uploads */}
        <View style={styles.twoCol}>
          <View style={styles.twoColItem}>
            <Text style={styles.uploadLabel}>Business Permit</Text>
            <FileUpload
              label="Upload Here"
              onFileSelect={handleUploadPermit}
              fileName={businessPermitUrl ? "Uploaded" : undefined}
              showCamera
            />
            {errors.businessPermitUrl && (
              <Text style={styles.errorText}>{errors.businessPermitUrl}</Text>
            )}
          </View>
          <View style={styles.twoColItem}>
            <Text style={styles.uploadLabel}>PCSS Accreditation</Text>
            <FileUpload
              label="Upload Here"
              onFileSelect={handleUploadPcss}
              fileName={pcssUrl ? "Uploaded" : undefined}
              showCamera
            />
            {errors.pcssUrl && (
              <Text style={styles.errorText}>{errors.pcssUrl}</Text>
            )}
          </View>
        </View>

        {/* Confirmation */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            I confirm that the information provided is accurate and that I am
            authorized to represent the resort.
          </Text>
        </TouchableOpacity>
        {errors.confirmed && <Text style={styles.errorText}>{errors.confirmed}</Text>}

        {/* Submit */}
        <View style={styles.buttonWrap}>
          <Button
            title={saving ? "Submitting..." : "Submit Application"}
            onPress={handleSubmit}
            disabled={saving || uploading !== null}
          />
        </View>

        <View style={{ height: 40 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 20, gap: 16 },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerText: { gap: 4 },
  title: { fontSize: 20, fontWeight: "700", color: colors.darkText },
  subtitle: { fontSize: 12, color: colors.gray, lineHeight: 17 },
  twoCol: { flexDirection: "row", gap: 10 },
  twoColItem: { flex: 1 },
  uploadLabel: { fontSize: 13, fontWeight: "600", color: colors.darkText, marginBottom: 6 },
  uploadChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: colors.cardBorder, borderStyle: "dashed",
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12,
    backgroundColor: colors.cardBg,
  },
  uploadChipError: { borderColor: colors.red },
  uploadChipText: { fontSize: 12, color: colors.primaryBlue, fontWeight: "500" },
  uploadChipDone: { color: colors.green },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.inputBorder, alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  checkboxChecked: { backgroundColor: colors.primaryBlue, borderColor: colors.primaryBlue },
  checkboxLabel: { fontSize: 13, color: colors.darkText, lineHeight: 18, flex: 1 },
  errorText: { fontSize: 11, color: colors.red },
  buttonWrap: { marginTop: 8 },
  confirmContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  confirmIcon: { marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: "700", color: colors.darkText, marginBottom: 12 },
  confirmText: { fontSize: 14, color: colors.darkText, textAlign: "center", lineHeight: 20, marginBottom: 8 },
  confirmSubtext: { fontSize: 12, color: colors.gray, textAlign: "center", lineHeight: 17, marginBottom: 32 },
  confirmButtonWrap: { width: "100%" },
});
