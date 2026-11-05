import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Path,
  Svg,
  Circle as SvgCircle,
  Text as SvgText
} from "react-native-svg";
import { BookingLinkItem, BookingPlatformType } from "../types/supabase";

export interface EstablishmentBookingSectionProps {
  bookingLinks?: BookingLinkItem[] | null;
  bookingUrl?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  establishmentName?: string;
}

interface BookingChannel {
  id: string;
  name: string;
  url: string;
  type: BookingPlatformType;
}

export function detectTravelPlatform(url: string): BookingPlatformType {
  const lower = url.toLowerCase();
  if (lower.includes("m.me") || lower.includes("messenger.com"))
    return "messenger";
  if (lower.includes("agoda.com")) return "agoda";
  if (lower.includes("wa.me") || lower.includes("whatsapp.com"))
    return "whatsapp";
  if (lower.includes("booking.com")) return "booking";
  if (lower.includes("viber.com") || lower.includes("viber.me")) return "viber";
  if (lower.includes("tripadvisor.")) return "tripadvisor";
  if (lower.includes("klook.com")) return "klook";
  if (lower.includes("airbnb.com")) return "airbnb";
  if (lower.includes("instagram.com")) return "instagram";
  if (
    lower.includes("facebook.com") ||
    lower.includes("fb.com") ||
    lower.includes("fb.me")
  )
    return "messenger";
  return "direct";
}

export const PLATFORM_NAMES: Record<BookingPlatformType, string> = {
  messenger: "Messenger",
  agoda: "Agoda",
  whatsapp: "WhatsApp",
  booking: "Booking.com",
  viber: "Viber",
  tripadvisor: "TripAdvisor",
  klook: "Klook",
  airbnb: "Airbnb",
  instagram: "Instagram",
  website: "Website",
  direct: "Book Online",
};

