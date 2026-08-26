import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, TextInput } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";
import { t, Locale } from "../../../lib/i18n";

const PH_MOBILE = /^\+63\s9\d{9}$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [contactNumber, setContactNumber] = useState(profile?.contact_number || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t("required", locale);
    if (contactNumber.trim() && !PH_MOBILE.test(contactNumber.trim())) {
      errs.contactNumber = t("ph_format", locale);
    }
    if (!email.trim()) errs.email = t("required", locale);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const profileChanged =
      fullName !== (profile?.full_name || "") ||
      contactNumber !== (profile?.contact_number || "");

    const emailChanged = email !== (user?.email || "");

    if (profileChanged) {
      const { error } = await updateProfile({
        full_name: fullName.trim(),
        contact_number: contactNumber.trim() || null,
      });
      if (error) {
        setSaving(false);
        Alert.alert(t("error", locale), error);
        return;
      }
    }

    if (emailChanged) {
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) {
        setSaving(false);
        Alert.alert(t("error", locale), error.message);
        return;
      }
      Alert.alert(
        t("verification_sent", locale),
        t("verification_detail", locale)
      );
    }

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("edit_profile_title", locale)}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          label={t("full_name", locale)}
          placeholder="Your full name"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
        />

        <TextInput
          label={t("contact_number", locale)}
          placeholder="+63 9XXXXXXXXX"
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
          error={errors.contactNumber}
        />

        <TextInput
          label={t("email", locale)}
          placeholder="email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={errors.email}
        />

        <View style={styles.notice}>
          <Ionicons name="information-circle-outline" size={16} color={colors.gray} />
          <Text style={styles.noticeText}>
            {t("email_notice", locale)}
          </Text>
        </View>

        <View style={styles.buttonWrap}>
          <Button
            title={saving ? t("saving", locale) : t("save_changes", locale)}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 12, paddingBottom: 20, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.darkText },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    padding: 12,
  },
  noticeText: { fontSize: 12, color: colors.gray, flex: 1, lineHeight: 17 },
  buttonWrap: { marginTop: 8 },
});
