import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ConfirmModal from "../../../components/ConfirmModal";
import ContentContainer from "../../../components/ContentContainer";
import { colors } from "../../../constants/colors";
import { usePWAInstall } from "../../../context/PWAContext";
import { useAuth } from "../../../hooks/useAuth";
import { Locale, t } from "../../../lib/i18n";

interface ProfileRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
}

function ProfileRow({
  icon,
  label,
  subtitle,
  onPress,
  destructive,
}: ProfileRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons
          name={icon}
          size={19}
          color={destructive ? colors.red : colors.primaryBlue}
        />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}
        >
          {label}
        </Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={17} color="#94A3B8" />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    profile,
    avatarUri,
    operatorApplication,
    isOperator,
    signOut,
    isLoading,
    updateProfile,
    setViewAsTourist,
    viewAsTourist,
  } = useAuth();
  const { isInstalled, promptInstall } = usePWAInstall();
  const locale: Locale = (profile?.language_preference as Locale) || "en";
  const [returnToOperator, setReturnToOperator] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Return leg of tourist-view: navigate after the flag clears so
  // TouristGate doesn't bounce us back to /(tabs) on a stale read.
  useEffect(() => {
    if (returnToOperator && !viewAsTourist && isOperator) {
      setReturnToOperator(false);
      router.replace("/(operator-tabs)");
    }
  }, [returnToOperator, viewAsTourist, isOperator, router]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      router.replace("/loginpage");
    }
  };

  if (isLoading) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={560} paddingH={16}>
          {/* Screen Header matching Eco-Dive ID */}
          <View style={styles.screenHeader}>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>
                {t("profile_title", locale)}
              </Text>
              <Text style={styles.headerSubtitle}>
                Manage your diver identity &amp; account preferences.
              </Text>
            </View>
          </View>

          {/* Profile Identity Card */}
          <View style={styles.profileCard}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => router.push("/profile/edit-profile")}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Edit profile photo"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={28} color={colors.white} />
                </View>
              )}
              <View style={styles.avatarCameraBadge}>
                <Ionicons name="camera" size={11} color={colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile?.full_name || user?.email || "Diver"}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email || ""}
              </Text>
              <View style={styles.syncedIdBadge}>
                <Ionicons
                  name="id-card-outline"
                  size={12}
                  color={colors.primaryBlue}
                />
                <Text style={styles.syncedIdBadgeText}>
                  Synced with Eco-Dive ID
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editPill}
              onPress={() => router.push("/profile/edit-profile")}
              activeOpacity={0.85}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={colors.primaryBlue}
              />
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Operator status */}
          {operatorApplication && (
            <>
              <Text style={styles.sectionLabel}>
                {t("operator_title", locale)}
              </Text>
              <View style={[styles.sectionCard, { marginBottom: 8 }]}>
                <ProfileRow
                  icon={
                    operatorApplication.status === "approved"
                      ? "checkmark-circle"
                      : operatorApplication.status === "rejected"
                        ? "close-circle"
                        : "time-outline"
                  }
                  label={
                    operatorApplication.status === "approved"
                      ? t("operator_approved", locale)
                      : operatorApplication.status === "rejected"
                        ? t("operator_rejected", locale)
                        : t("operator_pending", locale)
                  }
                  subtitle={
                    operatorApplication.status === "approved"
                      ? t("operator_approved_sub", locale)
                      : operatorApplication.status === "rejected"
                        ? operatorApplication.rejection_reason ||
                          t("operator_rejected_sub", locale)
                        : t("operator_pending_sub", locale)
                  }
                  onPress={() => {
                    if (isOperator) {
                      setReturnToOperator(true);
                      setViewAsTourist(false);
                    }
                  }}
                />
              </View>
            </>
          )}

          {/* Account section */}
          <Text style={styles.sectionLabel}>{t("account", locale)}</Text>
          <View style={styles.sectionCard}>
            <ProfileRow
              icon="settings-outline"
              label={t("my_account", locale)}
              subtitle={t("my_account_sub", locale)}
              onPress={() => router.push("/profile/edit-profile")}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="id-card-outline"
              label="Dive Pass & Certification"
              subtitle="Update nationality, emergency contact & dive type"
              onPress={() => router.push("/tourist/dive-details/step1")}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="language-outline"
              label={t("language", locale)}
              subtitle={
                profile?.language_preference === "fil"
                  ? t("language_fil", locale)
                  : t("language_en", locale)
              }
              onPress={() => {
                const next =
                  profile?.language_preference === "fil" ? "en" : "fil";
                updateProfile({ language_preference: next } as any);
              }}
            />
            {!isOperator && (
              <>
                <View style={styles.divider} />
                <ProfileRow
                  icon="business-outline"
                  label={
                    !operatorApplication
                      ? t("apply_operator", locale)
                      : operatorApplication.status === "pending"
                        ? t("app_pending", locale)
                        : t("app_rejected", locale)
                  }
                  subtitle={
                    !operatorApplication
                      ? t("apply_operator_sub", locale)
                      : operatorApplication.status === "pending"
                        ? t("app_pending_sub", locale)
                        : t("app_rejected_sub", locale)
                  }
                  onPress={() => {
                    if (
                      !operatorApplication ||
                      operatorApplication.status === "rejected"
                    ) {
                      router.push("/profile/apply-operator");
                    }
                  }}
                />
              </>
            )}
            <View style={styles.divider} />
            <ProfileRow
              icon="log-out-outline"
              label={t("log_out", locale)}
              subtitle={t("log_out_sub", locale)}
              onPress={() => setShowLogoutModal(true)}
              destructive
            />
          </View>

          {/* More section */}
          <Text style={styles.sectionLabel}>{t("more", locale)}</Text>
          <View style={styles.sectionCard}>
            <ProfileRow
              icon="download-outline"
              label={isInstalled ? "App Installed" : "Install SINSAY App"}
              subtitle={
                isInstalled
                  ? "Running on this device"
                  : "Add to home screen for fast & offline access"
              }
              onPress={() => promptInstall()}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="help-circle-outline"
              label={t("help_support", locale)}
              subtitle={t("help_support_sub", locale)}
              onPress={() => router.push("/profile/help")}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="document-text-outline"
              label={t("faq", locale)}
              subtitle={t("faq_sub", locale)}
              onPress={() => router.push("/profile/faq")}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="shield-checkmark-outline"
              label={t("privacy_policy", locale)}
              subtitle={t("privacy_policy_sub", locale)}
              onPress={() => router.push("/privacy")}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="reader-outline"
              label={t("terms_service", locale)}
              subtitle={t("terms_service_sub", locale)}
              onPress={() => router.push("/terms")}
            />
          </View>
        </ContentContainer>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title={t("logout_confirm_title", locale)}
        message={t("logout_confirm_message", locale)}
        cancelText={t("cancel", locale)}
        confirmText={t("confirm", locale)}
        icon="log-out-outline"
        destructive
        isLoading={isLoggingOut}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
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
    paddingBottom: 18,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    position: "relative",
    flexShrink: 0,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCameraBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryBlue,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    fontSize: 16.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  syncedIdBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginTop: 3,
  },
  syncedIdBadgeText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "#EBF3FF",
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  editPillText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#64748B",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDestructive: {
    backgroundColor: "#FEE2E2",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  rowLabelDestructive: {
    color: colors.red,
  },
  rowSubtitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#EBF2FA",
    marginLeft: 66,
  },
});
