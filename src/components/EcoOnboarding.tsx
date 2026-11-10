import { Afacad_700Bold } from "@expo-google-fonts/afacad/700Bold";
import { Jost_400Regular } from "@expo-google-fonts/jost/400Regular";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const DESIGN_WIDTH = 393;
const DESIGN_HEIGHT = 832;
const USE_NATIVE_DRIVER = Platform.OS !== "web";
const WIDE_BREAKPOINT = 480;
const WAVE_HEIGHT = 170;
const CONTENT_SIDE = 30;
const FOOTER_SIDE = 24;
const BUTTON_HEIGHT = 52;
const ART_MAX_HEIGHT = 300; // artwork cap: max-h-[300px]
const ART_MAX_VH = 0.35; // artwork cap: max-h-[35vh]
const ART_MIN_ZONE = 160; // never shrink the art zone below this — scroll instead
const TEXT_ART_GAP = 40; // gap between body text and artwork (AC min 16px)

type WaveVariant = "marine-life" | "protect" | "control";

const WAVE_PATHS: Record<
  WaveVariant,
  { wave: string; highlight: string | null; accent?: boolean }
> = {
  "marine-life": {
    wave: "M0 0H393V88Q160 10 0 165Z",
    highlight: "M0 0H118Q116 61 84 98L0 165Z",
  },
  protect: {
    wave: "M428.932 -32.3827 C428.932 -37.5183 428.932 -43.4991 428.932 -50 C417.939 -50 400.403 -49.9964 391.03 -50 H0 L-25.5 87 C90 66 262.5 149.769 354.264 156.67 C385.194 158.064 409.743 154.909 429 149.769 L428.932 -32.3827 Z",
    highlight:
      "M373.233 -129 L148 -11.2417 C174.111 35.9786 215.177 72.8623 263.868 92.8251 C312.559 112.788 365.704 114.53 413.817 97.741 C429.229 70.0012 443.503 45.9787 455.94 29.1914 L373.233 -129 Z",
  },
  control: {
    wave: "M0 0H393V88Q313 86 213 118Q93 168 0 110Z",
    highlight: "M0 50Q118 33 228 130Q92 160 0 110Z",
  },
};

interface EcoOnboardingProps {
  illustration: number;
  illustrationAlt: string;
  title: string;
  description: string;
  index: number;
  total?: number;
  wave: WaveVariant;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onFinish?: () => void;
}

