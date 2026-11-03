import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, ContentContainer, TextInput } from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { showAlert } from "../../../lib/confirm";
import { Locale, t } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";

const PH_MOBILE = /^\+63\s9\d{9}$/;

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, avatarUri, setAvatarUri, updateProfile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [contactNumber, setContactNumber] = useState(
    profile?.contact_number || "",
  );
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickPhoto = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png", "image/webp"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      // Ignore picker cancel
    }
  }, [setAvatarUri]);

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
        showAlert(t("error", locale), error);
        return;
      }
    }

    if (emailChanged) {
      const { error } = await supabase.auth.updateUser({
        email: email.trim(),
      });
      if (error) {
        setSaving(false);
        showAlert(t("error", locale), error.message);
        return;
      }
      showAlert(
        t("verification_sent", locale),
        t("verification_detail", locale),
      );
    }

    setSaving(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={560} paddingH={16}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.darkText} />
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>
                {t("edit_profile_title", locale)}
              </Text>
              <Text style={styles.headerSubtitle}>
                Update your personal info &amp; Eco-Dive ID photo.
              </Text>
            </View>
          </View>

          {/* Shared Profile & ID Card Photo Card */}
          <View style={styles.photoCard}>
            <TouchableOpacity
              style={styles.photoAvatarBox}
              onPress={handlePickPhoto}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Upload profile and Eco-Dive ID photo"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.photoAvatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.photoAvatarFallback}>
                  <Ionicons name="person" size={38} color={colors.white} />
                </View>
              )}
              <View style={styles.photoCameraBadge}>
                <Ionicons name="camera" size={14} color={colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.photoInfoCol}>
              <Text style={styles.photoCardTitle}>
                Profile &amp; Eco-Dive ID Photo
              </Text>
              <Text style={styles.photoCardDesc}>
                This photo appears on both your profile and your digital
                SINSAY Eco-Dive ID Card.
              </Text>
              <View style={styles.photoActionRow}>
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={handlePickPhoto}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="image-outline"
                    size={14}
                    color={colors.primaryBlue}
                  />
                  <Text style={styles.changePhotoBtnText}>
                    {avatarUri ? "Change Photo" : "Upload Photo"}
                  </Text>
                </TouchableOpacity>

                {avatarUri && (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setAvatarUri(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removePhotoText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Personal Information Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.cardSectionTitle}>Personal Information</Text>

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
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.primaryBlue}
              />
              <Text style={styles.noticeText}>
                {t("email_notice", locale)}
              </Text>
            </View>
          </View>

          {/* Quick Link to Dive Pass & Certification Details */}
          <TouchableOpacity
            style={styles.diveDetailsLinkCard}
            onPress={() => router.push("/tourist/dive-details/step1")}
            activeOpacity={0.82}
          >
            <View style={styles.diveDetailsIconWrap}>
              <Ionicons
                name="id-card-outline"
                size={20}
                color={colors.primaryBlue}
              />
            </View>
            <View style={styles.diveDetailsTextCol}>
              <Text style={styles.diveDetailsTitle}>
                Edit Dive Pass &amp; Certification Details
              </Text>
              <Text style={styles.diveDetailsSub}>
                Update nationality, emergency contact, pass type &amp; cert level
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.primaryBlue}
            />
          </TouchableOpacity>

          <View style={styles.buttonWrap}>
            <Button
              title={saving ? t("saving", locale) : t("save_changes", locale)}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FAFF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 1,
  },
  photoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  photoAvatarBox: {
    width: 78,
    height: 86,
    borderRadius: 16,
    position: "relative",
    flexShrink: 0,
  },
  photoAvatarImg: {
    width: 78,
    height: 86,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  photoAvatarFallback: {
    width: 78,
    height: 86,
    borderRadius: 16,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  photoCameraBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryBlue,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  photoInfoCol: {
    flex: 1,
    gap: 4,
  },
  photoCardTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  photoCardDesc: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    lineHeight: 16,
  },
  photoActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changePhotoBtnText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  removePhotoBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  removePhotoText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.red,
  },
  formCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    marginBottom: 2,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#DCEBFA",
    borderRadius: 12,
    padding: 12,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    flex: 1,
    lineHeight: 17,
  },
  diveDetailsLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  diveDetailsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  diveDetailsTextCol: {
    flex: 1,
    gap: 2,
  },
  diveDetailsTitle: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  diveDetailsSub: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  buttonWrap: {
    marginTop: 2,
  },
});
