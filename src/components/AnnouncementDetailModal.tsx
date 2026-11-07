import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { AnnouncementRow } from "../types/supabase";

const DEFAULT_BANNER = require("../../assets/hero-banner.jpg");

export const DEFAULT_CONSERVATION_ADVISORY: AnnouncementRow = {
  id: "default-conservation",
  title: "Protect Mabini's Vibrant Coral Reefs",
  body: `Mabini enforces a strict no-touch and no-take policy for all corals, sea turtles, and marine species under Municipal Ordinance No. 031-2023.

All visiting divers, freedivers, and snorkelers are required to:
1. Maintain an active digital Eco-Dive ID before every dive trip.
2. Dive exclusively under the supervision of PCSSD-accredited and DOT-recognized dive centers and certified local dive guides.
3. Master neutral buoyancy control—never rest, stand, or kick fins against live coral formations or sandy muck habitats.
4. Strictly refrain from using single-use plastics aboard dive boats and use only reef-safe sunscreen (free of oxybenzone and octinoxate).

Failure to comply with local marine sanctuary ordinances is subject to municipal fines and revocation of diving privileges. Let's work together to preserve the world-class biodiversity of the Verde Island Passage for future generations.`,
  active: true,
  priority: 10,
  image_url: null,
  photo_url: null,
  barangay: "Mabini Marine Sanctuaries",
  start_date: null,
  end_date: null,
  created_at: new Date().toISOString(),
};

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface AnnouncementDetailModalProps {
  visible: boolean;
  announcement: AnnouncementRow | null;
  onClose: () => void;
}

export function AnnouncementDetailModal({
  visible,
  announcement,
  onClose,
}: AnnouncementDetailModalProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth > 640;
  const sheetWidth = isWide ? Math.min(screenWidth - 32, 540) : "100%";
  const sheetMaxHeight = Math.min(screenHeight * 0.88, 760);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 4,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible || !announcement) return null;

  const heroSource = announcement.image_url
    ? { uri: announcement.image_url }
    : announcement.photo_url
    ? { uri: announcement.photo_url }
    : DEFAULT_BANNER;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[
            styles.drawerSheet,
            { width: sheetWidth, maxHeight: sheetMaxHeight },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Top handle and drag responder area */}
          <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
            <View style={styles.dragPill} />
            <View style={styles.headerRow}>
              <View style={styles.officialPill}>
                <View style={styles.badgeDot} />
                <Text style={styles.officialPillText}>MABINI TOURISM ADVISORY</Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                hitSlop={12}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close announcement modal"
              >
                <Ionicons name="close" size={18} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Scrollable announcement content */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Image Wrap */}
            <View style={styles.heroWrap}>
              <Image
                source={heroSource}
                style={styles.heroImage}
                contentFit="cover"
                priority="high"
              />

              <View style={styles.gradientOverlay} pointerEvents="none">
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <Defs>
                    <LinearGradient id="modalHeroGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#020817" stopOpacity="0" />
                      <Stop offset="0.45" stopColor="#020817" stopOpacity="0.3" />
                      <Stop offset="0.85" stopColor="#020817" stopOpacity="0.8" />
                      <Stop offset="1" stopColor="#020817" stopOpacity="0.94" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#modalHeroGrad)" />
                </Svg>
              </View>

              {announcement.priority >= 5 && (
                <View style={styles.priorityBadge}>
                  <Ionicons name="alert-circle" size={13} color="#FFFFFF" />
                  <Text style={styles.priorityBadgeText}>Official Notice</Text>
                </View>
              )}
            </View>

            {/* Announcement Title */}
            <Text style={styles.titleText}>{announcement.title.trim()}</Text>

            {/* Metadata Badges: Date, Location */}
            <View style={styles.metaRow}>
              {announcement.created_at ? (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.primaryBlue} />
                  <Text style={styles.metaText}>{formatDate(announcement.created_at)}</Text>
                </View>
              ) : null}

              {announcement.barangay ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color="#059669" />
                  <Text style={styles.metaText}>{announcement.barangay}</Text>
                </View>
              ) : null}

              {(announcement.start_date || announcement.end_date) && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={13} color="#D97706" />
                  <Text style={styles.metaText}>
                    {[announcement.start_date, announcement.end_date]
                      .filter(Boolean)
                      .map((s) => formatDate(s!))
                      .join(" – ")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Full Body Text */}
            <Text style={styles.bodyText}>
              {announcement.body ? announcement.body.trim() : "No additional details provided."}
            </Text>

            {/* Bottom Dismiss Action */}
            <TouchableOpacity
              style={styles.bottomCloseBtn}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notice"
            >
              <Text style={styles.bottomCloseBtnText}>Close Notice</Text>
            </TouchableOpacity>

            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 13, 31, 0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  drawerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  dragHandleArea: {
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dragPill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  officialPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(8, 123, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(8, 123, 255, 0.2)",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryBlue,
  },
  officialPillText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
    letterSpacing: 0.6,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroWrap: {
    height: 164,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0B192C",
    marginBottom: 16,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
  },
  priorityBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(220, 38, 38, 0.88)",
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    letterSpacing: 0.3,
  },
  titleText: {
    fontSize: 19,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    lineHeight: 25,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDF2F7",
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 13.5,
    fontFamily: "Quicksand_500Medium",
    color: "#334155",
    lineHeight: 21,
    marginBottom: 20,
  },
  bottomCloseBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bottomCloseBtnText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
});