export default function EcoOnboarding({
  illustration,
  illustrationAlt,
  title,
  description,
  index,
  total = 3,
  wave,
  onNext,
  onBack,
  onSkip,
  onFinish,
}: EcoOnboardingProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({ Afacad_700Bold, Jost_400Regular });
  const [slideOpacity] = useState(() => new Animated.Value(0));
  const [slideTranslateX] = useState(() => new Animated.Value(18));
  const [waveScale] = useState(() => new Animated.Value(0.98));
  // Actual frame height, re-measured on layout so URL-bar / PWA-banner
  // viewport changes are picked up without stale window math.
  const [measuredFrameHeight, setMeasuredFrameHeight] = useState(height);
  // Measured middle-zone height: the artwork height is set in plain px from
  // this so it can never exceed the zone (a parent-relative "100%" can fail
  // to resolve and let the image overflow into the text).
  const [artZoneHeight, setArtZoneHeight] = useState<number | null>(null);

  const isWide = width > WIDE_BREAKPOINT;
  const frameWidth = isWide ? DESIGN_WIDTH : width;
  const scale = frameWidth / DESIGN_WIDTH;
  const frameHeight = isWide
    ? Math.min(DESIGN_HEIGHT, height)
    : measuredFrameHeight;

  const safeTop = insets.top;
  const safeBottom =
    insets.bottom > 0 ? Math.max(insets.bottom, 16) : 16;
  const isCompact = frameHeight < 740;

  // Top-zone clearance so the progress row and title clear the wave header
  // exactly where the previous absolute layout placed them.
  const contentTop = Math.max(
    safeTop + (isCompact ? 104 : 116),
    (isCompact ? 154 : 168) * scale,
  );
  const footerBottom = safeBottom + (isCompact ? 10 : 14);
  const artMaxHeight = Math.min(
    ART_MAX_HEIGHT,
    Math.round(frameHeight * ART_MAX_VH),
  );

  const safeTotal = Math.max(total, 1);
  const activeIndex = Math.min(Math.max(index, 0), safeTotal - 1);
  const isLast = activeIndex >= safeTotal - 1;
  const steps = Array.from({ length: safeTotal }, (_, step) => step);
  const wavePaths = WAVE_PATHS[wave];

  const handleFrameLayout = useCallback((e: LayoutChangeEvent) => {
    const nextHeight = e.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setMeasuredFrameHeight(nextHeight);
    }
  }, []);

  const handleArtZoneLayout = useCallback((e: LayoutChangeEvent) => {
    const nextHeight = e.nativeEvent.layout.height;
    if (nextHeight > 0) {
      setArtZoneHeight(nextHeight);
    }
  }, []);

  const animateTransition = useCallback(
    (direction: number, onComplete?: () => void) => {
      Animated.parallel([
        Animated.timing(slideOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(slideTranslateX, {
          toValue: direction * 18,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]).start(() => {
        onComplete?.();
      });
    },
    [slideOpacity, slideTranslateX],
  );

  const advance = useCallback(() => {
    if (isLast) {
      if (onFinish) {
        animateTransition(-1, onFinish);
        return;
      }
      animateTransition(-1, onNext);
      return;
    }
    animateTransition(-1, onNext);
  }, [animateTransition, isLast, onNext, onFinish]);

  const goBack = useCallback(() => {
    animateTransition(1, onBack);
  }, [animateTransition, onBack]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(slideTranslateX, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(waveScale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [slideOpacity, slideTranslateX, waveScale]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 10 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -50) {
            advance();
            return;
          }
          if (gesture.dx > 50) {
            goBack();
          }
        },
      }),
    [advance, goBack],
  );

  const nextLabel = isLast ? "Done" : "Next";

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isWide ? "#e8eef5" : "#f8f7f5" },
      ]}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.stage,
          { justifyContent: isWide ? "center" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.frame,
            isWide
              ? { width: frameWidth, height: frameHeight }
              : styles.mobileFrameFill,
          ]}
          onLayout={handleFrameLayout}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.wave,
              {
                height: (frameWidth * WAVE_HEIGHT) / DESIGN_WIDTH,
                transform: [{ scale: waveScale }],
              },
            ]}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View
              style={{
                position: "absolute",
                top: -80,
                left: 0,
                right: 0,
                height: 80,
                backgroundColor: "#005EEC",
              }}
            />
            <Svg
              width={frameWidth}
              height={(frameWidth * WAVE_HEIGHT) / DESIGN_WIDTH}
              viewBox={`0 0 ${DESIGN_WIDTH} ${WAVE_HEIGHT}`}
            >
              <Path d={wavePaths.wave} fill="#005EEC" />
              {wavePaths.highlight ? (
                <Path d={wavePaths.highlight} fill="#FFFFFF" opacity={0.2} />
              ) : null}
            </Svg>
          </Animated.View>

          <Animated.View
            style={[
              styles.page,
              {
                opacity: slideOpacity,
                transform: [{ translateX: slideTranslateX }],
              },
            ]}
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Top zone: progress bar, Skip, title, description */}
              <View
                style={[
                  styles.topZone,
                  {
                    paddingTop: contentTop,
                    paddingHorizontal: CONTENT_SIDE * scale,
                  },
                ]}
              >
                <View
                  style={[styles.progressRow, { gap: 7 * scale }]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel={`Step ${activeIndex + 1} of ${safeTotal}`}
                >
                  {steps.map((step) => (
                    <View
                      key={step}
                      style={{
                        width: 28 * scale,
                        height: 4 * scale,
                        borderRadius: 999,
                        backgroundColor:
                          step === activeIndex ? "#005EEC" : "#c8d8ee",
                      }}
                    />
                  ))}
                  {onSkip && !isLast ? (
                    <Pressable
                      onPress={onSkip}
                      accessibilityRole="button"
                      accessibilityLabel="Skip onboarding"
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={({ pressed }) => [
                        styles.skip,
                        { top: -8 * scale, opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.skipLabel,
                          fontsLoaded && styles.skipFont,
                          { fontSize: 15 * scale, lineHeight: 20 * scale },
                        ]}
                      >
                        Skip
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text
                  accessibilityRole="header"
                  style={[
                    styles.title,
                    fontsLoaded && styles.titleFont,
                    {
                      marginTop: 24 * scale,
                      fontSize: (isCompact ? 38 : 42) * scale,
                      lineHeight: (isCompact ? 42 : 46) * scale,
                      letterSpacing: -0.8 * scale,
                    },
                  ]}
                >
                  {title}
                </Text>

                <Text
                  style={[
                    styles.description,
                    fontsLoaded && styles.descriptionFont,
                    {
                      marginTop: (isCompact ? 12 : 14) * scale,
                      maxWidth: 330 * scale,
                      fontSize: 15 * scale,
                      lineHeight: 22 * scale,
                    },
                  ]}
                >
                  {description}
                </Text>
              </View>

              {/* Middle zone: artwork scales proportionally, never overlaps text */}
              <View style={styles.middleZone} onLayout={handleArtZoneLayout}>
                <Image
                  source={illustration}
                  style={{
                    width: "100%",
                    height:
                      artZoneHeight != null
                        ? Math.min(artMaxHeight, artZoneHeight)
                        : "100%",
                    maxHeight: artMaxHeight,
                  }}
                  contentFit="contain"
                  accessibilityLabel={illustrationAlt}
                />
              </View>

              {/* Bottom zone: CTA with bottom safe-area inset */}
              <View
                style={[
                  styles.bottomZone,
                  {
                    paddingHorizontal: FOOTER_SIDE * scale,
                    paddingTop: 8 * scale,
                    paddingBottom: footerBottom,
                  },
                ]}
              >
                <Pressable
                  onPress={advance}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isLast ? "Finish onboarding" : "Continue to next tip"
                  }
                  accessibilityHint="Or swipe left to continue, right to go back."
                  style={({ pressed }) => [
                    styles.button,
                    styles.buttonPrimary,
                    {
                      minHeight: BUTTON_HEIGHT * scale,
                      borderRadius: 16 * scale,
                      backgroundColor: pressed ? "#164e9b" : "#1c5eb9",
                      shadowColor: "#1c5eb9",
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                      elevation: 6,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonLabel,
                      styles.buttonPrimaryLabel,
                      { fontSize: 15 * scale },
                    ]}
                  >
                    {nextLabel}
                  </Text>
                  <Text
                    style={[styles.buttonArrow, { fontSize: 15 * scale }]}
                    accessible={false}
                  >
                    →
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  stage: {
    flex: 1,
    alignItems: "center",
  },
  frame: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#f8f7f5",
  },
  mobileFrameFill: {
    width: "100%",
    height: "100%",
    flex: 1,
  },
  wave: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  page: {
    flex: 1,
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topZone: {
    flexGrow: 0,
    flexShrink: 0,
  },
  middleZone: {
    flex: 1,
    minHeight: ART_MIN_ZONE,
    marginTop: TEXT_ART_GAP,
    justifyContent: "center",
    overflow: "hidden",
  },
  bottomZone: {
    flexGrow: 0,
    flexShrink: 0,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 4,
  },
  skip: {
    position: "absolute",
    right: 0,
  },
  skipLabel: {
    color: "#1c5eb9",
    includeFontPadding: false,
  },
  skipFont: {
    fontFamily: "Jost_400Regular",
  },
  title: {
    color: "#1c5eb9",
    includeFontPadding: false,
  },
  titleFont: {
    fontFamily: "Afacad_700Bold",
  },
  description: {
    color: "#4d5652",
    includeFontPadding: false,
  },
  descriptionFont: {
    fontFamily: "Jost_400Regular",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 18,
  },
  buttonPrimary: {
    backgroundColor: "#1c5eb9",
  },
  buttonPrimaryLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  buttonLabel: {
    fontSize: 15,
    includeFontPadding: false,
  },
  buttonArrow: {
    color: "#FFFFFF",
    fontSize: 15,
    includeFontPadding: false,
  },
});
