import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle, G, Path } from "react-native-svg";
import { colors } from "../constants/colors";
import { MABINI_GENERAL_FACTS } from "../constants/didYouKnowData";

const BUBBLE_SIZES = [
  4, 5, 7, 10, 8, 5, 4, 3, 3, 3.65,
  4.3, 4.95, 3, 3.65, 4.3, 4.95, 3, 3.65,
  4.3, 4.95, 3, 3.65, 4.3, 4.95, 3, 3.65,
  4.3, 4.95, 3, 3.65,
];

const DOLPHIN_D =
  "M1.679 25.039 C3.679 24.239 6.979 24.039 9.679 23.139 C11.079 14.639 18.679 9.139 27.879 8.739 C30.779 8.539 33.679 8.839 36.279 9.339 C38.979 4.839 42.679 1.139 47.079 .039 C47.979 -.161 48.379 .439 47.779 1.239 C45.079 4.739 44.979 9.339 48.179 12.839 C60.679 17.039 69.979 25.739 77.179 34.939 C81.079 33.539 86.079 32.339 90.379 33.039 C91.479 33.239 91.679 33.939 90.779 34.539 C87.379 36.739 86.479 40.039 81.879 41.439 C81.079 46.039 78.779 50.439 74.779 53.539 C73.979 54.139 73.279 53.739 73.479 52.739 C74.279 48.439 73.079 44.439 74.179 39.839 C66.979 33.939 58.579 30.439 47.679 28.539 C47.079 34.439 44.179 40.039 40.079 43.639 C39.279 44.339 38.579 43.939 38.779 42.839 C39.379 38.139 36.079 32.839 32.079 29.439 C24.179 31.339 17.979 30.339 12.879 28.939 C9.179 30.039 4.579 30.339 1.479 28.939 C-.621 28.039 -.421 25.939 1.679 25.039 Z";

export interface DidYouKnowLoaderProps {
  compact?: boolean;
  message?: string;
}

export function DidYouKnowLoader({
  compact = false,
  message,
}: DidYouKnowLoaderProps) {
  const [factIndex, setFactIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.96)).current;

  // Gentle pulse animation for dolphin & ring
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Rotate through facts every 3.5s with a crossfade
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: useNative,
      }).start(() => {
        setFactIndex((prev) => (prev + 1) % MABINI_GENERAL_FACTS.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: useNative,
        }).start();
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const currentFact = message || MABINI_GENERAL_FACTS[factIndex];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Animated.View
        style={[
          styles.motifWrap,
          compact && styles.motifWrapCompact,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Svg
          width={compact ? 160 : 200}
          height={compact ? 160 : 200}
          viewBox="0 0 220 220"
        >
          {/* Bubbles */}
          <G>
            {BUBBLE_SIZES.map((size, index) => {
              const angle = ((-66 + index * 9) * Math.PI) / 180;
              const cx = 110 + Math.cos(angle) * 90;
              const cy = 110 + Math.sin(angle) * 90;
              const opacity = Math.max(0.12, 0.8 - index * 0.024);
              return (
                <Circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={size / 2}
                  fill="none"
                  stroke={colors.primaryBlue}
                  strokeWidth={0.8}
                  opacity={opacity}
                />
              );
            })}
          </G>

          {/* Dolphin Artwork */}
          <G transform="translate(42, -12)">
            <G transform="translate(2.321, 4.461)">
              <Path d={DOLPHIN_D} fill={colors.primaryBlue} />
            </G>
            <Circle cx={19.4} cy={25.4} r={1.15} fill="#ffffff" />
          </G>
        </Svg>

        <View style={styles.centerLabelWrap} pointerEvents="none">
          <Text style={[styles.loadingLabel, compact && styles.loadingLabelCompact]}>
            Loading...
          </Text>
        </View>
      </Animated.View>

      <View style={[styles.factSection, compact && styles.factSectionCompact]}>
        <Text style={styles.factTitle}>Did you know?</Text>
        <Animated.Text
          style={[
            styles.factBody,
            compact && styles.factBodyCompact,
            { opacity: fadeAnim },
          ]}
        >
          {currentFact}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  containerCompact: {
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  motifWrap: {
    position: "relative",
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  motifWrapCompact: {
    width: 160,
    height: 160,
  },
  centerLabelWrap: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingLabel: {
    color: colors.primaryBlue,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingLabelCompact: {
    fontSize: 16,
  },
  factSection: {
    marginTop: 24,
    maxWidth: 320,
    alignItems: "center",
  },
  factSectionCompact: {
    marginTop: 16,
    maxWidth: 290,
  },
  factTitle: {
    color: colors.primaryBlue,
    fontSize: 14,
    fontWeight: "700",
    fontStyle: "italic",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  factBody: {
    color: "#657C9B",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 20,
    textAlign: "center",
  },
  factBodyCompact: {
    fontSize: 12,
    lineHeight: 18,
  },
});
