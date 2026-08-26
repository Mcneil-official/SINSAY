import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "./Card";
import { colors } from "../constants/colors";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delta?: string;
}

export function StatCard({ icon, value, label, delta }: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta && <Text style={styles.delta}>{delta}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
  },
  iconWrap: {
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.darkText,
  },
  label: {
    fontSize: 11,
    color: colors.gray,
    textAlign: "center",
  },
  delta: {
    fontSize: 10,
    color: colors.green,
    marginTop: 2,
  },
});
