import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationModal } from "../../context/NotificationModalContext";
import { NotificationsPanel } from "./NotificationsPanel";

export function NotificationsModal() {
  const { isNotifModalOpen, closeNotifications, openAnnouncementModal } = useNotificationModal();
  const { unreadCount, markAllNotificationsRead } = useAuth();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const anim = useRef(new Animated.Value(0)).current;
  const useNative = Platform.OS !== "web";

  useEffect(() => {
    if (isNotifModalOpen) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      }).start();
    } else {
      anim.setValue(0);
    }
  }, [isNotifModalOpen, anim, useNative]);

  if (!isNotifModalOpen) return null;

  const cardScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const cardOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const modalWidth = Math.min(screenWidth - 32, 480);
  const modalMaxHeight = Math.min(screenHeight * 0.82, 680);

  return (
    <Modal
      visible={isNotifModalOpen}
      transparent
      animationType="none"
      onRequestClose={closeNotifications}
    >
      <View style={styles.modalOverlay}>
        {/* Dimmed backdrop (tap to dismiss) */}
        <Animated.View style={[styles.backdrop, { opacity: cardOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeNotifications}
            accessibilityRole="button"
            accessibilityLabel="Close notifications modal"
          />
        </Animated.View>

        {/* Floating Card Modal */}
        <Animated.View
          style={[
            styles.floatingCard,
            {
              width: modalWidth,
              maxHeight: modalMaxHeight,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.bellBadge}>
                <Ionicons name="notifications" size={17} color={colors.primaryBlue} />
              </View>
              <Text style={styles.modalTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadChip}>
                  <Text style={styles.unreadChipText}>{unreadCount} new</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={markAllNotificationsRead}
                  style={styles.markAllBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                >
                  <Text style={styles.markAllText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={closeNotifications}
                style={styles.closeBtn}
                hitSlop={8}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Panel Body */}
          <NotificationsPanel
            variant="modal"
            onClose={closeNotifications}
            onOpenAnnouncement={openAnnouncementModal}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(3, 14, 38, 0.45)",
  },
  floatingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#021235",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
    zIndex: 50,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bellBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  unreadChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  unreadChipText: {
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  markAllText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
});
