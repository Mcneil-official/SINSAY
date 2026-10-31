import { Ionicons } from "@expo/vector-icons";
import { Quicksand_400Regular } from "@expo-google-fonts/quicksand/400Regular";
import { Quicksand_500Medium } from "@expo-google-fonts/quicksand/500Medium";
import { Quicksand_600SemiBold } from "@expo-google-fonts/quicksand/600SemiBold";
import { Quicksand_700Bold } from "@expo-google-fonts/quicksand/700Bold";
import { Image } from "expo-image";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { ClipPath, Defs, G, Path } from "react-native-svg";
import { colors } from "../constants/colors";
import { useLayout } from "../context/LayoutContext";
import { useScreenTransition } from "../context/ScreenTransitionContext";
import { markSplashShown } from "../lib/splash";
import WaveDivider from "./WaveDivider";

const HERO_PATH =
  "M411.498 -2H-18V333.272C1.2706 343.155 25.8361 349.175 56.7872 346.54C149.163 338.497 328.689 195.432 411.498 157.832V-2Z";
const HERO_HIGHLIGHT_PATH =
  "M411.498 -2H170.32C171.516 46.2727 189.834 92.549 222.002 128.568C254.171 164.587 298.096 188.003 345.937 194.637C371.093 179.029 393.659 165.897 411.498 157.741V-2Z";

interface AuthLayoutProps {
  activeTab?: "login" | "signup";
  onTabPress?: (tab: "login" | "signup") => void;
  showTabs?: boolean;
  children: React.ReactNode;
}

