import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

interface EstablishmentCardProps {
  name: string;
  location?: string | null;
  accreditation?: string | null;
  onPress?: () => void;
}

export function EstablishmentCard({
  name,
  location,
  accreditation,
  onPress,
}: EstablishmentCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <View style={styles.imagePlaceholder}>
        <Ionicons name="business" size={28} color="rgba(255,255,255,0.7)" />
      </View>

      {accreditation ? (
        <View style={styles.badge}>
          <Ionicons name="checkmark-circle" size={11} color={colors.white} />
          <Text style={styles.badgeText}>{accreditation}</Text>
        </View>
      ) : null}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.gray} />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imagePlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.green,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 9, fontWeight: "700", color: colors.white },
  info: { padding: 10, gap: 3 },
  name: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { flex: 1, fontSize: 11, color: colors.gray },
});
