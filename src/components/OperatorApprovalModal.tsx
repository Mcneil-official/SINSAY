import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import {
  markFirstTimeOperatorTutorialPending,
  notifyTutorialTrigger,
  setOperatorApprovalModalOpen,
} from "../lib/onboarding";
import {
  getOperatorApprovalSeenKey,
  shouldShowOperatorApprovalModal,
} from "../lib/operatorApproval";
import { supabase } from "../lib/supabase";

export { getOperatorApprovalSeenKey };

export function OperatorApprovalModal() {
  const router = useRouter();
  const { user, operatorApplication, isOperator, notifications, setViewAsTourist } =
    useAuth();
  const [visible, setVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeModalAppIdRef = useRef<string | null>(null);

  const persistAcknowledged = useCallback(
    async (applicationId: string, syncRemote = true) => {
      const key = getOperatorApprovalSeenKey(applicationId);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(key, "true");
        } catch {}
      }
      try {
        await AsyncStorage.setItem(key, "true");
      } catch (err) {
        console.warn("Failed to save operator approval acknowledgement:", err);
      }
      if (!syncRemote) return;
      try {
        await supabase.auth.updateUser({
          data: {
            operator_approval_seen_id: applicationId,
            [key]: true,
          },
        });
      } catch {}
      if (user?.id) {
        try {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("tourist_id", user.id)
            .eq("type", "operator_application_approved")
            .eq("is_read", false);
        } catch {}
      }
    },
    [user?.id],
  );

  useEffect(() => {
    let isCancelled = false;

    async function checkApprovalSeen() {
      if (!operatorApplication || operatorApplication.status !== "approved") {
        activeModalAppIdRef.current = null;
        setVisible(false);
        setOperatorApprovalModalOpen(false);
        return;
      }

      const appId = operatorApplication.id;
      // If the modal is already open for this application, keep it open until the user clicks a CTA button
      if (activeModalAppIdRef.current === appId) {
        return;
      }

      try {
        const key = getOperatorApprovalSeenKey(appId);

        let localSeen = false;
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            localSeen = window.localStorage.getItem(key) === "true";
          } catch {}
        }
        if (!localSeen) {
          const asyncSeen = await AsyncStorage.getItem(key);
          localSeen = asyncSeen === "true";
        }

        const meta = user?.user_metadata as Record<string, unknown> | undefined;
        const metaSeen =
          meta?.operator_approval_seen_id === appId || meta?.[key] === true;

        const notifAlreadyRead = notifications.some(
          (n) => n.type === "operator_application_approved" && n.is_read === true,
        );

        const isAcknowledged = localSeen || metaSeen || notifAlreadyRead;

        if (isAcknowledged && !localSeen) {
          if (typeof window !== "undefined" && window.localStorage) {
            try {
              window.localStorage.setItem(key, "true");
            } catch {}
          }
          await AsyncStorage.setItem(key, "true").catch(() => {});
        }

        const shouldShow = shouldShowOperatorApprovalModal({
          applicationId: appId,
          applicationStatus: operatorApplication.status,
          isAcknowledged,
        });

        if (!isCancelled && shouldShow) {
          activeModalAppIdRef.current = appId;
          setVisible(true);
          setOperatorApprovalModalOpen(true);
          if (user?.id) {
            markFirstTimeOperatorTutorialPending(user.id);
          }
          // Save locally right away so page reloads don't re-show the modal,
          // and sync remote metadata when the user clicks a CTA button.
          void persistAcknowledged(appId, false);
        }
      } catch (err) {
        console.warn("Failed to check operator approval seen status:", err);
      }
    }

    void checkApprovalSeen();

    return () => {
      isCancelled = true;
    };
  }, [operatorApplication, isOperator, user?.id, user?.user_metadata, notifications, persistAcknowledged]);

  if (!visible || !operatorApplication) {
    return null;
  }

  const resortName = operatorApplication.resort_name?.trim() || "your establishment";

  const handleSwitchToOperator = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    if (user?.id) {
      markFirstTimeOperatorTutorialPending(user.id);
    }
    setOperatorApprovalModalOpen(false);
    setViewAsTourist(false);
    setVisible(false);
    setIsProcessing(false);
    notifyTutorialTrigger();
    void persistAcknowledged(operatorApplication.id, true);
    router.replace("/(operator-tabs)");
  };

  const handleStayInTouristMode = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    if (user?.id) {
      markFirstTimeOperatorTutorialPending(user.id);
    }
    setOperatorApprovalModalOpen(false);
    setViewAsTourist(true);
    setVisible(false);
    setIsProcessing(false);
    notifyTutorialTrigger();
    void persistAcknowledged(operatorApplication.id, true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleStayInTouristMode}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.card}
          accessibilityRole="alert"
          accessibilityLabel="Operator approval notice"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Larger Green Check Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={48} color="#059669" />
          </View>

          {/* Eyebrow */}
          <Text style={styles.eyebrow}>MABINI TOURISM OFFICE</Text>

          {/* Title */}
          <Text style={styles.title}>You have been approved as an operator!</Text>

          {/* Message */}
          <Text style={styles.message}>
            Congratulations! Your application to register{" "}
            <Text style={styles.resortHighlight}>{resortName}</Text> as a dive
            establishment has been approved. You now have full access to
            manage dive manifests, procure dive passes, and handle resort guests.
          </Text>

          {/* Side-by-Side Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleStayInTouristMode}
              disabled={isProcessing}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Stay in Tourist Mode"
            >
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                Stay in Tourist Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSwitchToOperator}
              disabled={isProcessing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Switch to Operator Dashboard"
            >
              <Text style={styles.primaryBtnText} numberOfLines={1}>
                Operator Dashboard
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    zIndex: 99999,
  },
  card: {
    width: "100%",
    maxWidth: 370,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 10,
    letterSpacing: 1.1,
    color: "#059669",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 16.5,
    lineHeight: 21,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 12.5,
    lineHeight: 18,
    color: "#475569",
    textAlign: "center",
    marginBottom: 18,
  },
  resortHighlight: {
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  actionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  secondaryBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 11.5,
    color: "#334155",
    textAlign: "center",
  },
  primaryBtn: {
    flex: 1.15,
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryBlue || "#005EEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
  },
  primaryBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 11.5,
    color: "#FFFFFF",
    textAlign: "center",
  },
});

export default OperatorApprovalModal;
