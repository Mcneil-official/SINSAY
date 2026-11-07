import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { t, Locale } from "../lib/i18n";
import { useAuth } from "../hooks/useAuth";
import ContentContainer from "../components/ContentContainer";
import { safeBack } from "../lib/navigation";

const LAST_UPDATED = "November 2026";

interface LegalSection {
  clause: string;
  title: string;
  content: string;
}

const sections: LegalSection[] = [
  {
    clause: "Section 1",
    title: "Acceptance of Terms and Regulatory Agreement",
    content:
      "These Terms of Service ('Terms') constitute a legally binding agreement between you ('User', 'Tourist', or 'Operator') and SINSAY ('Platform', 'we', 'our'), operated in direct administrative coordination with the Municipal Government of Mabini, Batangas, through its Municipal Tourism Office. By accessing, creating an account on, or utilizing any feature of the SINSAY platform, you formally acknowledge that you have read, understood, and agreed to be legally bound by these Terms, the SINSAY Privacy Policy, and all applicable municipal ordinances and national maritime laws of the Republic of the Philippines. If you do not agree to these Terms in their entirety, you are strictly prohibited from accessing or using the Platform.",
  },
  {
    clause: "Section 2",
    title: "Statutory Authority and Municipal Jurisdiction",
    content:
      "The Platform operates pursuant to the administrative and regulatory powers granted to the Local Government Unit (LGU) of Mabini, Batangas under the Local Government Code of 1991 (Republic Act No. 7160), the Tourism Act of 2009 (Republic Act No. 9593), and existing municipal ordinances governing coastal resource management, marine protected area (MPA) zoning, and sports scuba diving safety. All recreational, training, and commercial diving operations conducted within the municipal waters of Mabini are subject to the direct regulatory oversight, inspection, and administrative jurisdiction of the Municipal Tourism Office, the Philippine Coast Guard (PCG), and the Philippine Commission on Sports Scuba Diving (PCSSD).",
  },
  {
    clause: "Section 3",
    title: "User Classification, Eligibility, and Account Governance",
    content:
      "Users are classified into two primary categories: (a) Tourist and Diver Profiles, and (b) Dive Operator and Establishment Profiles. Registration requires the provision of authentic, verifiable, and current personal or business information. Diver accounts are personal, strictly non-transferable, and limited to one account per individual. Dive operator accounts are restricted to accredited dive centers and resorts, with one primary administrative account designated per establishment. Users are solely responsible for safeguarding their login credentials and authentication tokens. Any unauthorized account access or security breach must be reported immediately to the Municipal Tourism Office.",
  },
  {
    clause: "Section 4",
    title: "Digital Eco-Dive ID Protocol, Issuance, and Limitations",
    content:
      "The SINSAY Digital Eco-Dive ID is an official municipal administrative credential generated upon complete submission of a diver registration profile. The Eco-Dive ID transitions to active status upon verification and submission on an authorized maritime dive manifest by an accredited Mabini dive operator. The Eco-Dive ID certifies compliance with municipal diver registration and conservation fee frameworks. The Eco-Dive ID does not constitute an internationally recognized recreational scuba certification (such as PADI, SSI, NAUI, or CMAS) and does not exempt divers from presenting valid certification credentials to dive operators prior to undertaking in-water activities.",
  },
  {
    clause: "Section 5",
    title: "Dive Passes, Quotas, and Financial Transaction Terms",
    content:
      "Dive pass credits represent municipal ecological and diving permits procured by accredited operators on behalf of divers. Pass allocations are credited to an operator's inventory strictly following formal validation and verification of official payment receipts by authorized Municipal Tourism Office personnel. Each diver listed on an approved manifest consumes one pass credit, except where covered by a valid annual permit or recognized municipal exemption. Payments must be remitted exclusively through official municipal financial channels. Verified dive pass transactions are non-refundable and non-transferable between establishments, except upon formal determination of municipal administrative or accounting error.",
  },
  {
    clause: "Section 6",
    title: "Maritime Dive Manifests and Dive Operator Obligations",
    content:
      "Accredited dive operators, dive resort managers, and certified divemasters are legally obligated to prepare and submit comprehensive, truthful maritime dive manifests prior to vessel departure. Manifests must accurately record certified diver identities, Eco-Dive ID numbers, assigned divemasters, boat captains, vessel specifications, designated dive sites, and scheduled immersion times. Submitting falsified, incomplete, or phantom diver records constitutes a severe violation of municipal safety regulations, subjecting the operator to immediate platform suspension, administrative penalties, and referral for revocation of municipal business permits.",
  },
  {
    clause: "Section 7",
    title: "Marine Sanctuary Regulations and Environmental Protection",
    content:
      "All divers, vessel crews, and operators must adhere strictly to environmental conservation standards within the municipal waters and Marine Protected Areas (MPAs) of Mabini. Divers and operators shall not touch, harvest, anchor on, or damage living coral formations; shall not harass marine wildlife; and shall moor vessels exclusively to designated municipal mooring buoys. Divers must adhere strictly to municipal carrying-capacity guidelines. Violations of municipal environmental ordinances are prosecuted under applicable Philippine fisheries, wildlife protection, and coastal resource laws.",
  },
  {
    clause: "Section 8",
    title: "Assumption of Inherent Risk, Diving Safety, and Limitation of Liability",
    content:
      "Scuba diving, snorkeling, and maritime excursions entail inherent and unavoidable risks, including but not limited to barotrauma, decompression sickness, equipment failure, adverse weather conditions, marine life encounters, physical exertion, and drowning. Users voluntarily assume full legal responsibility for all known and unforeseen risks associated with diving activities. SINSAY, its software architects, and the Municipal Government of Mabini disclaim all liability for any personal injury, illness, permanent disability, wrongful death, property damage, or financial loss resulting from diving operations, operator negligence, or individual diver conduct. Divers must maintain appropriate medical clearance and dive strictly within their certified training limits.",
  },
  {
    clause: "Section 9",
    title: "AI Dive Assistant Informational Advisory Disclaimer",
    content:
      "The SINSAY AI Dive Assistant provides automated marine life educational information, dive site overviews, and preliminary trip planning assistance. All computational recommendations are generated solely for informational and exploratory purposes. AI recommendations do not constitute professional diving instruction, marine weather forecasts, hyperbaric medical advice, or official maritime clearance. Divers and operators must independently confirm real-time tide, current, and weather conditions with licensed divemasters and harbor authorities before conducting dives.",
  },
  {
    clause: "Section 10",
    title: "Prohibited Uses and System Integrity",
    content:
      "Users are expressly prohibited from: (a) providing fraudulent, forged, or altered identification, certification, or payment documents; (b) impersonating any individual, diver, operator, or municipal official; (c) attempting to bypass, probe, reverse-engineer, or compromise the platform's security mechanisms, databases, or row-level security policies; (d) harvesting, scraping, or extracting user or operator data without authorization; or (e) utilizing the platform for any illegal, unauthorized, or predatory purpose under the laws of the Republic of the Philippines.",
  },
  {
    clause: "Section 11",
    title: "Administrative Sanctions, Suspension, and Account Termination",
    content:
      "The Municipal Tourism Office reserves the unilateral right to suspend, restrict, or permanently terminate any SINSAY user or operator account found in violation of these Terms, municipal ordinances, or national safety guidelines. In the event of account suspension or termination, previously submitted maritime dive manifests and municipal transaction logs are permanently retained as official government records for regulatory audit, safety investigation, and law enforcement compliance.",
  },
  {
    clause: "Section 12",
    title: "Amendments, Severability, and Entire Agreement",
    content:
      "The Municipal Tourism Office reserves the right to amend or update these Terms periodically to reflect legislative updates, municipal council resolutions, or administrative operational requirements. Continued use of the Platform after amendments are published constitutes binding acceptance of the revised Terms. If any provision of these Terms is declared unlawful, invalid, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect.",
  },
  {
    clause: "Section 13",
    title: "Governing Law, Legal Jurisdiction, and Official Notices",
    content:
      "These Terms are governed by, construed, and enforced in accordance with the laws of the Republic of the Philippines. Any judicial action or proceeding arising out of or related to these Terms or the SINSAY Platform shall be instituted exclusively in the competent courts having jurisdiction over the Province of Batangas, to the exclusion of all other courts.\n\nOfficial Communications and Administrative Inquiries:\nMunicipal Tourism Office\nMunicipal Hall Compound, Mabini, Batangas 4202, Philippines\nEmail: tourism@sinsay.gov.ph\nLandline: +63 43 487 1000\nOfficial Office Hours: Monday to Friday, 8:00 AM – 5:00 PM (PHT)",
  },
];

