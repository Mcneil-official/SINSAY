import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { t, Locale } from "../lib/i18n";
import { useAuth } from "../hooks/useAuth";
import ContentContainer from "../components/ContentContainer";

const LAST_UPDATED = "September 2026";

const sections = [
  {
    icon: "information-circle-outline" as const,
    title: "Introduction",
    content:
      "SINSAY (\"we\", \"our\") is an eco-dive tourism platform operated with the Municipal Tourism Office of Mabini, Batangas. This Privacy Policy explains what personal data we collect, how we use it, and the rights you have over it.\n\nBy creating an account or using SINSAY, you agree to the practices described here. If you do not agree, please do not use the app.",
  },
  {
    icon: "person-outline" as const,
    title: "Data We Collect",
    content:
      "Account data: your name, email address, contact number, and profile details you provide when registering or completing your diver profile.\n\nDive records: dive type, certification details, Eco-Dive ID status, and the manifests you appear on.\n\nPayments: pass purchase amounts, payment reference numbers, and receipt images submitted for verification.\n\nGoogle sign-in: if you sign in with Google, we receive your name, email address, and profile photo from Google. We never see your Google password.\n\nOperator applications: resort details, role, contact information, and uploaded business documents.",
  },
  {
    icon: "construct-outline" as const,
    title: "How We Use Your Data",
    content:
      "We use your data to operate SINSAY: to create and manage your account and Eco-Dive ID, include you in dive manifests, process and verify pass purchases, review operator applications, send service notifications, and keep the platform safe from misuse.",
  },
  {
    icon: "people-outline" as const,
    title: "How We Share Your Data",
    content:
      "Dive operators can see the name, Eco-Dive ID, and certification details of divers on their own manifests — this is required for manifest verification by the Tourism Office.\n\nTourism Office staff can review pass payments, receipts, and operator applications for verification purposes.\n\nWe do not sell your personal data. We do not share it with advertisers or unrelated third parties. The AI Dive Assistant only receives the questions you type into it.",
  },
  {
    icon: "cloud-upload-outline" as const,
    title: "Storage & Security",
    content:
      "Your data is stored on Supabase infrastructure with encrypted connections. Uploaded documents and receipts are kept in private storage and are only accessible through signed, time-limited links. Database access is restricted by row-level security policies so users can only read their own records (and operators only their own manifests).\n\nNo system is perfectly secure. If you suspect unauthorized access to your account, contact us immediately and change your password.",
  },
  {
    icon: "logo-google" as const,
    title: "Google Sign-In Data",
    content:
      "When you sign in with Google, Google shares basic profile information (name, email, profile photo) under the openid, email, and profile scopes. We use this only to create and identify your SINSAY account. You can revoke SINSAY's access at any time from your Google account permissions page; revoking does not delete your SINSAY account data — contact us if you want it deleted.",
  },
  {
    icon: "time-outline" as const,
    title: "Data Retention",
    content:
      "We keep your account and dive records for as long as your account exists, because dive manifests are official records submitted to the Tourism Office. If you request deletion of your account, we will delete your profile and uploads while retaining anonymized manifest entries where the law requires record-keeping.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Your Rights (Data Privacy Act of 2012)",
    content:
      "Under Republic Act No. 10173 (Data Privacy Act of 2012), you have the right to be informed, to access, correct, or erase your personal data, and to object to processing. To exercise these rights, email tourism@sinsay.gov.ph with your account email and request. You may also file a complaint with the National Privacy Commission if you believe your rights have been violated.",
  },
  {
    icon: "call-outline" as const,
    title: "Contact Us",
    content:
      "For privacy questions or requests:\n\nEmail: tourism@sinsay.gov.ph\nPhone: +63 2 1234 5678\nOffice hours: Mon–Fri, 8:00 AM – 5:00 PM (PHT)",
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  // Public route: works with or without a session (locale falls back to English).
  const { profile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("privacy_title", locale)}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
          {sections.map((section, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <Ionicons name={section.icon} size={20} color={colors.primaryBlue} />
                </View>
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              <Text style={styles.cardBody}>{section.content}</Text>
            </View>
          ))}

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
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.darkText },
  updated: { fontSize: 12, color: colors.gray, textAlign: "center", marginBottom: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EBF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: colors.darkText, flex: 1 },
  cardBody: { fontSize: 13, color: colors.darkText, lineHeight: 20 },
});
