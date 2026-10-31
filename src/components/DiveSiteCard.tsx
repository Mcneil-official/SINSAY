import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../constants/colors";
import { supabase } from "../lib/supabase";

const FALLBACK_IMAGES = [
  require("../../assets/images/3.png"),
  require("../../assets/images/5.jpeg"),
  require("../../assets/images/4.jpeg"),
  require("../../assets/dive-alley-palace.png"),
];

export function resolveSiteImage(
  imageUrl?: string | null,
  photoUrl?: string | null,
  index = 0,
) {
  const raw = (photoUrl || imageUrl || "").trim();
  if (!raw) {
    return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  }
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return { uri: raw };
  }
  const cleanPath = raw
    .replace(/^\/+/, "")
    .replace(/^dive-site-photos\/+/, "");
  const { data } = supabase.storage
    .from("dive-site-photos")
    .getPublicUrl(cleanPath);
  if (data?.publicUrl) {
    return { uri: data.publicUrl };
  }
  return FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
}

function getDefaultDepthRange(difficulty?: string | null): string {
  switch (difficulty) {
    case "Beginner":
    case "Open Water":
      return "5–18m";
    case "Intermediate":
    case "Rescue":
      return "12–28m";
    case "Advanced":
    case "Divemaster":
    case "Instructor":
      return "18–40m";
    default:
      return "8–22m";
  }
}

function getDifficultyColor(difficulty?: string | null): string {
  switch (difficulty) {
    case "Beginner":
    case "Open Water":
      return "#10B981";
    case "Intermediate":
    case "Rescue":
      return "#F59E0B";
    case "Advanced":
    case "Divemaster":
    case "Instructor":
      return "#EF4444";
    default:
      return colors.primaryBlue;
  }
}

export interface DiveSiteCardProps {
  name: string;
  location?: string | null;
  depthRange?: string | null;
  difficulty?: string | null;
  rating?: string | null;
  image?: any;
  imageUrl?: string | null;
  photoUrl?: string | null;
  index?: number;
  liked?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  fluid?: boolean;
}

export function DiveSiteCard({
  name,
  location,
  depthRange,
  difficulty,
  image,
  imageUrl,
  photoUrl,
  index = 0,
  liked = false,
  onPress,
  onLike,
  fluid = false,
}: DiveSiteCardProps) {
  const [imgError, setImgError] = useState(false);
  const displayLocation = location?.trim() || "Mabini, Batangas";
  const displayDepth = depthRange?.trim() || getDefaultDepthRange(difficulty);
  const displayDifficulty = difficulty?.trim() || "Open Water";
  const diffColor = getDifficultyColor(displayDifficulty);

  const imageSource = imgError
    ? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    : (image ?? resolveSiteImage(imageUrl, photoUrl, index));

  return (
    <View style={[styles.card, fluid ? styles.cardFluid : styles.cardFixed]}>
      <Pressable
        style={styles.cardPress}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${displayLocation}, depth ${displayDepth}, ${displayDifficulty}`}
      >
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />

        {/* Bottom dark gradient overlay for text readability */}
        <View style={styles.gradientOverlay} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient
                id={`siteCardGrad-${index}-${name.replace(/\W/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <Stop offset="0" stopColor="#020817" stopOpacity="0" />
                <Stop offset="0.38" stopColor="#020817" stopOpacity="0.42" />
                <Stop offset="0.72" stopColor="#020817" stopOpacity="0.82" />
                <Stop offset="1" stopColor="#020817" stopOpacity="0.96" />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill={`url(#siteCardGrad-${index}-${name.replace(/\W/g, "")})`}
            />
          </Svg>
        </View>

        {/* Bottom information content */}
        <View style={styles.overlayContent}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-sharp"
              size={11}
              color="rgba(255,255,255,0.85)"
            />
            <Text style={styles.locationText} numberOfLines={1}>
              {displayLocation}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.depthPill}>
              <Ionicons name="water-outline" size={10} color="#93C5FD" />
              <Text style={styles.depthText}>{displayDepth}</Text>
            </View>

            <View
              style={[
                styles.difficultyPill,
                { backgroundColor: diffColor },
              ]}
            >
              <Text style={styles.difficultyText} numberOfLines={1}>
                {displayDifficulty}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Favorite button */}
      <Pressable
        style={styles.heartButton}
        onPress={onLike}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={liked ? `Unfavorite ${name}` : `Favorite ${name}`}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={14}
          color={liked ? colors.heartRed : "#334155"}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0B192C",
    position: "relative",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardPress: {
    width: "100%",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },
  cardFixed: {
    width: 204,
    height: 256,
    flexGrow: 0,
    flexShrink: 0,
  },
  cardFluid: {
    flex: 1,
    minWidth: 155,
    maxWidth: 340,
    height: 240,
  },
  image: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    backgroundImage:
      "linear-gradient(180deg, rgba(2, 8, 23, 0) 0%, rgba(2, 8, 23, 0.42) 38%, rgba(2, 8, 23, 0.82) 72%, rgba(2, 8, 23, 0.96) 100%)" as any,
  },
  heartButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  overlayContent: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    gap: 4,
  },
  nameText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    lineHeight: 19,
    textShadowColor: "rgba(2, 8, 23, 0.72)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    textShadowColor: "rgba(2, 8, 23, 0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 3,
  },
  depthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(15, 23, 42, 0.68)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderWidth: 1,
    borderColor: "rgba(147, 197, 253, 0.3)",
  },
  depthText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: "Quicksand_600SemiBold",
  },
  difficultyPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  difficultyText: {
    color: colors.white,
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
  },
});
