import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";
import { ResortLogoBadge } from "./ResortLogoBadge";

const PCSSD_LOGO = require("../../assets/logo-pcssd.png");
const DOT_LOGO = require("../../assets/logo-dot.png");

export function resolveEstablishmentMedia(est: {
  cover_image_paths?: string[] | null;
  image_url?: string | null;
  operator_avatar_path?: string | null;
  logo_url?: string | null;
}): { imageUrl: string | null; logoUrl: string | null } {
  const imageUrl = est.cover_image_paths?.[0]
    ? supabase.storage.from("operator_media").getPublicUrl(est.cover_image_paths[0]).data.publicUrl
    : est.image_url || null;

  const logoUrl = est.operator_avatar_path
    ? supabase.storage.from("operator_media").getPublicUrl(est.operator_avatar_path).data.publicUrl
    : est.logo_url || null;

  return { imageUrl, logoUrl };
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
  logoUrl?: string | null;
  phone?: string | null;
  index?: number;
  variant?: "row" | "grid";
  onPress?: () => void;
}

export function EstablishmentCard({
  name,
  location,
  accreditation,
  isPcssdAccredited = false,
  isDotAccredited = false,
  imageUrl,
  logoUrl,
  index = 0,
  variant = "row",
  onPress,
}: EstablishmentCardProps) {
  const badgeLabel = accreditation?.trim() || null;
  const photoSource = imageUrl
    ? { uri: imageUrl }
    : FALLBACK_RESORT_IMAGES[index % FALLBACK_RESORT_IMAGES.length];

  if (variant === "grid") {
    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${name}${location ? `, ${location}` : ""}`}
      >
        <View style={styles.gridImageWrap}>
          <Image source={photoSource} style={styles.gridImage} resizeMode="cover" />
          {(isPcssdAccredited || isDotAccredited) && (
            <View style={styles.gridEmblemsFloating}>
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
          )}
        </View>

        <View style={styles.gridBody}>
          <View style={styles.gridMainCol}>
            {badgeLabel ? (
              <View style={styles.gridBadge}>
                <Ionicons name="checkmark-circle" size={11} color={colors.green} />
                <Text style={styles.gridBadgeText} numberOfLines={1}>
                  {badgeLabel}
                </Text>
              </View>
            ) : null}

            <View style={styles.nameRow}>
              <ResortLogoBadge
                name={name}
                logoUrl={logoUrl}
                size={20}
                borderRadius={10}
                fontSize={8}
              />
              <Text style={[styles.gridName, { flex: 1 }]} numberOfLines={2}>
                {name}
              </Text>
            </View>
          </View>

          <View style={styles.gridLocationRow}>
            <Ionicons name="location-outline" size={12} color="#657C9B" />
            <Text style={styles.gridLocation} numberOfLines={1}>
              {location?.trim() || "Mabini, Batangas"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

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

        <View style={styles.nameRow}>
          <ResortLogoBadge
            name={name}
            logoUrl={logoUrl}
            size={20}
            borderRadius={10}
            fontSize={8}
          />
          <Text style={[styles.name, { flex: 1 }]} numberOfLines={1}>
            {name}
          </Text>
        </View>

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
  gridCard: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E4EEF8",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    flexDirection: "column",
  },
  gridImageWrap: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#E2E8F0",
    position: "relative",
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridEmblemsFloating: {
    position: "absolute",
    top: 6,
    right: 6,
    flexDirection: "row",
    gap: 4,
  },
  gridBody: {
    padding: 10,
    flex: 1,
    justifyContent: "space-between",
    gap: 8,
  },
  gridMainCol: {
    gap: 4,
  },
  gridBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gridBadgeText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    fontWeight: "700",
    color: "#059669",
  },
  gridName: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    fontWeight: "700",
    color: colors.darkText,
    minHeight: 36,
    lineHeight: 18,
  },
  gridLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  gridLocation: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logoThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
});
