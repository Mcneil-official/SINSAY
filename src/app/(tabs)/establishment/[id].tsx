import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
  useWindowDimensions,
} from "react-native";
import {
  ContentContainer,
  ErrorState,
  resolveEstablishmentMedia,
} from "../../../components";
import { ResortProfileHero } from "../../../components/ResortProfileHero";
import { colors } from "../../../constants/colors";
import { supabase } from "../../../lib/supabase";
import { EstablishmentRow } from "../../../types/supabase";
import { BookingLinkItem, BookingPlatformType } from "../../../types/supabase";
import {
  detectTravelPlatform,
  normalizeTravelUrl,
  PLATFORM_NAMES,
} from "../../../components/EstablishmentBookingSection";

const PCSSD_LOGO = require("../../../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../../../assets/logo-dot.png");

type ContactLink = {
  id: string;
  label: string;
  value: string;
  url: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  background: string;
};

function normalizeWebUrl(value: string) {
  const url = value.trim();
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function getFacebookHandle(value: string) {
  const raw = value.trim();
  if (!/facebook\.com|fb\.com|fb\.me/i.test(raw)) return raw.replace(/^@/, "");
  try {
    const url = new URL(normalizeWebUrl(raw));
    const parts = url.pathname.split("/").filter(Boolean);
    const handle = parts[0] === "profile.php" ? null : parts.at(-1);
    return handle
      ? `@${decodeURIComponent(handle).replace(/^@/, "")}`
      : "Facebook page";
  } catch {
    return "Facebook page";
  }
}

function getBookingIcon(
  platform: BookingPlatformType,
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (platform) {
    case "whatsapp":
      return "logo-whatsapp";
    case "instagram":
      return "logo-instagram";
    case "messenger":
      return "chatbubble-ellipses-outline";
    case "viber":
      return "call-outline";
    case "tripadvisor":
      return "compass-outline";
    case "booking":
    case "agoda":
    case "airbnb":
      return "bed-outline";
    case "klook":
      return "ticket-outline";
    default:
      return "open-outline";
  }
}

function buildContactLinks(est: EstablishmentRow): ContactLink[] {
  const links: ContactLink[] = [];
  const add = (link: ContactLink) => {
    if (link.value.trim() && !links.some((current) => current.url === link.url))
      links.push(link);
  };
  if (est.phone?.trim())
    add({
      id: "phone",
      label: "Phone",
      value: est.phone.trim(),
      url: `tel:${est.phone.trim()}`,
      icon: "call",
      color: "#0878E8",
      background: "#EAF3FF",
    });
  if (est.email?.trim())
    add({
      id: "email",
      label: "Email",
      value: est.email.trim(),
      url: `mailto:${est.email.trim()}`,
      icon: "mail",
      color: "#0878E8",
      background: "#EAF3FF",
    });
  if (est.facebook?.trim()) {
    const facebook = est.facebook.trim();
    const isUrl = /facebook\.com|fb\.com|fb\.me/i.test(facebook);
    const url = isUrl
      ? normalizeWebUrl(facebook)
      : `https://www.facebook.com/${facebook.replace(/^@/, "")}`;
    add({
      id: "facebook",
      label: "Facebook",
      value: getFacebookHandle(facebook),
      url,
      icon: "logo-facebook",
      color: "#1877F2",
      background: "#EAF2FF",
    });
  }
  if (est.website?.trim())
    add({
      id: "website",
      label: "Website",
      value: est.website
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/$/, ""),
      url: normalizeWebUrl(est.website),
      icon: "globe-outline",
      color: "#0878E8",
      background: "#EAF3FF",
    });
  const addBooking = (
    id: string,
    label: string | undefined,
    rawUrl: string,
    platform?: BookingPlatformType,
  ) => {
    if (!rawUrl.trim()) return;
    const kind = platform || detectTravelPlatform(rawUrl);
    const url = normalizeTravelUrl(rawUrl, kind);
    add({
      id,
      label: label?.trim() || PLATFORM_NAMES[kind],
      value: label?.trim() || PLATFORM_NAMES[kind],
      url,
      icon: getBookingIcon(kind),
      color:
        kind === "whatsapp"
          ? "#128C4A"
          : kind === "instagram"
            ? "#C13584"
            : kind === "messenger"
              ? "#0878E8"
              : colors.primaryBlue,
      background: "#F0F5FF",
    });
  };
  est.booking_links?.forEach((item: BookingLinkItem, index: number) => {
    if (item?.url)
      addBooking(
        item.id || `booking-${index}`,
        item.label,
        item.url,
        item.platform,
      );
  });
  if (est.booking_url?.trim())
    addBooking("booking-primary", undefined, est.booking_url);
  return links;
}

