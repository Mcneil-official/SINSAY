import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLayout } from "../context/LayoutContext";

interface OnboardingCardProps {
  heroImage: any;
  onBack: () => void;
  progressActive: number;
  totalSteps?: number; // NEW — defaults to 5 to match next.tsx…next5.tsx
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function OnboardingCard({
  heroImage,
  onBack,
  progressActive,
  totalSteps = 5,
  children,
  footer,
}: OnboardingCardProps) {
  const { isTablet, isDesktop } = useLayout();
  const isWide = isTablet || isDesktop;

  // NEW — shared progress dots, works for both layouts
  const progressDots = (
    <View
      style={styles.progressRow}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalSteps - 1, now: progressActive }}
      accessibilityLabel={`Step ${progressActive + 1} of ${totalSteps}`}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i === progressActive && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  if (isWide) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.brand}
              contentFit="contain"
            />
          </View>
          <Image
            source={heroImage}
            style={styles.cardHero}
            contentFit="cover"
          />
          <View pointerEvents="none" style={styles.cardOval} />
          <View style={styles.cardContent}>
            {progressDots}
            {children}
            {footer}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={heroImage} style={styles.heroImage} contentFit="cover" />
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.brand}
          contentFit="contain"
        />
      </View>
      <View pointerEvents="none" style={styles.oval} />
      <View style={styles.content}>
        {progressDots}
        {children}
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 32,
    backgroundColor: "#f7f3ea",
    overflow: "hidden",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 500,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 3,
  },
  backButton: { padding: 4 },
  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: "#1f1a17",
    fontWeight: "400",
  },
  brand: { width: 120, height: 40 },
  oval: {
    position: "absolute",
    left: "-40%",
    right: "-40%",
    bottom: -60,
    height: "72%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 8,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 30,
    zIndex: 1,
  },
  desktopRoot: {
    flex: 1,
    backgroundColor: "#f7f3ea",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: 480,
    maxWidth: "100%",
    maxHeight: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  cardTop: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 3,
  },
  cardHero: {
    width: "100%",
    height: 200,
  },
  cardOval: {
    position: "absolute",
    left: "-40%",
    right: "-40%",
    bottom: 90,
    height: "40%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  cardContent: {
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E3DED5",
  },
  progressDotActive: {
    width: 20,
    backgroundColor: "#176FF2",
  },
});
