import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";

const PCSSD_LOGO = require("../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../assets/logo-dot.png");

export function resolveEstablishmentMedia(est: {
  cover_image_paths?: string[] | null;
  image_url?: string | null;
}): { imageUrl: string | null } {
  const imageUrl = est.cover_image_paths?.[0]
    ? supabase.storage.from("operator_media").getPublicUrl(est.cover_image_paths[0]).data.publicUrl
    : est.image_url || null;

  return { imageUrl };
}

const FALLBACK_RESORT_IMAGES = [
  require("../../assets/establishment-1.png"),
  require("../../assets/establishment-2.jpg"),
];

export interface EstablishmentCardProps {
  name: string;
  location?: string | null;
  accreditation?: string | null;
  accredited?: boolean;
  isPcssdAccredited?: boolean;
  isDotAccredited?: boolean;
  imageUrl?: string | null;
  phone?: string | null;
  index?: number;
  onPress?: () => void;
}

export function EstablishmentCard({
  name,
  location,
  accreditation,
  accredited = true,
  isPcssdAccredited = false,
  isDotAccredited = false,
  imageUrl,
  index = 0,
  onPress,
}: EstablishmentCardProps) {
  const badgeLabel =
    accreditation?.trim() || (accredited ? "DOT Verified" : null);
  const photoSource = imageUrl
    ? { uri: imageUrl }
    : FALLBACK_RESORT_IMAGES[index % FALLBACK_RESORT_IMAGES.length];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${name}${location ? `, ${location}` : ""}`}
    >
      {/* Resort cover photograph */}
      <View style={styles.imageWrap}>
        <Image source={photoSource} style={styles.image} resizeMode="cover" />
      </View>

      {/* Center information column */}
      <View style={styles.infoCol}>
        <View style={styles.badgeRow}>
          {badgeLabel ? (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={12} color={colors.green} />
              <Text style={styles.badgeText} numberOfLines={1}>
                {badgeLabel}
              </Text>
            </View>
          ) : null}

          {/* Official PCSSD and DOT Accreditation Emblems */}
          {isPcssdAccredited || isDotAccredited ? (
            <View style={styles.emblemsWrap}>
              {isPcssdAccredited ? (
                <View style={styles.emblemBadge} accessibilityLabel="PCSSD Accredited">
                  <Image source={PCSSD_LOGO} style={styles.emblemImage} resizeMode="contain" />
                </View>
              ) : null}
              {isDotAccredited ? (
                <View style={styles.emblemBadge} accessibilityLabel="DOT Accredited">
                  <Image source={DOT_LOGO} style={styles.emblemImage} resizeMode="contain" />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color="#657C9B" />
          <Text style={styles.location} numberOfLines={1}>
            {location?.trim() || "Mabini, Batangas"}
          </Text>
        </View>
      </View>

      {/* Right arrow button for viewing details */}
      <View style={styles.arrowButton}>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.primaryBlue}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 10,
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E4EEF8",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  imageWrap: {
    width: 96,
    height: 76,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoCol: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    fontWeight: "700",
    color: "#059669",
  },
  emblemsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  emblemBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  emblemImage: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  name: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    fontWeight: "700",
    color: colors.darkText,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  location: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
