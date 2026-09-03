import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../../constants/colors";
import { t, Locale } from "../../../lib/i18n";
import { useAuth } from "../../../hooks/useAuth";
import ContentContainer from "../../../components/ContentContainer";

export default function HelpScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const sections = [
    {
      icon: "call-outline" as const,
      title: "Contact the Tourism Office",
      content:
        "For questions about your Eco-Dive ID, operator application, or other concerns:\n\nEmail: tourism@sinsay.gov.ph\nPhone: +63 2 1234 5678\nOffice hours: Mon–Fri, 8:00 AM – 5:00 PM (PHT)",
    },
    {
      icon: "card-outline" as const,
      title: "Eco-Dive ID Activation",
      content:
        "Your Eco-Dive ID becomes active once a registered dive operator adds you to their manifest. You don't need to do anything — the system activates it automatically. You'll receive a notification when it's active.",
    },
    {
      icon: "chatbubble-ellipses-outline" as const,
      title: "AI Dive Assistant",
      content:
        "The AI Dive Assistant can help you plan your dive trip and answer general questions about dive sites, marine life, and safety. It cannot activate your Eco-Dive ID, process payments, or modify your profile.",
    },
    {
      icon: "bug-outline" as const,
      title: "Report an Issue",
      content:
        "If you encounter a bug or something isn't working as expected, please send a detailed description to tourism@sinsay.gov.ph including your account email and what you were doing when the issue occurred.",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("help_title", locale)}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EBF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.darkText,
    flex: 1,
  },
  cardBody: {
    fontSize: 13,
    color: colors.gray,
    lineHeight: 20,
  },
});
