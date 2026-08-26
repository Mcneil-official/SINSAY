import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
}

export function ProgressBar({ progress, showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <View style={styles.wrapper}>
      {showLabel && (
        <Text style={styles.label}>{clamped}%</Text>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
    textAlign: "right",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.grayLight,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
  },
});
