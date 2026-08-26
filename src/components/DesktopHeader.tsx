import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { colors } from "../constants/colors";

interface DesktopHeaderProps {
  sidebarWidth: number;
}

export default function DesktopHeader({ sidebarWidth }: DesktopHeaderProps) {
  const { profile, unreadCount } = useAuth();

  return (
    <View style={[styles.header, { marginLeft: sidebarWidth }]}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>
          {getGreeting()}, {profile?.full_name?.split(" ")[0] || "Diver"}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <View style={styles.notifWrapper}>
          <Ionicons name="notifications-outline" size={22} color={colors.darkText} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={colors.white} />
        </View>
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    right: 0,
    height: 64,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBorder,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    zIndex: 90,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.darkText,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  notifWrapper: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.red,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
});
