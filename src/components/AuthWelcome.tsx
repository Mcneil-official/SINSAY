import { Quicksand_600SemiBold } from "@expo-google-fonts/quicksand/600SemiBold";
import { Quicksand_700Bold } from "@expo-google-fonts/quicksand/700Bold";
import { Image } from "expo-image";
import { useFonts } from "expo-font";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { colors } from "../constants/colors";
import { useScreenTransition } from "../context/ScreenTransitionContext";

interface AuthWelcomeProps {
  active: boolean;
}

export default function AuthWelcome({ active }: AuthWelcomeProps) {
  const insets = useSafeAreaInsets();
  const { transitionTo } = useScreenTransition();
  const [fontsLoaded, fontError] = useFonts({
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });
  const canAnimate = fontsLoaded || !!fontError;

  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.94));
  const [taglineOpacity] = useState(() => new Animated.Value(0));
  const [taglineTranslate] = useState(() => new Animated.Value(10));
  const [actionsOpacity] = useState(() => new Animated.Value(0));
  const [actionsTranslate] = useState(() => new Animated.Value(14));

  useEffect(() => {
    if (!active || !canAnimate) return;
    const useNativeDriver = Platform.OS !== "web";
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
      Animated.parallel([
        Animated.timing(actionsOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
        Animated.timing(actionsTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver,
        }),
      ]),
    ]);

    animation.start();
    return () => animation.stop();
  }, [
    active,
    canAnimate,
    logoOpacity,
    logoScale,
    taglineOpacity,
    taglineTranslate,
    actionsOpacity,
    actionsTranslate,
  ]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.logoSlot,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
        pointerEvents="none"
      >
        <Image
          source={require("../../assets/SINSAY white logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.Text
        style={[
          styles.tagline,
          fontsLoaded && styles.taglineFont,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslate }],
          },
        ]}
      >
        Tara, Sinsay na sa Mabini!
      </Animated.Text>

      <Animated.View
        style={[
          styles.actions,
          {
            bottom: Math.max(insets.bottom, 0) + 52,
            opacity: actionsOpacity,
            transform: [{ translateY: actionsTranslate }],
          },
        ]}
      >
        <View style={styles.actionsInner}>
          <Pressable
            style={[styles.button, styles.loginButton]}
            onPress={() => transitionTo("/loginpage")}
            accessibilityRole="button"
            accessibilityLabel="Log In"
          >
            <Text style={styles.loginText}>Log In</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.createButton]}
            onPress={() =>
              transitionTo({
                pathname: "/loginpage",
                params: { mode: "signup" },
              })
            }
            accessibilityRole="button"
            accessibilityLabel="Create an Account"
          >
            <Text style={styles.createText}>Create an Account</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.splashBlue,
    overflow: "hidden",
  },
  logoSlot: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    marginTop: -42,
    alignItems: "center",
  },
  logo: {
    width: 275,
    height: 84,
  },
  tagline: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    marginTop: 50,
    paddingHorizontal: 48,
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  taglineFont: {
    fontFamily: "Quicksand_600SemiBold",
  },
  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  actionsInner: {
    width: "100%",
    maxWidth: 320,
    gap: 8,
  },
  button: {
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButton: {
    backgroundColor: colors.white,
  },
  loginText: {
    color: colors.splashBlue,
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
  },
  createButton: {
    backgroundColor: colors.splashBlue,
    borderWidth: 2,
    borderColor: colors.white,
  },
  createText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
  },
});
