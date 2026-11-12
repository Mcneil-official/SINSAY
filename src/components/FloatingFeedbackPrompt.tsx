import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { ENABLE_DESKTOP_LAYOUT } from "../constants/layout";
import { useLayout } from "../context/LayoutContext";
import { BOTTOM_NAV_HEIGHT, BOTTOM_NAV_PADDING } from "./BottomNav";

import {
  DEFAULT_FEEDBACK_SURVEY_URL,
  isProfileRoute,
  isRouteBlacklisted,
  SESSION_KEY_FEEDBACK_DISMISSED,
  STORAGE_KEY_FEEDBACK_SUBMITTED,
} from "../lib/feedbackPrompt";

export { DEFAULT_FEEDBACK_SURVEY_URL, isProfileRoute, isRouteBlacklisted };

// Module-level in-memory flag for session persistence across fast unmounts
let isSessionDismissedInMemory = false;

export default function FloatingFeedbackPrompt({
  surveyUrl = DEFAULT_FEEDBACK_SURVEY_URL,
  delayMs = 1500,
}: {
  surveyUrl?: string;
  delayMs?: number;
}) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();

  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Check eligibility and start timer on eligible screens
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isCancelled = false;

    async function checkEligibility() {
      // 1. Never show on splash, auth, or onboarding routes
      if (isRouteBlacklisted(pathname)) {
        setVisible(false);
        return;
      }

      // 2. Only show once the user visits their Profile page
      if (!isProfileRoute(pathname)) {
        setVisible(false);
        return;
      }

      // 3. Check in-memory session dismissal
      if (isSessionDismissedInMemory) {
        return;
      }

      // 4. Check browser sessionStorage dismissal
      if (Platform.OS === "web" && typeof window !== "undefined") {
        try {
          if (window.sessionStorage?.getItem(SESSION_KEY_FEEDBACK_DISMISSED) === "1") {
            isSessionDismissedInMemory = true;
            return;
          }
        } catch {
          // ignore sessionStorage restrictions
        }
      }

      // 5. Check persistent storage for previous completion
      try {
        const submitted = await AsyncStorage.getItem(STORAGE_KEY_FEEDBACK_SUBMITTED);
        if (submitted === "true" || isCancelled) {
          return;
        }
      } catch {
        // proceed if storage read fails
      }

      // 6. User is eligible: trigger after gentle settle delay on profile page
      timer = setTimeout(() => {
        if (
          !isCancelled &&
          !isRouteBlacklisted(pathname) &&
          isProfileRoute(pathname) &&
          !isSessionDismissedInMemory
        ) {
          setVisible(true);
        }
      }, delayMs);
    }

    void checkEligibility();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pathname, delayMs]);

  // Handle smooth entrance animation when visible becomes true
  useEffect(() => {
    if (!visible) return;
    const useNative = Platform.OS !== "web";

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: useNative,
      }),
    ]).start();
  }, [visible, opacityAnim, slideAnim]);

  const dismissPrompt = (isCompletion: boolean = false) => {
    const useNative = Platform.OS !== "web";

    // Mark session dismissed
    isSessionDismissedInMemory = true;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        window.sessionStorage?.setItem(SESSION_KEY_FEEDBACK_DISMISSED, "1");
      } catch {
        // ignore
      }
    }

    if (isCompletion) {
      void AsyncStorage.setItem(STORAGE_KEY_FEEDBACK_SUBMITTED, "true").catch(() => {});
    }

    // Animate out cleanly
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: useNative,
      }),
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: useNative,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleShareFeedback = async () => {
    try {
      dismissPrompt(true);
      await Linking.openURL(surveyUrl);
    } catch {
      // Fallback: window open on web if Linking fails
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(surveyUrl, "_blank");
      }
    }
  };

  if (!visible) {
    return null;
  }

  // Calculate bottom offset to float above BottomNav + safe-area insets without overlapping
  const isWide = isDesktop && ENABLE_DESKTOP_LAYOUT;
  const bottomOffset = isWide
    ? 24
    : BOTTOM_NAV_HEIGHT + BOTTOM_NAV_PADDING + 16 + Math.max(insets.bottom, 0);

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.card,
          isWide ? styles.cardDesktop : styles.cardMobile,
          {
            bottom: bottomOffset,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents="auto"
        accessibilityRole="alert"
        accessibilityLabel="Help improve SINSAY feedback prompt"
      >
        {/* Top Header Row with Icon, Title, and Close Button */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBubble}>
              <Ionicons name="chatbubble-ellipses" size={15} color="#087BFF" />
            </View>
            <Text style={styles.titleText}>Help improve SINSAY</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => dismissPrompt(false)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close feedback prompt"
          >
            <Ionicons name="close" size={17} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Subtitle Body Description */}
        <Text style={styles.bodyText}>
          Tell us what you think of this pilot release. It only takes 2 minutes to share your thoughts.
        </Text>

        {/* Action Button Row */}
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.primaryBtnPressed,
            ]}
            onPress={handleShareFeedback}
            accessibilityRole="button"
            accessibilityLabel="Share Feedback"
          >
            <Ionicons name="open-outline" size={14} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.primaryBtnText}>Share Feedback</Text>
          </Pressable>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => dismissPrompt(false)}
            accessibilityRole="button"
            accessibilityLabel="Maybe later"
          >
            <Text style={styles.secondaryBtnText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  card: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardMobile: {
    left: 16,
    right: 16,
    maxWidth: 350,
    alignSelf: "center",
  },
  cardDesktop: {
    right: 24,
    width: 340,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  titleText: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  bodyText: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    lineHeight: 17,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  btnIcon: {
    marginRight: 5,
  },
  primaryBtnText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  secondaryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#94A3B8",
  },
});
