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
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";

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

export default function OperatorProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: async () => {
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
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || "Operator"}</Text>
            <Text style={styles.profileEmail}>{user?.email || ""}</Text>
          </View>
          <TouchableOpacity style={styles.editPill}>
            <Text style={styles.editPillText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.sectionCard}>
          <ProfileRow icon="settings-outline" label="My Account" subtitle="Manage resort settings" onPress={() => {}} />
          <View style={styles.divider} />
          <ProfileRow icon="arrow-back-outline" label="Switch to Tourist View" subtitle="Go back to diver experience" onPress={() => router.replace("/(tabs)")} />
          <View style={styles.divider} />
          <ProfileRow icon="log-out-outline" label="Log out" subtitle="Secure your account" onPress={handleLogout} destructive />
        </View>

        <Text style={styles.sectionLabel}>More</Text>
        <View style={styles.sectionCard}>
          <ProfileRow icon="help-circle-outline" label="Help & Support" subtitle="Get help" onPress={() => {}} />
          <View style={styles.divider} />
          <ProfileRow icon="document-text-outline" label="FAQ" subtitle="Frequently asked questions" onPress={() => {}} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: colors.darkText, marginBottom: 20 },
  profileCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#EBF2FF",
    borderRadius: 16, padding: 16, gap: 14,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBlue, alignItems: "center", justifyContent: "center" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700", color: colors.darkText },
  profileEmail: { fontSize: 12, color: colors.gray, marginTop: 2 },
  editPill: { borderRadius: 100, borderWidth: 1, borderColor: colors.primaryBlue, paddingVertical: 6, paddingHorizontal: 14 },
  editPillText: { fontSize: 11, fontWeight: "600", color: colors.primaryBlue },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.gray, marginTop: 24, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionCard: { backgroundColor: colors.white, borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EBF2FF", alignItems: "center", justifyContent: "center" },
  rowIconDestructive: { backgroundColor: "#FEE2E2" },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: colors.darkText },
  rowLabelDestructive: { color: colors.red },
  rowSubtitle: { fontSize: 11, color: colors.gray, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.grayLight, marginLeft: 64 },
});
