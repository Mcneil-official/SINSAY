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
import { ContentContainer, ErrorState, EstablishmentBookingSection, resolveEstablishmentMedia } from "../../components";
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

  const hasBookingChannels = Boolean(
    est &&
      ((est.booking_links && est.booking_links.length > 0) ||
        est.booking_url?.trim() ||
        est.website?.trim() ||
        est.facebook?.trim())
  );

  const openWebsite = () => {
    if (est?.website?.trim()) {
      Linking.openURL(est.website.trim()).catch(() => {});
    }
  };

  const openPhone = () => {
    if (est?.phone?.trim()) {
      Linking.openURL(`tel:${est.phone.trim()}`).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeBack(router, "/establishments")}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>

        <Text style={styles.title}>Resort Details</Text>

        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : !est ? (
        <ErrorState
          message="Resort not found"
          onRetry={() => safeBack(router, "/establishments")}
          retryLabel="Go Back"
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContentContainer maxWidth={720} paddingH={16}>
            {(() => {
              const { imageUrl, logoUrl } = resolveEstablishmentMedia(est);
              return (
                <ResortProfileHero
                  coverImageUrls={
                    est.cover_image_paths?.length
                      ? est.cover_image_paths.map((path) => supabase.storage.from("operator_media").getPublicUrl(path).data.publicUrl)
                      : imageUrl
                      ? [imageUrl]
                      : []
                  }
                  avatarUrl={logoUrl}
                  fallbackImageUrl={imageUrl}
                  resortName={est.name}
                />
              );
            })()}

            <View style={styles.contentSection}>
              {/* Title & Location */}
              <View style={styles.titleRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.estName}>{est.name}</Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={13} color="#005EEC" />
                    <Text style={styles.locationText}>
                      {est.location?.trim() || "Mabini, Batangas"}
                    </Text>
                  </View>
                </View>

                {(() => {
                  const hasPcssd = Boolean(est.pcssd_url && est.pcssd_url.trim().length > 0);
                  const hasDot = Boolean(est.dot_url && est.dot_url.trim().length > 0);
                  const hasAnyBadge = Boolean(est.accreditation || hasPcssd || hasDot);

                  if (!hasAnyBadge) return null;

                  return (
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
                  );
                })()}
              </View>

              {/* Quick Info Pills */}
              <View style={styles.quickPillsRow}>
                <View
                  style={styles.statusPill}
                  accessibilityLabel="Public directory listing"
                >
                  <Ionicons name="business-outline" size={13} color={colors.primaryBlue} />
                  <Text style={styles.pillText}>Directory Listing</Text>
                </View>

                {est.website?.trim() && (
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={openWebsite}
                    activeOpacity={0.75}
                    hitSlop={6}
                    accessibilityRole="link"
                    accessibilityLabel={`Open website of ${est.name}`}
                  >
                    <Ionicons name="globe-outline" size={13} color={colors.primaryBlue} />
                    <Text style={styles.pillText}>Website</Text>
                  </TouchableOpacity>
                )}

                {est.phone?.trim() && (
                  <TouchableOpacity
                    style={styles.actionPill}
                    onPress={openPhone}
                    activeOpacity={0.75}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${est.phone}`}
                  >
                    <Ionicons name="call-outline" size={13} color={colors.primaryBlue} />
                    <Text style={styles.pillText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Resort Overview */}
              {est.description && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Resort Overview</Text>
                  <Text style={styles.description}>{est.description}</Text>
                </View>
              )}

              {/* Booking & Social Links */}
              {hasBookingChannels && (
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Booking & Social Links</Text>
                  <Text style={styles.sectionSubtitle}>
                    Bookings, website and social channels
                  </Text>
                  <EstablishmentBookingSection
                    bookingLinks={est.booking_links}
                    bookingUrl={est.booking_url}
                    websiteUrl={est.website}
                    facebookUrl={est.facebook}
                    establishmentName={est.name}
                    hideHeader
                  />
                </View>
              )}

              {/* Direct Contact */}
              {(est.phone || est.email) && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Direct Contact</Text>
                    <Text style={styles.sectionSubtitle}>Direct lines and inquiries</Text>
                  </View>

                  <View style={styles.contactList}>
                    {est.phone && (
                      <TouchableOpacity
                        style={styles.contactCard}
                        onPress={openPhone}
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
          </ContentContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  contentSection: {
    paddingTop: 12,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  estName: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: "#1E293B",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
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
  accreditationText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  quickPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeaderRow: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    lineHeight: 16,
  },
  description: {
    fontSize: 13.5,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    lineHeight: 22,
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
