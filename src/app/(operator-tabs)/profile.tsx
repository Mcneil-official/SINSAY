import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { ConfirmModal, ContentContainer } from "../../components";
import { colors } from "../../constants/colors";
import { usePWAInstall } from "../../context/PWAContext";
import { useAuth } from "../../hooks/useAuth";
import { showAlert } from "../../lib/confirm";
import { supabase } from "../../lib/supabase";

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
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
        <Ionicons
          name={icon}
          size={20}
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
      <Ionicons name="chevron-forward" size={18} color={colors.gray} />
    </TouchableOpacity>
  );
}

const PCSSD_LOGO = require("../../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../../assets/logo-dot.png");

export default function OperatorProfileScreen() {
  const {
    user,
    profile,
    operatorApplication,
    avatarUri,
    signOut,
    isLoading,
    setViewAsTourist,
    viewAsTourist,
  } = useAuth();
  const { isInstalled, promptInstall } = usePWAInstall();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasPcssd = Boolean(
    (operatorApplication?.pcssd_url &&
      operatorApplication.pcssd_url.trim().length > 0) ||
    (operatorApplication?.pcss_url &&
      operatorApplication.pcss_url.trim().length > 0),
  );
  const hasDot = Boolean(
    operatorApplication?.dot_url &&
    operatorApplication.dot_url.trim().length > 0,
  );
  const contactLinks: {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    url: string;
  }[] = [];
  if (operatorApplication?.contact_number)
    contactLinks.push({
      icon: "call-outline",
      value: operatorApplication.contact_number,
      url: `tel:${operatorApplication.contact_number}`,
    });
  if (operatorApplication?.resort_email)
    contactLinks.push({
      icon: "mail-outline",
      value: operatorApplication.resort_email,
      url: `mailto:${operatorApplication.resort_email}`,
    });
  if (operatorApplication?.website_url)
    contactLinks.push({
      icon: "globe-outline",
      value: operatorApplication.website_url,
      url: operatorApplication.website_url,
    });
  if (operatorApplication?.facebook_url)
    contactLinks.push({
      icon: "logo-facebook",
      value: operatorApplication.facebook_url,
      url: operatorApplication.facebook_url,
    });

  // Navigate only after the flag propagates so OperatorGate sees the new
  // value (avoids the set-then-replace race that bounced back on slow devices).
  useEffect(() => {
    if (viewAsTourist) router.replace("/(tabs)");
  }, [viewAsTourist, router]);

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
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ActivityIndicator
          size="large"
          color={colors.primaryBlue}
          style={{ marginTop: 40 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.headerBackground,
          { top: -insets.top, height: 260 + insets.top },
        ]}
        pointerEvents="none"
      >
        <Svg
          width="100%"
          height={260 + insets.top}
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient
              id="operatorProfileTopGrad"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0" stopColor="#0061f5" />
              <Stop offset="0.3" stopColor="#208bff" />
              <Stop offset="0.6" stopColor="#97ddfa" />
              <Stop offset="0.85" stopColor="#e4f5ff" />
              <Stop offset="1" stopColor="#f1f9ff" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height={270 + insets.top}
            fill="url(#operatorProfileTopGrad)"
          />
        </Svg>
        <Svg
          viewBox="0 0 1024 496"
          preserveAspectRatio="none"
          style={[styles.headerWaveSvg, { height: 220 + insets.top }]}
        >
          <Path
            d="M0 296C170 226 320 396 490 258 C700 86 791 90 878 85C951 77 1000 34 1024 0 V496H0Z"
            fill="#FFFFFF"
            opacity={0.16}
          />
        </Svg>
      </View>
      <View style={styles.fixedProfileHeader}>
        <ContentContainer maxWidth={720}>
          <View style={styles.profileTopSection}>
            <View style={styles.pageHeading}>
              <Text style={styles.eyebrow}>OPERATOR ACCOUNT</Text>
              <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <View style={styles.identityCard}>
              <View style={styles.identityTitleRow}>
                <View style={styles.identityAvatar}>
                  {profile?.avatar_path || avatarUri ? (
                    <Image
                      source={{
                        uri: profile?.avatar_path
                          ? supabase.storage
                              .from("operator_media")
                              .getPublicUrl(profile.avatar_path).data.publicUrl
                          : avatarUri || undefined,
                      }}
                      style={styles.identityAvatarImage}
                    />
                  ) : (
                    <Ionicons name="business" size={29} color="#087BFF" />
                  )}
                </View>
                <View style={styles.identityText}>
                  <View style={styles.identityNameRow}>
                    <Text style={styles.profileName}>
                      {operatorApplication?.resort_name || "Your dive resort"}
                    </Text>
                    <View style={styles.verifiedMark}>
                      <Ionicons
                        name="checkmark-circle"
                        size={15}
                        color="#0D9B74"
                      />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#087BFF"
                    />
                    <Text style={styles.profileEmail}>
                      {operatorApplication?.resort_location ||
                        "Add your resort location"}
                    </Text>
                  </View>
                  {hasPcssd || hasDot ? (
                    <View style={styles.accreditationsRow}>
                      {hasPcssd ? (
                        <View style={styles.accreditationChip}>
                          <Image
                            source={PCSSD_LOGO}
                            style={styles.accreditationChipLogo}
                            resizeMode="contain"
                          />
                          <Text style={styles.accreditationChipText}>
                            PCSSD Accredited
                          </Text>
                        </View>
                      ) : null}
                      {hasDot ? (
                        <View style={styles.accreditationChip}>
                          <Image
                            source={DOT_LOGO}
                            style={styles.accreditationChipLogo}
                            resizeMode="contain"
                          />
                          <Text style={styles.accreditationChipText}>
                            DOT Accredited
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => router.push("/operator-profile-edit")}
              >
                <Ionicons name="create-outline" size={17} color="#fff" />
                <Text style={styles.editProfileText}>Edit resort profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ContentContainer>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <ContentContainer maxWidth={720}>
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color="#087BFF"
                />
              </View>
              <View>
                <Text style={styles.sectionCardTitle}>About the resort</Text>
                <Text style={styles.sectionCardSubtitle}>
                  A short introduction for divers
                </Text>
              </View>
            </View>
            <Text style={styles.resortDescription}>
              {operatorApplication?.resort_description ||
                "Add a resort description so divers can learn more about your place."}
            </Text>
            {!operatorApplication?.resort_description ? (
              <TouchableOpacity
                onPress={() => router.push("/operator-profile-edit")}
              >
                <Text style={styles.inlineAction}>Add description</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.sectionCardHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={18}
                  color="#087BFF"
                />
              </View>
              <View>
                <Text style={styles.sectionCardTitle}>Contact & links</Text>
                <Text style={styles.sectionCardSubtitle}>
                  Ways to reach your resort
                </Text>
              </View>
            </View>
            {contactLinks.length ? (
              contactLinks.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(item.url)}
                >
                  <View style={styles.contactIcon}>
                    <Ionicons name={item.icon} size={16} color="#087BFF" />
                  </View>
                  <Text style={styles.contactDetail} numberOfLines={1}>
                    {item.value}
                  </Text>
                  <Ionicons name="open-outline" size={15} color="#8AA0B5" />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyContact}>
                Add a phone, email, website, or Facebook link.
              </Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>APP EXPERIENCE</Text>
          <View style={styles.sectionCard}>
            <ProfileRow
              icon="people-outline"
              label="Switch to Tourist View"
              subtitle="Browse the app as a diver"
              onPress={() => {
                setViewAsTourist(true);
              }}
            />
          </View>

          <Text style={styles.sectionLabel}>ACCOUNT & SUPPORT</Text>
          <View style={styles.sectionCard}>
            <Text style={styles.accountSummary}>
              Signed in as {profile?.full_name || "Operator"}
            </Text>
            <Text style={styles.accountEmail}>{user?.email || ""}</Text>
            <ProfileRow
              icon="settings-outline"
              label="My Account"
              subtitle="Manage resort and account details"
              onPress={() => router.push("/operator-profile-edit")}
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="log-out-outline"
              label="Log out"
              subtitle="Secure your account"
              onPress={() => setShowLogoutModal(true)}
              destructive
            />
          </View>

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
              label="Help & Support"
              subtitle="Get help"
              onPress={() =>
                showAlert(
                  "Help & Support",
                  "Operator help is coming soon. Contact tourism@sinsay.gov.ph for assistance.",
                )
              }
            />
            <View style={styles.divider} />
            <ProfileRow
              icon="document-text-outline"
              label="FAQ"
              subtitle="Frequently asked questions"
              onPress={() => showAlert("FAQ", "Operator FAQ is coming soon.")}
            />
          </View>
        </ContentContainer>
      </ScrollView>

      <ConfirmModal
        visible={showLogoutModal}
        title="Log out"
        message="Are you sure you want to log out?"
        cancelText="Cancel"
        confirmText="Log out"
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
  safeArea: { flex: 1, backgroundColor: "#f1f9ff", paddingBottom: 0 },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 270,
    overflow: "hidden",
    zIndex: -1,
  },
  headerWaveSvg: {
    position: "absolute",
    top: 10,
    left: 0,
    width: "100%",
    height: 200,
  },
  container: { flex: 1, minHeight: 0 },
  fixedProfileHeader: { flexShrink: 0, paddingTop: 12 },
  scrollContent: { paddingBottom: 20 },
  profileTopSection: { position: "relative" },
  pageHeading: { marginTop: 8, marginBottom: 16 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    lineHeight: 14,
    color: "rgba(255,255,255,0.82)",
    fontFamily: "Quicksand_700Bold",
  },
  headerTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    marginTop: 2,
  },
  accreditationsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  accreditationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4.5,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 7.5,
  },
  accreditationChipLogo: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
  },
  accreditationChipText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: "#1E40AF",
  },
  identityCard: {
    marginTop: 0,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e4effa",
    borderRadius: 20,
    padding: 15,
    shadowColor: "#07156c",
    shadowOpacity: 0.1,
    shadowRadius: 11,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  identityTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  identityAvatar: {
    width: 62,
    height: 62,
    flexShrink: 0,
    borderRadius: 31,
    borderWidth: 3,
    borderColor: "#e7f3ff",
    backgroundColor: "#edf6ff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  identityAvatarImage: { width: "100%", height: "100%" },
  identityText: { flex: 1, minWidth: 0 },
  identityNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 7,
    rowGap: 3,
  },
  profileName: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 5,
  },
  profileEmail: {
    flex: 1,
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Quicksand_600SemiBold",
    color: "#647797",
    marginTop: 1,
  },
  verifiedMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#e7f8f1",
  },
  verifiedText: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#0D8C6A",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 45,
    borderRadius: 13,
    backgroundColor: "#087BFF",
    marginTop: 14,
  },
  editProfileText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#fff",
  },
  resortDescription: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: "Quicksand_500Medium",
    color: "#526789",
    marginTop: 13,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "#e5eff9",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#07156c",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  sectionCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    paddingBottom: 9,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f3ff",
  },
  sectionCardTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  sectionCardSubtitle: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#7183a4",
    marginTop: 2,
  },
  inlineAction: {
    color: "#087BFF",
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    marginHorizontal: 15,
    marginBottom: 14,
  },
  contactDetail: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#315b92",
  },
  emptyContact: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#7183a4",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    gap: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "#edf3fa",
  },
  contactIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#edf6ff",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#7183a4",
    marginTop: 13,
    marginBottom: 8,
    letterSpacing: 1.1,
  },
  accountSummary: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 8,
    color: "#7183a4",
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
  },
  accountEmail: {
    paddingHorizontal: 14,
    paddingBottom: 9,
    color: "#7183a4",
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 66,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#e7f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconDestructive: { backgroundColor: "#FEE2E2" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  rowLabelDestructive: { color: colors.red },
  rowSubtitle: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#7183a4",
    marginTop: 3,
  },
  divider: { height: 1, backgroundColor: "#edf3fa", marginLeft: 64 },
});
