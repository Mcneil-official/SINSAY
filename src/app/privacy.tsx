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

interface PrivacySection {
  clause: string;
  title: string;
  content: string;
}

const sections: PrivacySection[] = [
  {
    clause: "Section 1",
    title: "Statutory Framework and Privacy Declaration",
    content:
      "This Privacy Policy ('Policy') is formulated and administered by SINSAY ('we', 'us', 'our') in official partnership with the Municipal Government of Mabini, Batangas, through its Municipal Tourism Office. This Policy governs the collection, processing, storage, disclosure, and protection of personal data in strict compliance with Republic Act No. 10173, otherwise known as the Data Privacy Act of 2012 ('DPA'), its Implementing Rules and Regulations ('IRR'), and all relevant circulars issued by the National Privacy Commission ('NPC'). By creating an account, registering for a Digital Eco-Dive ID, or using the Platform, you acknowledge that you have read and consented to the data practices described herein.",
  },
  {
    clause: "Section 2",
    title: "Designation of Personal Information Controller",
    content:
      "The Municipal Tourism Office of Mabini, Batangas, acting jointly with the administrative authority of the SINSAY platform, operates as the Personal Information Controller ('PIC') under Republic Act No. 10173. The PIC determines the purposes, legal bases, and technical means for processing personal data in connection with municipal dive tourism administration, maritime manifest recording, carrying-capacity monitoring, and environmental conservation enforcement within the municipal waters of Mabini.",
  },
  {
    clause: "Section 3",
    title: "Categories of Personal and Sensitive Personal Data Collected",
    content:
      "In the course of delivering services and fulfilling municipal regulatory mandates, the Platform collects and processes the following classes of data:\n\n1. Personal Identification and Contact Information: Full legal name, date of birth, nationality, home jurisdiction, and verified mobile contact numbers.\n\n2. Electronic Credentials and Authentication Records: Registered email addresses, cryptographically hashed passwords, and session authentication tokens.\n\n3. Diver Qualifications and Scuba Certifications: Accredited certification agency (e.g., PADI, SSI, NAUI, CMAS), certification card identification numbers, diver qualification tier (e.g., Open Water, Advanced, Rescue, Divemaster), and uploaded certification proof.\n\n4. Maritime Manifest and Dive Activity Records: Assigned dive establishment, vessel designation, boat captain name, lead divemaster, dive site coordinates, dates of immersion, and Eco-Dive ID validation status.\n\n5. Fiscal and Payment Verification Records: Municipal dive pass transaction histories, official bank transfer reference numbers, and uploaded payment receipt documentation.\n\n6. Operator Establishment Credentials: Registered resort name, municipal business permits, Department of Tourism (DOT) accreditations, Philippine Commission on Sports Scuba Diving (PCSSD) credentials, establishment coordinates, and authorized administrative contacts.\n\n7. Technical Diagnostics and System Metadata: Internet Protocol (IP) addresses, browser configurations, mobile operating systems, telemetry logs, and access timestamps.",
  },
  {
    clause: "Section 4",
    title: "Lawful Basis and Legitimate Purposes of Data Processing",
    content:
      "All processing of personal data is executed pursuant to Section 12 (Criteria for Lawful Processing of Personal Information) and Section 13 (Sensitive Personal Information) of Republic Act No. 10173 under the following lawful bases and legitimate operational purposes:\n\n1. Regulatory Compliance and Public Safety: Fulfilling mandatory maritime passenger manifest requirements established by the Philippine Coast Guard, municipal tourism safety ordinances, and PCSSD standards.\n\n2. Service Execution and Credential Management: Registering user accounts, verifying diver qualification levels, generating official Digital Eco-Dive IDs, and administering pass allocations.\n\n3. Ecological Conservation and Sanctuary Carrying Capacity: Aggregating anonymized, non-identifiable trip parameters and diver counts to calculate ecological carrying capacities, monitor marine sanctuary health, and formulate municipal environmental conservation policies.\n\n4. Fiscal Audit and Anti-Fraud Controls: Auditing municipal tourism fee collections, validating operator pass allocations, and maintaining tamper-evident payment records.",
  },
  {
    clause: "Section 5",
    title: "Authorized Disclosures and Inter-Agency Data Sharing",
    content:
      "Personal data is disclosed strictly to authorized recipients under legal protocols and binding confidentiality standards:\n\n1. Accredited Dive Establishments: Operators access the verified name, Eco-Dive ID number, and certification status of divers enrolled exclusively on their own maritime manifests.\n\n2. Municipal and Law Enforcement Authorities: Manifest logs and vessel itineraries are accessible to authorized personnel of the Municipal Tourism Office, the Philippine Coast Guard (PCG), and maritime law enforcement for official regulatory oversight and maritime search-and-rescue operations.\n\n3. Absolute Prohibition on Commercial Sale: We do not sell, rent, monetize, or trade your personal data with commercial marketing brokers or third-party advertising networks under any circumstances.",
  },
  {
    clause: "Section 6",
    title: "Single Sign-On and Third-Party Authentication Protocols",
    content:
      "Users choosing to authenticate via Google OAuth authorize Google to share verified account profile details (full name, email address, profile avatar) pursuant to the openid, email, and profile authorization scopes. This data is utilized solely to establish and authenticate your SINSAY user identity. SINSAY never accesses or stores your Google account password. You may revoke SINSAY's third-party authorization at any time through your Google Account security permissions.",
  },
  {
    clause: "Section 7",
    title: "Information Security Safeguards and Technical Measures",
    content:
      "We implement comprehensive technical, organizational, and physical safeguards in accordance with the security requirements of Republic Act No. 10173:\n\n1. Cryptographic Protection: All network transmissions are encrypted end-to-end using Transport Layer Security (TLS/SSL) encryption protocols.\n\n2. Private Cloud Storage Architecture: Diver certification files, government identification documents, and payment receipts are stored in private storage repositories accessible solely through time-restricted, cryptographically signed URLs.\n\n3. Database Row-Level Security (RLS): Granular database access policies enforce data segregation, restricting users to their personal records and operators to their specific establishment operations.\n\n4. Access Governance: Administrative access is restricted to vetted personnel subject to formal confidentiality and non-disclosure obligations.",
  },
  {
    clause: "Section 8",
    title: "Statutory Retention Schedule and Archival Obligations",
    content:
      "Personal data is retained only for the duration necessary to accomplish the statutory purposes outlined in this Policy, or as prescribed by applicable Philippine administrative laws. Diver profile data remains active until account termination is formally requested. Because maritime dive manifests and municipal fiscal transaction logs constitute official administrative public records, these records are securely archived for statutory audit, regulatory inspection, and maritime safety investigation purposes for the maximum duration mandated by law.",
  },
  {
    clause: "Section 9",
    title: "Statutory Rights of the Data Subject under Republic Act No. 10173",
    content:
      "As a data subject under Chapter IV of the Data Privacy Act of 2012, you are legally entitled to exercise the following rights:\n\n1. Right to be Informed: The right to be informed whether personal data pertaining to you is being processed, including the purpose and categories of recipients.\n\n2. Right to Access: The right to request reasonable access to your personal data held within our systems.\n\n3. Right to Rectification: The right to dispute and rectify inaccurate, incomplete, or outdated personal data.\n\n4. Right to Erasure or Blocking: The right to suspend, withdraw, or order the blocking, removal, or destruction of your personal data upon grounds recognized by law, subject to mandatory public record-keeping exceptions.\n\n5. Right to Damages: The right to be indemnified for substantiated damages sustained due to inaccurate, incomplete, outdated, false, or unauthorized processing of personal data.\n\n6. Right to File a Complaint: You have the statutory right to file a formal complaint with the National Privacy Commission (NPC) if you believe your privacy rights have been violated.",
  },
  {
    clause: "Section 10",
    title: "Designated Data Protection Contact and Grievance Redress",
    content:
      "To submit a data access request, exercise your statutory privacy rights, or file a privacy inquiry, you may contact our designated compliance office:\n\nData Protection Compliance Desk\nMunicipal Tourism Office\nMunicipal Hall Compound, Mabini, Batangas 4202, Philippines\nEmail: privacy@sinsay.gov.ph\nLandline: +63 43 487 1000\nOfficial Operating Hours: Monday to Friday, 8:00 AM – 5:00 PM (PHT)\nNational Privacy Commission Portal: https://www.privacy.gov.ph",
  },
];

export default function PrivacyScreen() {
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
        <Text style={styles.headerTitle}>{t("privacy_title", locale)}</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <View style={styles.leadHeader}>
            <Text style={styles.leadTitle}>SINSAY Privacy Policy</Text>
            <Text style={styles.leadSubtitle}>
              Republic Act No. 10173 • Data Privacy Act of 2012 Compliance
            </Text>
            <Text style={styles.leadAgency}>
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
              SINSAY is committed to safeguarding personal data in full compliance with the National Privacy Commission and Philippine data protection standards.
            </Text>
          </View>

          <View style={{ height: 40 }} />
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
    color: "#087BFF",
    fontFamily: "Quicksand_700Bold",
    marginTop: 4,
  },
  leadAgency: {
    fontSize: 12,
    color: "#475569",
    fontFamily: "Quicksand_600SemiBold",
    marginTop: 2,
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
