import { Ionicons } from "@expo/vector-icons";
import { pickAvatarImage } from "../../../lib/pickAvatar";
import { uploadFile } from "../../../lib/storage";
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
import { Button, ContentContainer, Dropdown, TextInput } from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { showAlert } from "../../../lib/confirm";
import { Locale, t } from "../../../lib/i18n";
import { supabase } from "../../../lib/supabase";
import { toLocalPhDigits, toDbPhPhone, isValidPhDigits } from "../../../lib/phone";

const sexOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, avatarUri, setAvatarUri, clearAvatarOverride, updateProfile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [contactNumber, setContactNumber] = useState(
    toLocalPhDigits(profile?.contact_number || ""),
  );
  const [email, setEmail] = useState(user?.email || "");
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "");
  const [sex, setSex] = useState<string>(profile?.sex || "");
  const [pcssdNo, setPcssdNo] = useState(profile?.pcssd_accreditation_no || "");
  const [permitNo, setPermitNo] = useState(profile?.permit_to_operate_no || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingAvatar, setPendingAvatar] = useState<{
    uri: string;
    blob?: Blob | null;
    removed?: boolean;
  } | null>(null);

  const currentAvatar = pendingAvatar
    ? pendingAvatar.removed
      ? null
      : pendingAvatar.uri
    : avatarUri;

  const handlePickPhoto = useCallback(async () => {
    const result = await pickAvatarImage();
    if (!result) return;
    if (!result.ok) {
      showAlert(t("error", locale), result.error);
      return;
    }
    setPendingAvatar({ uri: result.uri, blob: result.blob, removed: false });
    setAvatarUri(result.uri, result.blob);
  }, [setAvatarUri, locale]);

  const handleRemovePhoto = useCallback(() => {
    setPendingAvatar({ uri: "", removed: true });
    setAvatarUri(null);
  }, [setAvatarUri]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t("required", locale);
    if (contactNumber.trim() && !isValidPhDigits(contactNumber)) {
      errs.contactNumber = t("ph_format", locale);
    }
    if (!email.trim()) errs.email = t("required", locale);
    if (age.trim()) {
      const parsedAge = parseInt(age.trim(), 10);
      if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 120) {
        errs.age = "Enter valid age (1-120)";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const parsedAge = age.trim() ? parseInt(age.trim(), 10) : null;
    const dbContactNumber = toDbPhPhone(contactNumber);
    const profileChanged =
      fullName !== (profile?.full_name || "") ||
      dbContactNumber !== (profile?.contact_number || null) ||
      parsedAge !== (profile?.age ?? null) ||
      (sex || null) !== (profile?.sex ?? null) ||
      pcssdNo.trim() !== (profile?.pcssd_accreditation_no || "") ||
      permitNo.trim() !== (profile?.permit_to_operate_no || "");

    const emailChanged = email !== (user?.email || "");

    const avatarChanged = pendingAvatar !== null;
    if (profileChanged || avatarChanged) {
      let avatarPathToSave: string | null | undefined = undefined;
      if (pendingAvatar?.removed) {
        avatarPathToSave = null;
      } else if (pendingAvatar?.uri && user) {
        const fileInfo = {
          name: `avatar_${Date.now()}.jpg`,
          mimeType: pendingAvatar.blob?.type || "image/jpeg",
          size: pendingAvatar.blob?.size || 1024,
          uri: pendingAvatar.uri,
        };
        const uploadRes = await uploadFile("operator_media", "profile-avatar", fileInfo, user.id);
        if (uploadRes.error || !uploadRes.path) {
          setSaving(false);
          showAlert(t("error", locale), uploadRes.error || "Failed to upload profile photo.");
          return;
        }
        avatarPathToSave = uploadRes.path;
      }

      const updates: any = {
        full_name: fullName.trim(),
        contact_number: dbContactNumber,
        age: parsedAge,
        sex: sex || null,
        pcssd_accreditation_no: pcssdNo.trim() || null,
        permit_to_operate_no: permitNo.trim() || null,
      };
      if (avatarPathToSave !== undefined) {
        updates.avatar_path = avatarPathToSave;
      }

      const { error } = await updateProfile(updates);
      if (error) {
        setSaving(false);
        showAlert(t("error", locale), error);
        return;
      }
      if (avatarPathToSave !== undefined) {
        if (pendingAvatar?.removed) {
          setAvatarUri(null);
        } else {
          clearAvatarOverride(user?.id);
        }
      } else {
        clearAvatarOverride(user?.id);
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
              {currentAvatar ? (
                <Image
                  source={{ uri: currentAvatar }}
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
                    {currentAvatar ? "Change Photo" : "Upload Photo"}
                  </Text>
                </TouchableOpacity>

                {Boolean(currentAvatar) && (
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={handleRemovePhoto}
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
              placeholder="9XXXXXXXXX"
              prefix="+63"
              maxLength={10}
              value={contactNumber}
              onChangeText={(val) => setContactNumber(toLocalPhDigits(val))}
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

            {/* Age & Sex Row */}
            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <TextInput
                  label="Age"
                  placeholder="e.g. 28"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  error={errors.age}
                />
              </View>
              <View style={styles.colHalf}>
                <Dropdown
                  label="Sex"
                  placeholder="Select"
                  value={sex}
                  options={sexOptions}
                  onSelect={setSex}
                  error={errors.sex}
                />
              </View>
            </View>

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

          {/* Guiding Accreditations Card (for certified divers / dive professionals) */}
          {(profile?.type_of_dive === "certified" || profile?.certification_level === "dive-master" || profile?.certification_level === "instructor") ? (
            <View style={styles.formCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.primaryBlue} />
                <Text style={styles.cardSectionTitle}>Guiding Accreditations</Text>
              </View>
              <Text style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>
                Accreditation details used when operators add you as a Dive Master / Instructor on dive manifests.
              </Text>

              <TextInput
                label="PCSSD Accreditation Number"
                placeholder="e.g. PCSSD-DM-2024-XXXX"
                value={pcssdNo}
                onChangeText={setPcssdNo}
              />

              <TextInput
                label="Permit to Operate Number"
                placeholder="e.g. PTO-PG-2024-XXXX"
                value={permitNo}
                onChangeText={setPermitNo}
              />
            </View>
          ) : null}

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
  twoColRow: {
    flexDirection: "row",
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  buttonWrap: {
    marginTop: 2,
  },
});
