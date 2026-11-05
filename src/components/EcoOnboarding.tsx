import { Afacad_700Bold } from "@expo-google-fonts/afacad/700Bold";
import { Jost_400Regular } from "@expo-google-fonts/jost/400Regular";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
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
    highlight: "M373.233 -129 L148 -11.2417 C174.111 35.9786 215.177 72.8623 263.868 92.8251 C312.559 112.788 365.704 114.53 413.817 97.741 C429.229 70.0012 443.503 45.9787 455.94 29.1914 L373.233 -129 Z",
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
  illustrationOffsetY?: number;
  illustrationAspect?: number;
  illustrationTopLimit?: number;
  titleGap?: number;
  headerOffsetY?: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  onFinish?: () => void;
  onReviewTips?: () => void;
}

export default function EcoOnboarding({
  illustration,
  illustrationAlt,
  title,
  description,
  index,
  total = 3,
  wave,
  illustrationOffsetY = 0,
  illustrationAspect,
  titleGap = 12,
  headerOffsetY = 0,
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

  const isWide = width > WIDE_BREAKPOINT;
  const frameWidth = isWide ? DESIGN_WIDTH : width;
  const scale = frameWidth / DESIGN_WIDTH;
  const frameHeight = isWide ? Math.min(DESIGN_HEIGHT, height) : height;

  const safeTop = Math.max(insets.top, 38);
  const safeBottom = Math.max(insets.bottom, 16);

  // Responsive Content top and height calculations
  const contentTop = (safeTop + 44) * scale;
  const contentWidth = frameWidth - CONTENT_SIDE * 2 * scale;

  // Estimate bottom of text block to strictly prevent illustration overlap
  // dots (20) + titleGap (12) + title 2 lines (~92) + desc margin (14) + desc 3 lines (~65) = ~203
  const textBlockHeight = (20 + titleGap + 92 + 14 + 65) * scale;
  const minImageTop = contentTop + textBlockHeight + 10 * scale;

  // Available vertical space for illustration between text block and bottom button
  const buttonAreaHeight = BUTTON_HEIGHT * scale + safeBottom + 28;
  const maxImageBottom = frameHeight - buttonAreaHeight;
  const availableImageHeight = Math.max(120, maxImageBottom - minImageTop);

  const aspect = illustrationAspect ?? (470 / 705);
  const imageHeight = Math.min(availableImageHeight, frameWidth / aspect);
  const imageWidth = imageHeight * aspect;
  const imageTop = minImageTop + Math.max(0, (availableImageHeight - imageHeight) / 2);
  const imageLeft = (frameWidth - imageWidth) / 2;

  const safeTotal = Math.max(total, 1);
  const activeIndex = Math.min(Math.max(index, 0), safeTotal - 1);
  const isLast = activeIndex >= safeTotal - 1;
  const steps = Array.from({ length: safeTotal }, (_, step) => step);
  const wavePaths = WAVE_PATHS[wave];

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
    [slideOpacity, slideTranslateX]
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
    [advance, goBack]
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
          style={[styles.frame, { width: frameWidth, height: frameHeight }]}
          {...panResponder.panHandlers}
        >
          {/* Top Wave */}
          <Animated.View
            style={[
              styles.wave,
              {
                height: (frameWidth * WAVE_HEIGHT) / DESIGN_WIDTH + safeTop,
                top: -8 + headerOffsetY,
                transform: [{ scale: waveScale }],
              },
            ]}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Svg
              width={frameWidth}
              height={(frameWidth * WAVE_HEIGHT) / DESIGN_WIDTH + safeTop}
              viewBox={`0 0 ${DESIGN_WIDTH} ${WAVE_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <Path d={wavePaths.wave} fill="#005EEC" />
              {wavePaths.highlight ? (
                <Path d={wavePaths.highlight} fill="#FFFFFF" opacity={0.2} />
              ) : null}
            </Svg>
          </Animated.View>

          {/* Illustration: Constrained strictly below the text block */}
          <Image
            source={illustration}
            style={{
              position: "absolute",
              zIndex: 0,
              left: imageLeft,
              top: imageTop,
              width: imageWidth,
              height: imageHeight,
              opacity: slideOpacity,
              transform: [
                {
                  translateY: slideTranslateX.interpolate({
                    inputRange: [0, 18],
                    outputRange: [0, 8],
                  }),
                },
              ],
            }}
            contentFit="contain"
            accessibilityLabel={illustrationAlt}
          />

          {/* Text and Controls */}
          <Animated.View
            style={[
              styles.content,
              {
                top: contentTop,
                left: CONTENT_SIDE * scale,
                width: contentWidth,
                opacity: slideOpacity,
                transform: [{ translateX: slideTranslateX }],
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
                  marginTop: titleGap * scale,
                  width: contentWidth,
                  fontSize: 42 * scale,
                  lineHeight: 46 * scale,
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
                  marginTop: 14 * scale,
                  maxWidth: 330 * scale,
                  fontSize: 14.5 * scale,
                  lineHeight: 21 * scale,
                },
              ]}
            >
              {description}
            </Text>
          </Animated.View>

          {/* Footer Action Button */}
          <Animated.View
            style={[
              styles.footer,
              {
                bottom: safeBottom + 16,
                left: FOOTER_SIDE * scale,
                right: FOOTER_SIDE * scale,
                opacity: slideOpacity,
                transform: [{ translateX: slideTranslateX }],
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
  wave: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  content: {
    position: "absolute",
    zIndex: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 4,
    position: "relative",
  },
  skip: {
    position: "absolute",
    right: 0,
  },
  skipLabel: {
    color: "#1c5eb9",
    fontWeight: "700",
  },
  skipFont: {
    fontFamily: "Afacad_700Bold",
  },
  title: {
    color: "#1c5eb9",
    fontWeight: "700",
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
  footer: {
    position: "absolute",
    zIndex: 3,
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
  },
});