export default function EstablishmentDetailScreen() {
  const { id, returnTo } = useLocalSearchParams<{
    id: string;
    returnTo?: string;
  }>();
  const router = useRouter();
  const [est, setEst] = useState<EstablishmentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const wideLayout = width >= 800;
  const goBack = () =>
    router.replace(returnTo === "home" ? "/(tabs)" : "/establishments");

  useEffect(() => {
    if (!id) return;
    queueMicrotask(() => {
      setLoading(true);
      supabase
        .from("establishments")
        .select("*")
        .eq("id", id)
        .maybeSingle()
        .then(
          ({ data, error }) => {
            if (!error && data) setEst(data);
            setLoading(false);
          },
          () => {
            setLoading(false);
          },
        );
    });
  }, [id]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Unable to open link",
        "Please try again or open the link from your browser.",
      );
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : !est ? (
        <ErrorState
          message="Resort not found"
          onRetry={goBack}
          retryLabel="Go Back"
        />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContentContainer maxWidth={1080} paddingH={0}>
            <View style={styles.pageHeader}>
              <TouchableOpacity
                style={styles.pageBackButton}
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Go back to resorts"
              >
                <Ionicons name="chevron-back" size={23} color="#17233C" />
              </TouchableOpacity>
              <Text style={styles.pageHeaderTitle}>Resort Details</Text>
              <View style={styles.headerSpacer} />
            </View>
            {(() => {
              const { imageUrl, logoUrl } = resolveEstablishmentMedia(est);
              return (
                <ResortProfileHero
                  coverImageUrls={
                    est.cover_image_paths?.length
                      ? est.cover_image_paths.map(
                          (path) =>
                            supabase.storage
                              .from("operator_media")
                              .getPublicUrl(path).data.publicUrl,
                        )
                      : imageUrl
                        ? [imageUrl]
                        : []
                  }
                  avatarUrl={logoUrl}
                  fallbackImageUrl={imageUrl}
                  resortName={est.name}
                  wide={wideLayout}
                />
              );
            })()}

            <View style={styles.contentSection}>
              <View style={styles.identityRow}>
                <View style={styles.titleCol}>
                  <Text style={styles.estName} numberOfLines={2}>
                    {est.name}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-sharp" size={15} color="#005EEC" />
                    <Text style={styles.locationText} numberOfLines={2}>
                      {est.location?.trim() || "Mabini, Batangas"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.badgesRow}>
                {est.accreditation ? (
                  <View style={styles.accreditationBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#087A55"
                    />
                    <Text style={styles.accreditationText}>
                      {est.accreditation}
                    </Text>
                  </View>
                ) : null}
                {est.pcssd_url ? (
                  <View
                    style={styles.officialBadge}
                    accessibilityLabel="PCSSD Accredited"
                  >
                    <Image
                      source={PCSSD_LOGO}
                      style={styles.officialBadgeLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.officialBadgeText}>
                      PCSSD Accredited
                    </Text>
                  </View>
                ) : null}
                {est.dot_url ? (
                  <View
                    style={styles.officialBadge}
                    accessibilityLabel="DOT Accredited"
                  >
                    <Image
                      source={DOT_LOGO}
                      style={styles.officialBadgeLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.officialBadgeText}>DOT Accredited</Text>
                  </View>
                ) : null}
              </View>

              {est.description?.trim() ? (
                <View style={styles.descriptionBlock}>
                  <Text style={styles.overviewTitle}>Resort Overview</Text>
                  <Text style={styles.description}>{est.description}</Text>
                </View>
              ) : null}

              {est.pcssd_url || est.dot_url ? (
                <View style={styles.credentialLinks}>
                  {est.pcssd_url ? (
                    <TouchableOpacity
                      style={styles.credentialLink}
                      onPress={() => openLink(normalizeWebUrl(est.pcssd_url!))}
                      accessibilityRole="link"
                      accessibilityLabel="View PCSSD accreditation"
                    >
                      <Text style={styles.credentialLinkText}>
                        View PCSSD accreditation
                      </Text>
                      <Ionicons
                        name="open-outline"
                        size={14}
                        color={colors.primaryBlue}
                      />
                    </TouchableOpacity>
                  ) : null}
                  {est.dot_url ? (
                    <TouchableOpacity
                      style={styles.credentialLink}
                      onPress={() => openLink(normalizeWebUrl(est.dot_url!))}
                      accessibilityRole="link"
                      accessibilityLabel="View DOT accreditation"
                    >
                      <Text style={styles.credentialLinkText}>
                        View DOT accreditation
                      </Text>
                      <Ionicons
                        name="open-outline"
                        size={14}
                        color={colors.primaryBlue}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {(() => {
                const contactLinks = buildContactLinks(est);
                if (!contactLinks.length) return null;
                return (
                  <View style={styles.contactsSection}>
                    <View style={styles.contactsHeading}>
                      <View>
                        <Text style={styles.sectionTitle}>
                          Contacts &amp; Links
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                          Reach out or explore official channels
                        </Text>
                      </View>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.contactList}
                    >
                      {contactLinks
                        .filter(
                          (item) => item.id !== "phone" && item.id !== "email",
                        )
                        .map((item) => (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.contactTile}
                            onPress={() => openLink(item.url)}
                            activeOpacity={0.78}
                            accessibilityRole="link"
                            accessibilityLabel={`${item.label}: ${item.value}`}
                          >
                            <View
                              style={[
                                styles.contactIconCircle,
                                { backgroundColor: item.background },
                              ]}
                            >
                              <Ionicons
                                name={item.icon}
                                size={23}
                                color={item.color}
                              />
                            </View>
                            <Text style={styles.contactLabel} numberOfLines={1}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {contactLinks
                      .filter(
                        (item) => item.id === "phone" || item.id === "email",
                      )
                      .map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={styles.contactDetailRow}
                          onPress={() => openLink(item.url)}
                          activeOpacity={0.75}
                          accessibilityRole="link"
                          accessibilityLabel={`${item.label}: ${item.value}`}
                        >
                          <View
                            style={[
                              styles.detailIcon,
                              { backgroundColor: item.background },
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={19}
                              color={item.color}
                            />
                          </View>
                          <View style={styles.detailTextWrap}>
                            <Text style={styles.detailLabel}>{item.label}</Text>
                            <Text style={styles.detailValue}>{item.value}</Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#8A9AB0"
                          />
                        </TouchableOpacity>
                      ))}
                  </View>
                );
              })()}
            </View>
          </ContentContainer>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7FAFD" },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  pageHeader: {
    height: 68,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageBackButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#F3F5F8",
    alignItems: "center",
    justifyContent: "center",
  },
  pageHeaderTitle: {
    color: "#20283A",
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
  },
  headerSpacer: { width: 44 },
  contentSection: {
    paddingHorizontal: 20,
    paddingTop: 0,
    gap: 20,
  },
  identityRow: {
    width: "100%",
    alignItems: "flex-start",
  },
  titleCol: {
    width: "100%",
    gap: 5,
  },
  estName: {
    fontSize: 24,
    fontFamily: "Quicksand_700Bold",
    color: "#131C3A",
    lineHeight: 30,
    flexShrink: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  locationText: {
    fontSize: 13,
    fontFamily: "Quicksand_600SemiBold",
    color: "#637895",
    flexShrink: 1,
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  officialBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E5F5",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  officialBadgeLogo: {
    width: 20,
    height: 20,
    borderRadius: 14,
  },
  officialBadgeText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#29456B",
  },
  accreditationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F7F0",
    borderColor: "#C8EBDD",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 6,
  },
  accreditationText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#087A55",
  },
  descriptionBlock: {
    borderTopWidth: 1,
    borderTopColor: "#DCE7F4",
    paddingTop: 18,
  },
  overviewTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: "#131C3A",
    marginBottom: 7,
  },
  credentialLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: "Quicksand_700Bold",
    color: "#131C3A",
  },
  sectionSubtitle: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#6F819A",
    lineHeight: 18,
    marginTop: 3,
  },
  credentialLink: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  credentialLinkText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#205B9C",
  },
  contactsSection: {
    borderTopWidth: 1,
    borderTopColor: "#DCE7F4",
    paddingTop: 18,
    gap: 15,
  },
  contactsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  description: {
    fontSize: 14,
    fontFamily: "Quicksand_500Medium",
    color: "#536B8C",
    lineHeight: 23,
  },
  contactList: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 12,
    paddingBottom: 3,
  },
  contactTile: {
    width: 84,
    minHeight: 92,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#F4F7FA",
    borderRadius: 18,
    gap: 8,
  },
  contactIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#557397",
    textAlign: "center",
  },
  contactDetailRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#E4EAF1",
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTextWrap: { flex: 1, gap: 2 },
  detailLabel: {
    color: "#71839A",
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
  },
  detailValue: {
    color: "#172A48",
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
  },
  emptyContacts: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#73869F",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
});
