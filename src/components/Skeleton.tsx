import React, { useEffect, useState } from "react";
import { Animated, Platform, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../constants/colors";

interface SkeletonProps {
  width?: ViewStyle["width"];
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = "100%", height, radius = 12, style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.45));
  const useNativeDriver = Platform.OS !== "web";

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 700, useNativeDriver }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, useNativeDriver]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[styles.base, { width, height, borderRadius: radius, opacity }, style]}
    />
  );
}

export function ManifestSkeleton() {
  return (
    <View style={styles.manifestCard}>
      <Skeleton width="42%" height={14} radius={6} />
      <Skeleton width="70%" height={12} radius={6} />
      <View style={styles.row}>
        <Skeleton width="28%" height={12} radius={6} />
        <Skeleton width="25%" height={12} radius={6} />
      </View>
    </View>
  );
}

export function CardRailSkeleton({ count = 2 }: { count?: number }) {
  return (
    <View style={styles.rail}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.railCard}>
          <Skeleton height={112} radius={14} />
          <Skeleton width="72%" height={13} radius={6} style={styles.gap} />
          <Skeleton width="50%" height={11} radius={6} style={styles.gapSmall} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#DCE8F7" },
  manifestCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rail: { flexDirection: "row", gap: 12 },
  railCard: {
    width: 220,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  gap: { marginTop: 10 },
  gapSmall: { marginTop: 7 },
});