export function AuthLayout({
  activeTab,
  onTabPress,
  showTabs,
  children,
}: AuthLayoutProps) {
  const tabsVisible = showTabs ?? activeTab !== undefined;
  const router = useRouter();
  const { runTransition } = useScreenTransition();
  const { isTablet, isDesktop } = useLayout();
  const isWide = isTablet || isDesktop;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [fontsLoaded] = useFonts({
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  const goBack = () => {
    runTransition(() => {
      markSplashShown();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    });
  };

  const headerHeight = Math.min(Math.max(height * 0.3, 220), 400);
  const blueHeight = headerHeight * (0.28 / 0.3);
  const logoWidth = Math.min(Math.max(width * 0.61, 200), 250);
  const logoHeight = (logoWidth * 306) / 1012;
  const backIconSize = Math.min(Math.max(width * 0.067, 22), 30);
  const backButtonTop =
    insets.top + Math.min(Math.max(headerHeight * 0.08, 20), 32);
  const backButtonLeft = Math.min(Math.max(width * 0.036, 12), 20);
  const backButtonPadding = Math.round(backIconSize * 0.23);

  const tabRow = (
    <View style={styles.tabRow} accessibilityRole="tablist">
      <Pressable
        style={styles.tabButton}
        onPress={() => (onTabPress ? onTabPress("login") : router.replace("/loginpage"))}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "login" }}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "login" && styles.tabTextActive,
          ]}
        >
          Log In
        </Text>
        {activeTab === "login" && <View style={styles.tabUnderline} />}
      </Pressable>
      <Pressable
        style={styles.tabButton}
        onPress={() => (onTabPress ? onTabPress("signup") : router.replace("/signup"))}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === "signup" }}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "signup" && styles.tabTextActive,
          ]}
        >
          Sign Up
        </Text>
        {activeTab === "signup" && <View style={styles.tabUnderline} />}
      </Pressable>
    </View>
  );

  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        <View style={styles.wideCard}>
          <View style={styles.wideLeft}>
            <WaveDivider width={84} />
            <View style={styles.wideHeaderRow}>
              <Pressable
                onPress={goBack}
                hitSlop={12}
                style={styles.wideBackRow}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={18} color="#0F172A" />
                <Text style={styles.wideBackLabel}>Back</Text>
              </Pressable>

              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.wideLogo}
                contentFit="contain"
              />
            </View>
            <Text style={styles.wideSubtitle}>Tara, Sinsay na sa Mabini!</Text>

            {tabsVisible ? tabRow : null}

            <View style={styles.wideFormWrap}>{children}</View>
          </View>
          <View style={styles.wideRight}>
            <Image
              source={require("../../assets/images/1.png")}
              style={styles.wideImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mobileRoot}>
      <View style={[styles.header, { height: headerHeight }]}>
        <Svg
          style={[styles.hero, { height: blueHeight }]}
          viewBox="0 0 393 348"
          preserveAspectRatio="none"
          pointerEvents="none"
        >
          <Defs>
            <ClipPath id="heroBlueClip">
              <Path d={HERO_PATH} transform="translate(-4 0)" />
            </ClipPath>
          </Defs>
          <Path d={HERO_PATH} fill={colors.splashBlue} transform="translate(-4 0)" />
          <G clipPath="url(#heroBlueClip)">
            <G opacity={0.2} transform="translate(-28 -24) scale(1.25)">
              <Path d={HERO_HIGHLIGHT_PATH} fill={colors.white} />
            </G>
          </G>
        </Svg>

        <View
          pointerEvents="none"
          style={[
            styles.headerContent,
            {
              paddingTop: insets.top + 8,
              paddingBottom: headerHeight * 0.16,
            },
          ]}
        >
          <Image
            source={require("../../assets/images/sinsay-white-logo.png")}
            style={{ width: logoWidth, height: logoHeight }}
            contentFit="contain"
          />
          <Text
            style={[
              styles.tagline,
              fontsLoaded && styles.taglineFont,
              { fontSize: 12, lineHeight: 15 },
            ]}
          >
            Tara, Sinsay na sa Mabini!
          </Text>
        </View>

        <Pressable
          onPress={goBack}
          hitSlop={12}
          style={[
            styles.backButton,
            {
              top: backButtonTop,
              left: backButtonLeft,
              padding: backButtonPadding,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons
            name="chevron-back"
            size={backIconSize}
            color={colors.white}
          />
        </Pressable>
      </View>

      <View style={styles.bodyRegion}>
        <ScrollView
          style={styles.formViewport}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <Text
          style={[
            styles.copyright,
            { paddingBottom: Math.max(insets.bottom, 10) },
          ]}
        >
          ©2026 Mabini Tourism
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // mobile
  mobileRoot: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    width: "100%",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  headerContent: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 1,
    transform: [{ translateY: 0 }],
  },
  tagline: {
    color: colors.white,
    textAlign: "left",
    marginTop: 2,
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  taglineFont: {
    fontFamily: "Quicksand_600SemiBold",
  },
  backButton: {
    position: "absolute",
    zIndex: 2,
    elevation: 2,
  },
  bodyRegion: {
    flex: 1,
    marginTop: -10,
    backgroundColor: colors.white,
  },
  formViewport: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 33,
    paddingTop: 10,
    paddingBottom: 8,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  copyright: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    paddingTop: 6,
  },

  // desktop / wide
  wideRoot: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 0,
    margin: 0,
    width: "100%",
    height: "100%",
  },
  wideCard: {
    flexDirection: "row",
    width: "100%",
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 0,
    overflow: "hidden",
  },
  wideLeft: {
    width: "45%",
    maxWidth: 580,
    backgroundColor: "#ffffff",
    paddingHorizontal: 56,
    paddingVertical: 40,
    gap: 16,
    justifyContent: "center",
    zIndex: 2,
    position: "relative",
  },
  wideHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 4,
  },
  wideBackRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  wideBackLabel: {
    fontSize: 14,
    fontFamily: "Quicksand_600SemiBold",
    color: "#0F172A",
  },
  wideLogo: { width: 140, height: 34 },
  wideSubtitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#334155",
    textAlign: "center",
    alignSelf: "center",
    width: "100%",
  },
  wideFormWrap: { marginTop: 12, gap: 12, flex: 1 },
  wideRight: { flex: 1, height: "100%" },
  wideImage: { width: "100%", height: "100%" },

  // shared tab row (wide layout)
  tabRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 32,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tabButton: { alignItems: "center", gap: 6, paddingBottom: 12 },
  tabText: {
    fontSize: 15,
    fontFamily: "Quicksand_600SemiBold",
    color: "#94A3B8",
  },
  tabTextActive: { color: "#0F172A" },
  tabUnderline: {
    height: 2.5,
    width: "100%",
    backgroundColor: "#005EEC",
    borderRadius: 2,
  },
});