export function normalizeTravelUrl(
  url: string,
  type?: BookingPlatformType,
): string {
  const trimmed = url.trim();
  if (type === "messenger") {
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return trimmed.startsWith("m.me/")
        ? `https://${trimmed}`
        : `https://m.me/${trimmed.replace(/^@/, "")}`;
    }
  }
  if (type === "whatsapp") {
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      const digitsOnly = trimmed.replace(/[^0-9]/g, "");
      return `https://wa.me/${digitsOnly}`;
    }
  }
  if (type === "instagram") {
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
    }
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function EstablishmentBookingSection({
  bookingLinks,
  bookingUrl,
  websiteUrl,
  facebookUrl,
  establishmentName = "Establishment",
}: EstablishmentBookingSectionProps) {
  const channels: BookingChannel[] = [];

  // 1. Process multiple dynamic booking links from operator
  if (bookingLinks && Array.isArray(bookingLinks)) {
    bookingLinks.forEach((item, idx) => {
      if (item && item.url && item.url.trim().length > 0) {
        const pType = item.platform || detectTravelPlatform(item.url);
        const norm = normalizeTravelUrl(item.url, pType);
        if (!channels.some((c) => c.url.toLowerCase() === norm.toLowerCase())) {
          channels.push({
            id: item.id || `booking-link-${idx}`,
            name:
              item.label && item.label.trim().length > 0
                ? item.label.trim()
                : PLATFORM_NAMES[pType],
            url: norm,
            type: pType,
          });
        }
      }
    });
  }

  // 2. Process legacy single Booking URL (if not already included)
  if (bookingUrl && bookingUrl.trim().length > 0) {
    const pType = detectTravelPlatform(bookingUrl);
    const norm = normalizeTravelUrl(bookingUrl, pType);
    if (!channels.some((c) => c.url.toLowerCase() === norm.toLowerCase())) {
      channels.push({
        id: "booking-primary",
        name: PLATFORM_NAMES[pType],
        url: norm,
        type: pType,
      });
    }
  }

  // 3. Process Facebook / Messenger Page (if not already included)
  if (facebookUrl && facebookUrl.trim().length > 0) {
    const norm = normalizeTravelUrl(facebookUrl, "messenger");
    if (!channels.some((c) => c.url.toLowerCase() === norm.toLowerCase())) {
      channels.push({
        id: "messenger",
        name: "Messenger",
        url: norm,
        type: "messenger",
      });
    }
  }

  // 4. Process Website URL (if not already included)
  if (websiteUrl && websiteUrl.trim().length > 0) {
    const pType = detectTravelPlatform(websiteUrl);
    const norm = normalizeTravelUrl(websiteUrl, pType);
    if (!channels.some((c) => c.url.toLowerCase() === norm.toLowerCase())) {
      channels.push({
        id: "website",
        name: pType === "direct" ? "Website" : PLATFORM_NAMES[pType],
        url: norm,
        type: pType === "direct" ? "website" : pType,
      });
    }
  }

  if (channels.length === 0) {
    return null;
  }

  const handleOpenChannel = async (channel: BookingChannel) => {
    try {
      const supported = await Linking.canOpenURL(channel.url);
      if (supported || Platform.OS === "web") {
        await Linking.openURL(channel.url);
      } else {
        Alert.alert("Cannot Open Link", `Could not navigate to ${channel.url}`);
      }
    } catch {
      Linking.openURL(channel.url).catch(() => {
        Alert.alert("Notice", `Unable to open booking page.`);
      });
    }
  };

  const renderChannelLogo = (type: BookingPlatformType) => {
    switch (type) {
      case "messenger":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#0084FF" }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
          </View>
        );

      case "agoda":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#1A2035" }]}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <SvgCircle cx={5} cy={6.5} r={2} fill="#E53935" />
              <SvgCircle cx={12} cy={5} r={2} fill="#FFC107" />
              <SvgCircle cx={19} cy={6.5} r={2} fill="#4CAF50" />
              <SvgCircle cx={8} cy={11.5} r={2} fill="#9C27B0" />
              <SvgCircle cx={16} cy={11.5} r={2} fill="#00BCD4" />
              <SvgText
                x={12}
                y={20.5}
                fill="#FFFFFF"
                fontSize={7.5}
                fontWeight="900"
                textAnchor="middle"
              >
                agoda
              </SvgText>
            </Svg>
          </View>
        );

      case "whatsapp":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#25D366" }]}>
            <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
          </View>
        );

      case "booking":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#003580" }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <SvgText
                x={9}
                y={18}
                fill="#FFFFFF"
                fontSize={18}
                fontWeight="900"
                textAnchor="middle"
              >
                B
              </SvgText>
              <SvgCircle cx={18} cy={17} r={2.2} fill="#00BAF2" />
            </Svg>
          </View>
        );

      case "viber":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#7360F2" }]}>
            <Ionicons name="call" size={18} color="#FFFFFF" />
          </View>
        );

      case "tripadvisor":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#00AA6C" }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <SvgCircle
                cx={7.5}
                cy={13}
                r={4.5}
                stroke="#FFFFFF"
                strokeWidth={1.8}
                fill="none"
              />
              <SvgCircle
                cx={16.5}
                cy={13}
                r={4.5}
                stroke="#FFFFFF"
                strokeWidth={1.8}
                fill="none"
              />
              <SvgCircle cx={7.5} cy={13} r={2} fill="#FFFFFF" />
              <SvgCircle cx={16.5} cy={13} r={2} fill="#FFFFFF" />
              <Path
                d="M4 8 Q12 11 20 8 M12 6 L12 10"
                stroke="#FFFFFF"
                strokeWidth={1.8}
                fill="none"
              />
            </Svg>
          </View>
        );

      case "klook":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#FF5B00" }]}>
            <Ionicons name="compass" size={20} color="#FFFFFF" />
          </View>
        );

      case "airbnb":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#FF385C" }]}>
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M12 3 C10 3 8 7 8 11 C8 15 10 18 12 21 C14 18 16 15 16 11 C16 7 14 3 12 3 Z"
                stroke="#FFFFFF"
                strokeWidth={1.8}
                fill="none"
              />
              <SvgCircle cx={12} cy={11} r={2.5} fill="#FFFFFF" />
            </Svg>
          </View>
        );

      case "instagram":
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#E1306C" }]}>
            <Ionicons name="logo-instagram" size={21} color="#FFFFFF" />
          </View>
        );

      case "website":
      case "direct":
      default:
        return (
          <View style={[styles.logoBadge, { backgroundColor: "#0284C7" }]}>
            <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header with Blue Vertical Indicator Pill */}
      <View style={styles.headerRow}>
        <View style={styles.verticalPill} />
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Book Here</Text>
          <Text style={styles.subtitle}>
            Book your dive, tour, or experience with us.
          </Text>
        </View>
      </View>

      {/* Booking Platforms & Channels Single Horizontal Scroll Row (Matching Screenshot) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardsRow}
      >
        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.id}
            style={styles.card}
            activeOpacity={0.82}
            onPress={() => handleOpenChannel(channel)}
            accessibilityRole="link"
            accessibilityLabel={`Book via ${channel.name} at ${establishmentName}`}
          >
            {renderChannelLogo(channel.type)}
            <Text style={styles.cardLabel} numberOfLines={1}>
              {channel.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 14,
  },
  verticalPill: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: "#087BFF",
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  card: {
    width: 104,
    height: 88,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#1E293B",
    textAlign: "center",
  },
});
