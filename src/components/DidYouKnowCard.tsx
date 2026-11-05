import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { getSiteDidYouKnow } from "../constants/didYouKnowData";

export interface DidYouKnowCardProps {
  siteName: string;
  fact?: string;
}

export function DidYouKnowCard({ siteName, fact }: DidYouKnowCardProps) {
  const factText = fact || getSiteDidYouKnow(siteName);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Did you know?</Text>
        <Text style={styles.badge}>Local Heritage & Ecology</Text>
      </View>
      <Text style={styles.body}>{factText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
    color: colors.primaryBlue,
    letterSpacing: 0.3,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369A1",
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
    color: "#334155",
    fontWeight: "500",
  },
});
