import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ContentContainer, ErrorState, EstablishmentBookingSection } from "../../components";
import { ResortProfileHero } from "../../components/ResortProfileHero";
import { colors } from "../../constants/colors";
import { safeBack } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";
import { EstablishmentRow } from "../../types/supabase";

const PCSSD_LOGO = require("../../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../../assets/logo-dot.png");

export default function EstablishmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [est, setEst] = useState<EstablishmentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    queueMicrotask(() => {
      setLoading(true);
      supabase.from("establishments").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
        if (!error && data) setEst(data);
        setLoading(false);
      }, () => {
        setLoading(false);
      });
    });
  }, [id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBack(router, "/establishments")} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Establishment</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : !est ? (
        <ErrorState
          message="Establishment not found"
          onRetry={() => safeBack(router, "/establishments")}
          retryLabel="Go Back"
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <ContentContainer maxWidth={720} paddingH={16}>
          <>
            <ResortProfileHero
              coverImageUrls={(est.cover_image_paths || []).map((path) => supabase.storage.from("operator_media").getPublicUrl(path).data.publicUrl)}
              avatarUrl={est.operator_avatar_path ? supabase.storage.from("operator_media").getPublicUrl(est.operator_avatar_path).data.publicUrl : null}
              fallbackImageUrl={est.image_url}
            />

            <View style={styles.contentSection}>
              {(() => {
                const hasPcssd = Boolean(est.pcssd_url && est.pcssd_url.trim().length > 0);
                const hasDot = Boolean(est.dot_url && est.dot_url.trim().length > 0);
                const hasAnyBadge = Boolean(est.accreditation || hasPcssd || hasDot);

                return (
                  <View style={styles.titleBadgeRow}>
                    <View style={styles.titleCol}>
                      <Text style={styles.estName}>{est.name}</Text>
                      {est.location && (
                        <View style={styles.locationRow}>
                          <Ionicons name="location-outline" size={16} color={colors.gray} />
                          <Text style={styles.locationText}>{est.location}</Text>
                        </View>
                      )}
                    </View>

                    {hasAnyBadge && (
                      <View style={styles.badgesCol}>
                        {est.accreditation && (
                          <View style={styles.accreditationBadge}>
                            <Ionicons name="checkmark-circle" size={13} color={colors.white} />
                            <Text style={styles.accreditationText}>{est.accreditation}</Text>
                          </View>
                        )}
                        {hasPcssd && (
                          <View style={styles.officialBadge} accessibilityLabel="PCSSD Accredited">
                            <Image source={PCSSD_LOGO} style={styles.officialBadgeLogo} resizeMode="contain" />
                            <Text style={styles.officialBadgeText}>PCSSD Accredited</Text>
                          </View>
                        )}
                        {hasDot && (
                          <View style={styles.officialBadge} accessibilityLabel="DOT Accredited">
                            <Image source={DOT_LOGO} style={styles.officialBadgeLogo} resizeMode="contain" />
                            <Text style={styles.officialBadgeText}>DOT Accredited</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })()}

              {est.description && (
                <Text style={styles.description}>{est.description}</Text>
              )}

              {/* Dedicated Booking / Book Here UI Section */}
              <EstablishmentBookingSection
                bookingLinks={est.booking_links}
                bookingUrl={est.booking_url}
                websiteUrl={est.website}
                facebookUrl={est.facebook}
                establishmentName={est.name}
              />

              {/* Segregated Contact Information Section (Phone & Email Only) */}
              {(est.phone || est.email) && (
                <View style={styles.contactSection}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.headerTextWrap}>
                      <Text style={styles.sectionTitle}>Contact Information</Text>
                      <Text style={styles.sectionSubtitle}>Direct lines and inquiries</Text>
                    </View>
                  </View>

                  <View style={styles.contactList}>
                    {est.phone && (
                      <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL(`tel:${est.phone}`)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${est.phone}`}
                      >
                        <View style={styles.contactIconCircle}>
                          <Ionicons name="call-outline" size={17} color={colors.primaryBlue} />
                        </View>
                        <View style={styles.contactTextWrap}>
                          <Text style={styles.contactLabel}>Phone / Mobile</Text>
                          <Text style={styles.contactValue}>{est.phone}</Text>
                        </View>
                        <View style={styles.contactActionBadge}>
                          <Text style={styles.contactActionText}>Call</Text>
                          <Ionicons name="chevron-forward" size={13} color={colors.primaryBlue} />
                        </View>
                      </TouchableOpacity>
                    )}

                    {est.email && (
                      <TouchableOpacity
                        style={styles.contactCard}
                        onPress={() => Linking.openURL(`mailto:${est.email}`)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Email ${est.email}`}
                      >
                        <View style={styles.contactIconCircle}>
                          <Ionicons name="mail-outline" size={17} color={colors.primaryBlue} />
                        </View>
                        <View style={styles.contactTextWrap}>
                          <Text style={styles.contactLabel}>Email Address</Text>
                          <Text style={styles.contactValue}>{est.email}</Text>
                        </View>
                        <View style={styles.contactActionBadge}>
                          <Text style={styles.contactActionText}>Email</Text>
                          <Ionicons name="chevron-forward" size={13} color={colors.primaryBlue} />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          </>
          </ContentContainer>
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  hero: {
    height: 180,
    backgroundColor: colors.navy,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroOverlay: { opacity: 0.6 },
  titleBadgeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleCol: {
    flex: 1,
  },
  badgesCol: {
    alignItems: "flex-end",
    gap: 6,
    flexShrink: 0,
  },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 999,
    paddingVertical: 3.5,
    paddingHorizontal: 9,
  },
  officialBadgeLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  officialBadgeText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: "#1E40AF",
  },
  accreditationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    gap: 4.5,
  },
  accreditationText: { fontSize: 11, fontWeight: "700", color: colors.white },
  contentSection: { paddingTop: 20 },
  estName: { fontSize: 22, fontWeight: "700", color: colors.darkText },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  locationText: { fontSize: 13, color: colors.gray, flex: 1 },
  description: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 22,
    marginTop: 16,
  },
  contactSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  contactList: { gap: 10 },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  contactTextWrap: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  contactValue: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    marginTop: 1,
  },
  contactActionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: "#EBF3FF",
  },
  contactActionText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, gap: 12, marginTop: 80,
  },
});
