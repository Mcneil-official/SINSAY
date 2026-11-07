import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "../../constants/colors";
import { BOTTOM_NAV_HEIGHT } from "../BottomNav";
import { AssistantChatPanel } from "./AssistantChatPanel";
import { AssistantPlannerPanel } from "./AssistantPlannerPanel";

type AssistantMode = "closed" | "chooser" | "open" | "minimized";
type AssistantTab = "chat" | "planner";

function BotIcon({ size = 25, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M12 3v3M10 3h4" />
      <Rect x="4" y="6" width="16" height="13" rx="4" />
      <Path d="M8 19v3l4-3M1 11v4M23 11v4M9 15h6" />
      <Circle cx="8.5" cy="11" r="0.8" />
      <Circle cx="15.5" cy="11" r="0.8" />
    </Svg>
  );
}

function MapSvgIcon({ size = 18, color = colors.primaryBlue }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" />
      <Path d="M9 3v16M15 5v16" />
    </Svg>
  );
}

export function FloatingAssistant() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const [mode, setMode] = useState<AssistantMode>("closed");
  const [activeTab, setActiveTab] = useState<AssistantTab>("chat");

  const sheetHeight = Math.max(360, Math.round(windowHeight * 0.75));
  const useNative = Platform.OS !== "web";

  // Chooser fade/scale animation
  const [chooserAnim] = useState(() => new Animated.Value(0));
  // Drawer slide animation (0 = hidden off-bottom, 1 = open)
  const [drawerAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(chooserAnim, {
      toValue: mode === "chooser" ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    }).start();
  }, [mode, chooserAnim, useNative]);

  useEffect(() => {
    Animated.timing(drawerAnim, {
      toValue: mode === "open" ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: useNative,
    }).start();
  }, [mode, drawerAnim, useNative]);

  const hideFloatingTrigger = pathname?.includes("/dive-assistant") ?? false;
  const navBottomPadding =
    insets.bottom > 0 ? Math.max(insets.bottom, 12) : 12;
  const fabBottom = navBottomPadding + BOTTOM_NAV_HEIGHT + 12;

  const handleFabPress = () => {
    setMode((prev) => (prev === "chooser" ? "closed" : "chooser"));
  };

  const handleSelectTab = (tab: AssistantTab) => {
    setActiveTab(tab);
    setMode("open");
  };

  const translateY = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight + 60, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const chooserScale = chooserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      {/* Transparent backdrop for Chooser */}
      {mode === "chooser" && !hideFloatingTrigger && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setMode("closed")}
          accessibilityRole="button"
          accessibilityLabel="Dismiss assistant menu"
        />
      )}

      {/* Chooser Card anchored above FAB */}
      {!hideFloatingTrigger && (
        <Animated.View
          pointerEvents={mode === "chooser" ? "auto" : "none"}
          style={[
            styles.chooserCard,
            {
              bottom: fabBottom + 56,
              opacity: chooserAnim,
              transform: [{ scale: chooserScale }],
            },
          ]}
        >
          <View style={styles.chooserHeader}>
            <Text style={styles.chooserTitle}>SINSAY AI Assistant</Text>
            <TouchableOpacity
              onPress={() => setMode("closed")}
              hitSlop={8}
              style={styles.chooserCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Close assistant menu"
            >
              <Ionicons name="close" size={16} color={colors.gray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.chooserRow}
            onPress={() => handleSelectTab("chat")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open AI Chat"
          >
            <View style={styles.chooserIconWrap}>
              <BotIcon size={19} color={colors.primaryBlue} />
            </View>
            <View style={styles.chooserTextWrap}>
              <Text style={styles.chooserRowTitle}>AI Chat</Text>
              <Text style={styles.chooserRowSub}>
                Ask about dive sites, rules & safety
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray} />
          </TouchableOpacity>

          <View style={styles.chooserDivider} />

          <TouchableOpacity
            style={styles.chooserRow}
            onPress={() => handleSelectTab("planner")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Open Dive Plan Generator"
          >
            <View style={styles.chooserIconWrap}>
              <MapSvgIcon size={18} color={colors.primaryBlue} />
            </View>
            <View style={styles.chooserTextWrap}>
              <Text style={styles.chooserRowTitle}>Dive Plan Generator</Text>
              <Text style={styles.chooserRowSub}>
                Build a custom Anilao itinerary
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.gray} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Minimized Pill */}
      {!hideFloatingTrigger && mode === "minimized" && (
        <View style={[styles.miniPillWrap, { bottom: fabBottom }]}>
          <TouchableOpacity
            style={styles.miniPillMain}
            onPress={() => setMode("open")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Resume SINSAY AI assistant"
          >
            {activeTab === "chat" ? (
              <BotIcon size={18} color={colors.white} />
            ) : (
              <MapSvgIcon size={18} color={colors.white} />
            )}
            <Text style={styles.miniPillText}>
              {activeTab === "chat" ? "AI Chat" : "Plan Generator"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.miniPillClose}
            onPress={() => setMode("closed")}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Close SINSAY AI assistant"
          >
            <Ionicons name="close" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Action Button (closed or chooser state) */}
      {!hideFloatingTrigger && (mode === "closed" || mode === "chooser") && (
        <TouchableOpacity
          style={[styles.fab, { bottom: fabBottom }]}
          onPress={handleFabPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Open SINSAY AI assistant"
        >
          {mode === "chooser" ? (
            <Ionicons name="close" size={24} color={colors.white} />
          ) : (
            <BotIcon size={25} color={colors.white} />
          )}
        </TouchableOpacity>
      )}

      {/* Dimmed Backdrop for Open Drawer (tap -> minimize) */}
      <Animated.View
        pointerEvents={mode === "open" ? "auto" : "none"}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setMode("minimized")}
          accessibilityRole="button"
          accessibilityLabel="Minimize assistant"
        />
      </Animated.View>

      {/* Persistent Bottom Sheet Drawer (stays mounted to preserve state) */}
      <Animated.View
        pointerEvents={mode === "open" ? "auto" : "none"}
        style={[
          styles.drawerWrap,
          {
            height: sheetHeight,
            paddingBottom: insets.bottom,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Grabber handle */}
        <View style={styles.handleRow}>
          <View style={styles.handleBar} />
        </View>

        {/* Sticky Header: Segmented Control + Minimize + Close */}
        <View style={styles.drawerHeader}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === "chat" && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab("chat")}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "chat" }}
              accessibilityLabel="Ask AI"
            >
              <BotIcon
                size={15}
                color={activeTab === "chat" ? colors.white : colors.darkText}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "chat" && styles.segmentTextActive,
                ]}
              >
                Ask AI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                activeTab === "planner" && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab("planner")}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === "planner" }}
              accessibilityLabel="Plan Generator"
            >
              <MapSvgIcon
                size={15}
                color={activeTab === "planner" ? colors.white : colors.darkText}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === "planner" && styles.segmentTextActive,
                ]}
              >
                Plan Generator
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setMode("minimized")}
              accessibilityRole="button"
              accessibilityLabel="Minimize assistant"
            >
              <Ionicons name="remove" size={20} color={colors.darkText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => setMode("closed")}
              accessibilityRole="button"
              accessibilityLabel="Close assistant"
            >
              <Ionicons name="close" size={20} color={colors.darkText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body with persistent mounted panels */}
        <KeyboardAvoidingView
          style={styles.drawerBody}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={[
              styles.panelSlot,
              activeTab !== "chat" && styles.panelHidden,
            ]}
            pointerEvents={activeTab === "chat" ? "auto" : "none"}
          >
            <AssistantChatPanel
              variant="drawer"
              onSwitchToPlanner={() => setActiveTab("planner")}
            />
          </View>

          <View
            style={[
              styles.panelSlot,
              activeTab !== "planner" && styles.panelHidden,
            ]}
            pointerEvents={activeTab === "planner" ? "auto" : "none"}
          >
            <AssistantPlannerPanel />
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    elevation: 40,
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#003380",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 42,
  },
  miniPillWrap: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryBlue,
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 8,
    height: 44,
    gap: 6,
    shadowColor: "#003380",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    zIndex: 42,
  },
  miniPillMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  miniPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  miniPillClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chooserCard: {
    position: "absolute",
    right: 16,
    width: 268,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    zIndex: 43,
  },
  chooserHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chooserTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray,
    letterSpacing: 0.3,
  },
  chooserCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chooserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  chooserIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EBF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  chooserTextWrap: {
    flex: 1,
  },
  chooserRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
  },
  chooserRowSub: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  chooserDivider: {
    height: 1,
    backgroundColor: colors.grayLight,
    marginVertical: 2,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 44,
  },
  drawerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: "#DBE8F4",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
    zIndex: 45,
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.grayBorder,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
    gap: 8,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F0F4FF",
    borderRadius: 999,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  segmentBtnActive: {
    backgroundColor: colors.primaryBlue,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.darkText,
  },
  segmentTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerBody: {
    flex: 1,
  },
  panelSlot: {
    flex: 1,
  },
  panelHidden: {
    display: "none",
  },
});
