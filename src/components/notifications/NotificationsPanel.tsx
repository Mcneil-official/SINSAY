import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { EmptyState } from "../EmptyState";
import { resolveNotificationRoute } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { AnnouncementRow, NotificationRow } from "../../types/supabase";
import { DEFAULT_CONSERVATION_ADVISORY } from "../AnnouncementDetailModal";

const notifIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  eco_dive_activated: "checkmark-circle",
  dive_plan_ready: "map",
  operator_application_approved: "checkmark-done",
  operator_application_rejected: "close-circle",
  pass_purchase_verified: "wallet",
  manifest_submitted: "document-text",
  announcement_published: "megaphone",
};

const notifColors: Record<string, string> = {
  eco_dive_activated: colors.green,
  dive_plan_ready: colors.primaryBlue,
  operator_application_approved: colors.green,
  operator_application_rejected: colors.red,
  pass_purchase_verified: colors.green,
  manifest_submitted: colors.primaryBlue,
  announcement_published: colors.amberDark,
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

export interface NotificationsPanelProps {
  variant?: "modal" | "page";
  onClose?: () => void;
  onOpenAnnouncement?: (announcement: AnnouncementRow) => void;
}

export function NotificationsPanel({
  variant = "modal",
  onClose,
  onOpenAnnouncement,
}: NotificationsPanelProps) {
  const router = useRouter();
  const { notifications, fetchNotifications, isLoading } = useAuth();
  const [activeAnnouncements, setActiveAnnouncements] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetchNotifications();
    supabase
      .from("announcements")
      .select("id, title")
      .eq("status", "published")
      .then(({ data }) => {
        if (data) setActiveAnnouncements(data);
      });
  }, [fetchNotifications]);

  const handleNotificationPress = useCallback(
    async (notif: NotificationRow) => {
      // If announcement notification, open modal instead of route
      if (notif.type === "announcement_published") {
        let announcementData: AnnouncementRow | null = null;
        let announcementId: string | null = null;

        const match = notif.deep_link?.match(/^\/announcement\/(.+)$/);
        if (match && match[1]) {
          announcementId = match[1];
        } else if (notif.title) {
          const found = activeAnnouncements.find(
            (a) => a.title.trim().toLowerCase() === notif.title?.trim().toLowerCase()
          );
          if (found) announcementId = found.id;
        }

        if (announcementId && announcementId !== "default-conservation") {
          const { data } = await supabase
            .from("announcements")
            .select("*")
            .eq("id", announcementId)
            .maybeSingle();
          if (data) announcementData = data as AnnouncementRow;
        }

        if (!announcementData && notif.title) {
          const { data } = await supabase
            .from("announcements")
            .select("*")
            .ilike("title", notif.title.trim())
            .maybeSingle();
          if (data) announcementData = data as AnnouncementRow;
        }

        const finalAnnouncement = announcementData || {
          ...DEFAULT_CONSERVATION_ADVISORY,
          title: notif.title || DEFAULT_CONSERVATION_ADVISORY.title,
          body: notif.body || DEFAULT_CONSERVATION_ADVISORY.body,
        };

        if (onClose) onClose();
        if (onOpenAnnouncement) {
          onOpenAnnouncement(finalAnnouncement);
        } else {
          // If no modal callback provided (e.g. standalone page without modal context), route to it
          router.push(`/announcement/${finalAnnouncement.id}` as any);
        }
        return;
      }

      // For all other notification types, resolve destination route
      const dest = resolveNotificationRoute(notif, activeAnnouncements);
      if (onClose) onClose();
      router.push(dest as any);
    },
    [router, activeAnnouncements, onClose, onOpenAnnouncement]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primaryBlue} />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState icon="notifications-off-outline" message="No notifications yet" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        variant === "page" && styles.pageScrollContent,
      ]}
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
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={`${notif.title}. ${notif.body}`}
          >
            <View style={[styles.notifIcon, { backgroundColor: iconColor + "15" }]}>
              <Ionicons name={icon} size={19} color={iconColor} />
            </View>

            <View style={styles.notifContent}>
              <View style={styles.notifTitleRow}>
                <Text style={styles.notifTitle} numberOfLines={1}>
                  {notif.title}
                </Text>
                {!notif.is_read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifBody} numberOfLines={2}>
                {notif.body}
              </Text>
              <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={15}
              color="#94A3B8"
              style={styles.chevron}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 24,
  },
  pageScrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 11,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  notifRowUnread: {
    backgroundColor: "#F6F9FF",
    borderColor: "#E0EBFF",
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  notifTitle: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    flex: 1,
  },
  notifBody: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16.5,
  },
  notifTime: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
    marginTop: 4,
  },
  chevron: {
    alignSelf: "center",
    marginLeft: 4,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primaryBlue,
  },
});
