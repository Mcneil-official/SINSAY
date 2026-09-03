import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../../constants/colors";
import { t, Locale } from "../../../lib/i18n";
import { useAuth } from "../../../hooks/useAuth";
import ContentContainer from "../../../components/ContentContainer";

interface FaqItem {
  q: string;
  a: string;
}

const faqs: FaqItem[] = [
  {
    q: "How do I get my Eco-Dive ID activated?",
    a: "Your Eco-Dive ID is automatically activated when a registered dive operator adds you to their dive manifest. You'll receive a notification once it's active. Until then, your status will show as 'Complete'.",
  },
  {
    q: "How do I become a dive operator?",
    a: "Go to Profile → Apply as an Operator and fill out the application form. You'll need to provide your resort details, role, and required documents. The Tourism Office will review your application, and you'll be notified once it's approved or rejected.",
  },
  {
    q: "Can I use the app offline?",
    a: "SINSAY is a progressive web app that requires an internet connection for most features. Some cached content may be available offline, but features like the AI Dive Assistant, Eco-Dive ID verification, and manifest management need a connection.",
  },
  {
    q: "How do I reset my password?",
    a: "On the login screen, tap 'Forgot Password' and enter your registered email address. You'll receive a password reset link in your inbox.",
  },
  {
    q: "What does the AI Dive Assistant do?",
    a: "The AI Assistant can answer questions about dive sites, marine life, safety practices, and help you plan a dive trip. It cannot activate your Eco-Dive ID, process payments, change your profile, or perform any operational function.",
  },
  {
    q: "Who do I contact for support?",
    a: "Contact the Tourism Office at tourism@sinsay.gov.ph or call +63 2 1234 5678. Office hours are Monday to Friday, 8:00 AM to 5:00 PM (PHT).",
  },
  {
    q: "My operator application was rejected. Can I re-apply?",
    a: "Yes. If your application was rejected, you can submit a new application with updated information and documents. Go to Profile → Apply as an Operator to start a fresh application.",
  },
  {
    q: "How do I switch between Tourist and Operator mode?",
    a: "If your operator application has been approved, you'll see an 'Approved Operator' card on your Profile. Tap it to switch to the Operator experience. You can switch back from the Operator Profile tab.",
  },
];

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <TouchableOpacity style={styles.faqRow} onPress={() => setOpen(!open)} activeOpacity={0.7}>
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.gray}
        />
      </View>
      {open && <Text style={styles.faqAnswer}>{item.a}</Text>}
    </TouchableOpacity>
  );
}

export default function FaqScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("faq_title", locale)}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          {faqs.map((item, index) => (
            <FaqRow key={index} item={item} />
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
  scrollContent: { paddingTop: 12, paddingBottom: 20, gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.darkText },
  faqRow: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkText,
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
    marginTop: 10,
  },
});
