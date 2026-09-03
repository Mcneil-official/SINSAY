import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { Card } from "./Card";

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delta?: string;
  deltaPositive?: boolean;
}

export function StatCard({
  icon,
  value,
  label,
  delta,
  deltaPositive = true,
}: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta && (
        <Text style={[styles.delta, !deltaPositive && styles.deltaNegative]}>
          {delta}
        </Text>
      )}
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
  deltaNegative: {
    color: colors.red,
  },
});
