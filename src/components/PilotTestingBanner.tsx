import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PilotTestingBanner() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.banner,
        {
          paddingTop: Math.max(insets.top, 5),
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel="Beta Pilot Testing · Mabini Eco-Dive Tourism"
    >
      <View style={styles.contentRow}>
        <View style={styles.dot} />
        <Text style={styles.bannerText} numberOfLines={1}>
          Beta Pilot Testing <Text style={styles.separator}>·</Text> Mabini Eco-Dive Tourism
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 5,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#087BFF",
    marginRight: 6,
  },
  bannerText: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#334155",
    letterSpacing: 0.2,
  },
  separator: {
    color: "#94A3B8",
    marginHorizontal: 4,
  },
});
