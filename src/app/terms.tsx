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
    icon: "checkmark-circle-outline" as const,
    title: "Acceptance of Terms",
    content:
      "By creating a SINSAY account or using the app, you agree to these Terms of Service and to our Privacy Policy. If you do not agree, please do not use SINSAY.",
  },
  {
    icon: "person-outline" as const,
    title: "Eligibility & Your Account",
    content:
      "You must provide accurate information when registering. You are responsible for keeping your login credentials confidential and for all activity under your account. One account per person; operators hold one account per establishment.",
  },
  {
    icon: "id-card-outline" as const,
    title: "Eco-Dive ID",
    content:
      "Your Eco-Dive ID is issued after you complete your diver profile and is activated when a registered dive operator includes you in a dive manifest. The ID certifies your registration with the Tourism Office — it is not itself a diving certification, and it does not replace professional dive training or judgment.",
  },
  {
    icon: "ticket-outline" as const,
    title: "Dive Passes & Payments",
    content:
      "Dive pass purchases are credited to the operator's account only after verification by the Tourism Office, usually within 15–30 minutes during business hours. Each diver on a submitted manifest consumes one pass, except divers covered by a valid annual pass and walk-in divers as defined in-app.\n\nPayments are made through the Tourism Office's official channels. Verified pass credits are non-refundable except where the Tourism Office determines an error occurred.",
  },
  {
    icon: "document-text-outline" as const,
    title: "Dive Manifests",
    content:
      "Operators must submit truthful manifests: real divers, correct dates, and accurate boat details. Falsified manifests may lead to suspension of the operator account and referral to the Tourism Office for further action. Divers should confirm their details with their operator before a dive.",
  },
  {
    icon: "warning-outline" as const,
    title: "Diver Conduct & Safety",
    content:
      "Scuba diving is an inherently risky activity. You dive at your own risk. Only join dives that match your certification level and physical fitness, follow your divemaster's instructions, and respect marine protected areas. SINSAY and the Tourism Office are not liable for injuries, loss, or damage arising from diving activities.",
  },
  {
    icon: "chatbubble-ellipses-outline" as const,
    title: "AI Dive Assistant",
    content:
      "The AI Dive Assistant provides general information about dive sites, marine life, and trip planning. Its answers are informational only — not professional dive, medical, or legal advice. Always verify safety-critical information with a certified professional.",
  },
  {
    icon: "ban-outline" as const,
    title: "Prohibited Uses",
    content:
      "You agree not to: provide false identity or certification details; tamper with payment amounts or receipts; access other users' accounts or data; scrape or copy app content; upload malicious files; or use SINSAY for any unlawful purpose.",
  },
  {
    icon: "lock-closed-outline" as const,
    title: "Suspension & Termination",
    content:
      "We may suspend or terminate accounts that violate these terms, submit fraudulent documents or payments, or misuse the platform — with notice where practicable. You may stop using SINSAY at any time; manifest records already submitted to the Tourism Office are retained as official records.",
  },
  {
    icon: "refresh-outline" as const,
    title: "Changes to These Terms",
    content:
      "We may update these terms as the service evolves. Material changes will be announced in-app, and continued use after the update constitutes acceptance. The current version always lives on this page.",
  },
  {
    icon: "call-outline" as const,
    title: "Contact",
    content:
      "Questions about these terms:\n\nEmail: tourism@sinsay.gov.ph\nPhone: +63 2 1234 5678\nOffice hours: Mon–Fri, 8:00 AM – 5:00 PM (PHT)",
  },
];

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>{t("terms_title", locale)}</Text>
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
