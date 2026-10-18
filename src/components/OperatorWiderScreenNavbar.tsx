import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";

export default function OperatorWiderScreenNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useAuth();

  // Active state determination for operator links
  const isHomeActive =
    pathname === "/(operator-tabs)" ||
    pathname === "/(operator-tabs)/index" ||
    pathname === "/";

  const isManifestsActive =
    pathname.includes("manifests") ||
    pathname.startsWith("/(operator-tabs)/manifests");

  const isBuyPassActive =
    pathname.includes("buy-pass") ||
    pathname.startsWith("/(operator-tabs)/buy-pass");

  const isProfileActive =
    pathname.includes("profile") ||
    pathname.startsWith("/(operator-tabs)/profile");

  return (
    <View style={styles.wrapper}>
      <View style={styles.navbar}>
        {/* Left Wing: Home and Dive Manifesto */}
        <View style={styles.navGroupLeft}>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(operator-tabs)")}
            accessibilityRole="link"
            accessibilityState={{ selected: isHomeActive }}
            accessibilityLabel="Home"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isHomeActive && styles.navTextActive,
              ]}
            >
              Home
            </Text>
            {isHomeActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(operator-tabs)/manifests")}
            accessibilityRole="link"
            accessibilityState={{ selected: isManifestsActive }}
            accessibilityLabel="Dive Manifesto"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isManifestsActive && styles.navTextActive,
              ]}
            >
              Dive Manifesto
            </Text>
            {isManifestsActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Center: Real SINSAY Logo */}
        <TouchableOpacity
          style={styles.logoBtn}
          onPress={() => router.push("/(operator-tabs)")}
          accessibilityRole="button"
          accessibilityLabel="SINSAY Operator Home"
          activeOpacity={0.8}
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            contentFit="contain"
            accessibilityLabel="SINSAY"
          />
        </TouchableOpacity>

        {/* Right Wing: Buy Dive Pass, Profile, and Notification Bell */}
        <View style={styles.navGroupRight}>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(operator-tabs)/buy-pass")}
            accessibilityRole="link"
            accessibilityState={{ selected: isBuyPassActive }}
            accessibilityLabel="Buy Dive Pass"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isBuyPassActive && styles.navTextActive,
              ]}
            >
              Buy Dive Pass
            </Text>
            {isBuyPassActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(operator-tabs)/profile")}
            accessibilityRole="link"
            accessibilityState={{ selected: isProfileActive }}
            accessibilityLabel="Profile"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isProfileActive && styles.navTextActive,
              ]}
            >
              Profile
            </Text>
            {isProfileActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Far Right: Notification Bell */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => router.push("/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color="#334155" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    zIndex: 100,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 12,
  },
  navbar: {
    width: "92%",
    maxWidth: 980,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: "relative",
  },
  navGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    flex: 1,
  },
  navGroupRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    flex: 1,
  },
  navLink: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 0.1,
  },
  navTextActive: {
    color: "#005EEC",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#005EEC",
  },
  logoBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  logoImage: {
    width: 140,
    height: 32,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginLeft: 4,
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.red || "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
