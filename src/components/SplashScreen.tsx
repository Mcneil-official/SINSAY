import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";
import { colors } from "../constants/colors";

const FADE_IN_MS = 600;
const HOLD_MS = 800;
const FADE_OUT_MS = 350;

interface SplashScreenProps {
  onFinish?: () => void;
  isReady?: boolean;
}

export default function SplashScreen({
  onFinish,
  isReady = true,
}: SplashScreenProps) {
  const [overlayOpacity] = useState(() => new Animated.Value(1));
  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.88));
  const onFinishRef = useRef(onFinish);
  const minTimeElapsedRef = useRef(false);
  const fadeOutStartedRef = useRef(false);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const startFadeOut = useCallback(() => {
    if (fadeOutStartedRef.current) return;
    fadeOutStartedRef.current = true;
    const useNativeDriver = Platform.OS !== "web";
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished) onFinishRef.current?.();
    });
  }, [overlayOpacity]);

  useEffect(() => {
    const useNativeDriver = Platform.OS !== "web";
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver,
      }),
    ]).start(() => {
      const timer = setTimeout(() => {
        minTimeElapsedRef.current = true;
        if (isReady) {
          startFadeOut();
        }
      }, HOLD_MS);
      return () => clearTimeout(timer);
    });
  }, [logoOpacity, logoScale, startFadeOut, isReady]);

  useEffect(() => {
    if (isReady && minTimeElapsedRef.current) {
      startFadeOut();
    }
  }, [isReady, startFadeOut]);

  return (
    <>
      <StatusBar style="light" />
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents="auto"
        accessible
        accessibilityRole="image"
        accessibilityLabel="SINSAY"
      >
        <Animated.View
          style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
        >
          <Image
            source={require("../../assets/SINSAY white logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.splashBlue,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  logo: {
    width: 275,
    height: 84,
  },
});
