import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { t, Locale } from "../../../lib/i18n";
import ContentContainer from "../../../components/ContentContainer";

interface ProfileRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
}

function ProfileRow({ icon, label, subtitle, onPress, destructive }: ProfileRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons name={icon} size={20} color={destructive ? colors.red : colors.primaryBlue} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray} />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, operatorApplication, isOperator, signOut, isLoading, updateProfile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const handleLogout = () => {
    Alert.alert(t("logout_confirm_title", locale), t("logout_confirm_message", locale), [
      { text: t("cancel", locale), style: "cancel" },
      { text: t("confirm", locale), style: "destructive", onPress: async () => {
        await signOut();
        router.replace("/loginpage");
      }},
    ]);
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
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
        {/* Header */}
        <Text style={styles.headerTitle}>{t("profile_title", locale)}</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || user?.email || "Diver"}</Text>
            <Text style={styles.profileEmail}>{user?.email || ""}</Text>
          </View>
          <TouchableOpacity style={styles.editPill} onPress={() => router.push("/profile/edit-profile")}>
            <Text style={styles.editPillText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Operator status */}
        {operatorApplication && (
          <>
            <Text style={styles.sectionLabel}>{t("operator_title", locale)}</Text>
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
                    ? t("operator_rejected_sub", locale)
                    : t("operator_pending_sub", locale)
                }
                onPress={() => {
                  if (isOperator) router.replace("/(operator-tabs)");
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
            icon="language-outline"
            label={t("language", locale)}
            subtitle={
              profile?.language_preference === "fil" ? t("language_fil", locale) : t("language_en", locale)
            }
            onPress={() => {
              const next = profile?.language_preference === "fil" ? "en" : "fil";
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
                  if (!operatorApplication || operatorApplication.status === "rejected") {
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
            onPress={handleLogout}
            destructive
          />
        </View>

        {/* More section */}
        <Text style={styles.sectionLabel}>{t("more", locale)}</Text>
        <View style={styles.sectionCard}>
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
        </View>

        <View style={{ height: 120 }} />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 20,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF2FF",
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.darkText,
  },
  profileEmail: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  editPill: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  editPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryBlue,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.gray,
    marginTop: 24,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EBF2FF",
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
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkText,
  },
  rowLabelDestructive: {
    color: colors.red,
  },
  rowSubtitle: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginLeft: 64,
  },
});
