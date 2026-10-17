import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

const FALLBACK_IMAGE = require("../../assets/dive-alley-palace.png");

// Real site photo when the row has one, bundled fallback otherwise —
// callers must never hardcode the fallback themselves.
export function resolveSiteImage(imageUrl?: string | null) {
  return imageUrl ? { uri: imageUrl } : FALLBACK_IMAGE;
}

interface DiveSiteCardProps {
  name: string;
  rating?: string | null;
  image?: any;
  imageUrl?: string | null;
  index?: number;
  liked?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  fluid?: boolean;
}

export function DiveSiteCard({
  name,
  rating,
  image,
  imageUrl,
  index = 0,
  liked = false,
  onPress,
  onLike,
  fluid = false,
}: DiveSiteCardProps) {
  // Ratings of null/"" / "0" mean unrated — the pill hides instead of
  // showing a dishonest 0-star badge.
  const showRating = !!rating && rating !== "0";

  return (
    // Flat siblings (never nested pressables): the card press fills the tile
    // and the heart floats above it — nested touchables fought over the
    // responder and crashed the rail on some platforms.
    <View
      style={[styles.card, fluid ? styles.cardFluid : styles.cardFixed]}
    >
      <Pressable
        style={styles.cardPress}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}${showRating ? `, rated ${rating}` : ""}`}
      >
        <Image source={image ?? resolveSiteImage(imageUrl)} style={styles.image} />
        <View style={styles.overlay}>
          <View style={styles.nameLabel}>
            <Text style={styles.nameText} numberOfLines={2}>
              {name}
            </Text>
          </View>
          {showRating && (
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={13} color={colors.starYellow} />
              <Text style={styles.ratingText}>{rating}</Text>
            </View>
          )}
        </View>
      </Pressable>
      <Pressable
        style={styles.heartButton}
        onPress={onLike}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={liked ? `Unfavorite ${name}` : `Favorite ${name}`}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={13}
          color={colors.heartRed}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cardPress: {
    flex: 1,
  },
  // Even row: the old index===1 stagger (taller card + marginTop:-20) made
  // the 2nd card jut regardless of content — uniform heights instead.
  cardFixed: {
    width: 188,
    height: 240,
  },
  cardFluid: {
    flex: 1,
    // minWidth 150 → 2 columns on 360px phones ((320 − 14 gap) / 2 ≈ 153).
    // Desktop (900px) fits up to 5-across at ~169px each; maxWidth caps stretch.
    minWidth: 150,
    maxWidth: 340,
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heartButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(243, 248, 254, 0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    gap: 7,
  },
  nameLabel: {
    backgroundColor: colors.cardLabelBg,
    borderRadius: 60,
    paddingVertical: 4,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  nameText: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardLabelBg,
    borderRadius: 60,
    paddingVertical: 4,
    paddingHorizontal: 10,
    gap: 4,
    alignSelf: "flex-start",
  },
  ratingText: {
    color: colors.white,
    fontSize: 11,
  },
});
