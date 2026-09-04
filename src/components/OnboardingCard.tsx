import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { useLayout } from "../context/LayoutContext";

interface OnboardingFeature {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

interface DesktopContent {
  title: string; // same title string used in mobile children
  intro?: string; // italic subtitle line, if the screen has one
  features?: OnboardingFeature[]; // body split into icon rows (reused sentences only)
  listHeader?: string; // for next5's "Failure to comply may result in:" pattern
  listItems?: string[]; // bullet items, reused verbatim
  closing?: string; // italic closing line
  closingHighlight?: string; // substring of `closing` to color blue — must be an exact substring
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  showProgress?: boolean; // default true
  extraFooter?: React.ReactNode; // e.g. the consent checkbox on next5
}

interface OnboardingCardProps {
  heroImage: any;
  onBack: () => void;
  progressActive: number;
  totalSteps?: number;
  children: React.ReactNode; // MOBILE ONLY — unchanged from before
  footer?: React.ReactNode; // MOBILE ONLY — unchanged from before
  desktop: DesktopContent; // NEW — desktop-only structured content
}

function MobileDots({ active, total }: { active: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

function Stepper({ active, total }: { active: number; total: number }) {
  return (
    <View style={styles.stepperRow}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <React.Fragment key={i}>
            <View
              style={[
                styles.stepCircle,
                (isActive || done) && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNumber,
                  (isActive || done) && styles.stepNumberActive,
                ]}
              >
                {i + 1}
              </Text>
            </View>
            {i < total - 1 && (
              <View style={[styles.stepLine, done && styles.stepLineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function renderClosing(text: string, highlight?: string) {
  if (!highlight || !text.includes(highlight)) {
    return <Text style={styles.closing}>{text}</Text>;
  }
  const [before, after] = text.split(highlight);
  return (
    <Text style={styles.closing}>
      {before}
      <Text style={styles.closingHighlight}>{highlight}</Text>
      {after}
    </Text>
  );
}

export function OnboardingCard({
  heroImage,
  onBack,
  progressActive,
  totalSteps = 5,
  children,
  footer,
  desktop,
}: OnboardingCardProps) {
  const { isTablet, isDesktop } = useLayout();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = isTablet || isDesktop;
  const showProgress = desktop.showProgress ?? true;
  const heroHeight = Math.min(Math.max(screenHeight * 0.75, 260), 560);

  if (isWide) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.wideCard}>
          <View style={styles.leftPanel}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.desktopLogo}
              contentFit="contain"
            />

            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={styles.backRow}
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={16} color={colors.navy} />
              <Text style={styles.backLabel}>Back</Text>
            </Pressable>

            <View style={styles.desktopBody}>
              <Text style={styles.desktopTitle}>{desktop.title}</Text>

              {desktop.intro ? (
                <View style={styles.introBlock}>
                  <Text style={styles.introText}>{desktop.intro}</Text>
                  <View style={styles.introUnderline} />
                </View>
              ) : null}

              {desktop.features && desktop.features.length > 0 && (
                <View style={styles.featureList}>
                  {desktop.features.map((f, i) => (
                    <View key={i}>
                      <View style={styles.featureRow}>
                        <View style={styles.featureIconWrap}>
                          <Ionicons
                            name={f.icon}
                            size={18}
                            color={colors.navy}
                          />
                        </View>
                        <Text style={styles.featureText}>{f.text}</Text>
                      </View>
                      {i < desktop.features!.length - 1 && (
                        <View style={styles.featureDivider} />
                      )}
                    </View>
                  ))}
                </View>
              )}

              {desktop.listHeader && desktop.listItems && (
                <View style={styles.listBlock}>
                  <Text style={styles.listHeader}>{desktop.listHeader}</Text>
                  {desktop.listItems.map((item, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.listBullet}>•</Text>
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {desktop.closing
                ? renderClosing(desktop.closing, desktop.closingHighlight)
                : null}
            </View>

            {showProgress && (
              <MobileDots active={progressActive} total={totalSteps} />
            )}

            {desktop.extraFooter}

            <Pressable
              style={[
                styles.desktopCta,
                desktop.ctaDisabled && styles.desktopCtaDisabled,
              ]}
              onPress={desktop.onCta}
              disabled={desktop.ctaDisabled}
            >
              <Text style={styles.desktopCtaText}>{desktop.ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.rightPanel}>
            <View style={styles.stepperWrap}>
              <Stepper active={progressActive} total={totalSteps} />
            </View>
            <Image
              source={heroImage}
              style={styles.rightImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>
    );
  }

  // ── MOBILE — unchanged from the previous fix ──
  return (
    <View style={styles.container}>
      <Image
        source={heroImage}
        style={[styles.heroImage, { height: heroHeight }]}
        contentFit="cover"
      />
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.brand}
          contentFit="contain"
        />
      </View>
      <View pointerEvents="none" style={styles.oval} />
      <View
        style={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        {children}
        {showProgress && (
          <MobileDots active={progressActive} total={totalSteps} />
        )}
        {footer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── mobile (unchanged) ──
  container: {
    flex: 1,
    position: "relative",
    paddingHorizontal: 40,
    backgroundColor: "#f7f3ea",
    overflow: "hidden",
  },
  heroImage: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    position: "absolute",
    left: 20,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 3,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  backArrow: {
    fontSize: 28,
    lineHeight: 28,
    color: "#1f1a17",
    fontWeight: "400",
  },
  brand: { width: 120, height: 40 },
  oval: {
    position: "absolute",
    left: "-40%",
    right: "-40%",
    bottom: -60,
    height: "58%",
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
    gap: 20,
    paddingTop: 60,
    zIndex: 1,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dotInactive,
  },
  dotActive: { width: 20, backgroundColor: colors.navy },

  // ── desktop (new — matches reference) ──
  desktopRoot: {
    flex: 1,
    backgroundColor: "#DCEBFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  wideCard: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 1280,
    height: "100%",
    maxHeight: 780,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  leftPanel: {
    width: "42%",
    backgroundColor: colors.white,
    borderTopRightRadius: 160,
    borderBottomRightRadius: 160,
    paddingHorizontal: 48,
    paddingVertical: 40,
    justifyContent: "flex-start",
    gap: 20,
    zIndex: 2,
  },
  desktopLogo: { width: 140, height: 36, alignSelf: "flex-start" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  backLabel: { fontSize: 14, fontWeight: "600", color: colors.navy },
  desktopBody: { gap: 18 },
  desktopTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.navy,
    lineHeight: 40,
    letterSpacing: 0.3,
  },
  introBlock: { gap: 8 },
  introText: { fontSize: 15, fontStyle: "italic", color: "#3a342e" },
  introUnderline: {
    width: 40,
    height: 2,
    backgroundColor: colors.primaryBlue,
    borderRadius: 1,
  },
  featureList: { gap: 0 },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 12,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EAF2FE",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: colors.navy,
    lineHeight: 21,
    paddingTop: 8,
  },
  featureDivider: { height: 1, backgroundColor: colors.grayBorder },
  listBlock: { gap: 8 },
  listHeader: { fontSize: 14, color: colors.navy, marginBottom: 2 },
  listRow: { flexDirection: "row", gap: 8 },
  listBullet: { fontSize: 14, color: colors.navy, lineHeight: 20 },
  listText: { fontSize: 14, color: colors.navy, lineHeight: 20, flex: 1 },
  closing: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#3a342e",
    lineHeight: 22,
  },
  closingHighlight: { color: colors.primaryBlue, fontStyle: "italic" },
  desktopCta: {
    flexDirection: "row",
    alignSelf: "stretch",
    backgroundColor: colors.primaryBlue,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  desktopCtaDisabled: { backgroundColor: "#9bbdf0" },
  desktopCtaText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  rightPanel: { flex: 1, position: "relative" },
  rightImage: { width: "100%", height: "100%" },
  stepperWrap: {
    position: "absolute",
    top: 32,
    left: 0,
    right: 32,
    zIndex: 2,
    alignItems: "flex-end",
  },
  stepperRow: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: { backgroundColor: colors.white },
  stepNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  stepNumberActive: { color: colors.navy },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 6,
  },
  stepLineDone: { backgroundColor: colors.white },
});