export default function TermsScreen() {
  const router = useRouter();
  const { profile, user, isOperator, viewAsTourist } = useAuth();
  const locale: Locale = (profile?.language_preference as Locale) || "en";

  const fallbackPath = user
    ? isOperator && !viewAsTourist
      ? "/(operator-tabs)/profile"
      : "/(tabs)/profile"
    : "/(tabs)";

  const goBack = () => safeBack(router, fallbackPath);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("terms_title", locale)}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <View style={styles.leadHeader}>
            <Text style={styles.leadTitle}>SINSAY Terms of Service</Text>
            <Text style={styles.leadSubtitle}>
              Municipality of Mabini, Batangas • Municipal Tourism Office
            </Text>
            <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>
          </View>

          {sections.map((section, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.clauseTag}>{section.clause}</Text>
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              <Text style={styles.cardBody}>{section.content}</Text>
            </View>
          ))}

          <View style={styles.footerNote}>
            <Text style={styles.footerNoteText}>
              By utilizing SINSAY, you agree to uphold maritime safety, environmental protection, and all municipal regulations of Mabini, Batangas.
            </Text>
          </View>
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.darkText,
    fontFamily: "Quicksand_700Bold",
  },
  leadHeader: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
  },
  leadTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#07156C",
    fontFamily: "Quicksand_700Bold",
    letterSpacing: -0.3,
  },
  leadSubtitle: {
    fontSize: 13,
    color: "#475569",
    fontFamily: "Quicksand_600SemiBold",
    marginTop: 4,
  },
  updated: {
    fontSize: 12,
    color: colors.gray,
    fontFamily: "Quicksand_500Medium",
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 10,
    gap: 4,
  },
  clauseTag: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#087BFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
    lineHeight: 20,
  },
  cardBody: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#334155",
    lineHeight: 21,
  },
  footerNote: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
});
