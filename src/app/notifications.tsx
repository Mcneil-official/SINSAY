import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";

const notifIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  eco_dive_activated: "checkmark-circle",
  dive_plan_ready: "map",
  operator_application_approved: "checkmark-done",
  operator_application_rejected: "close-circle",
  pass_purchase_verified: "wallet",
};

const notifColors: Record<string, string> = {
  eco_dive_activated: colors.green,
  dive_plan_ready: colors.primaryBlue,
  operator_application_approved: colors.green,
  operator_application_rejected: colors.red,
  pass_purchase_verified: colors.amber,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, fetchNotifications, markAllNotificationsRead, isLoading } = useAuth();

  useEffect(() => {
    fetchNotifications();
    markAllNotificationsRead();
  }, []);

  const handleNotificationPress = useCallback(
    async (notif: typeof notifications[0]) => {
      if (notif.deep_link) {
        router.push(notif.deep_link as any);
      }
    },
    [router]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.gray} />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((notif) => {
            const icon = notifIcons[notif.type] || "ellipse";
            const iconColor = notifColors[notif.type] || colors.gray;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifRow, !notif.is_read && styles.notifRowUnread]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.6}
              >
                <View style={[styles.notifIcon, { backgroundColor: iconColor + "15" }]}>
                  <Ionicons name={icon} size={20} color={iconColor} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{notif.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {notif.body}
                  </Text>
                  <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
                </View>
                {!notif.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.darkText,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
    marginTop: 8,
  },
  notifRowUnread: {
    backgroundColor: "#F5F8FF",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.darkText,
  },
  notifBody: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
    lineHeight: 16,
  },
  notifTime: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray,
  },
});
