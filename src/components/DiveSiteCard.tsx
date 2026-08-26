import React from "react";
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

interface DiveSiteCardProps {
  name: string;
  rating: string;
  image: any;
  index?: number;
  liked?: boolean;
  onPress?: () => void;
  onLike?: () => void;
}

export function DiveSiteCard({
  name,
  rating,
  image,
  index = 0,
  liked = false,
  onPress,
  onLike,
}: DiveSiteCardProps) {
  const isTall = index === 1;

  return (
    <TouchableOpacity
      style={[styles.card, isTall ? styles.cardTall : styles.cardShort]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={image} style={styles.image} />
      <TouchableOpacity
        style={styles.heartButton}
        onPress={onLike}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={13}
          color={colors.heartRed}
        />
      </TouchableOpacity>
      <View style={styles.overlay}>
        <View style={styles.nameLabel}>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>
        </View>
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={13} color={colors.starYellow} />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cardShort: {
    width: 188,
    height: 240,
  },
  cardTall: {
    width: 190,
    height: 271,
    marginTop: -20,
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
    bottom: 12,
    gap: 7,
  },
  nameLabel: {
    backgroundColor: colors.cardLabelBg,
    borderRadius: 60,
    paddingVertical: 4,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    maxWidth: 160,
  },
  nameText: {
    color: colors.white,
    fontSize: 12,
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
