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
  getOperatorRejectionSeenKey,
  shouldShowOperatorRejectionModal,
} from "../lib/operatorRejection";
import { supabase } from "../lib/supabase";

export { getOperatorRejectionSeenKey };

export function OperatorRejectionModal() {
  const router = useRouter();
  const { user, operatorApplication, notifications } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeModalAppIdRef = useRef<string | null>(null);

  const persistAcknowledged = useCallback(
    async (applicationId: string, syncRemote = true) => {
      const key = getOperatorRejectionSeenKey(applicationId);
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.setItem(key, "true");
        } catch {}
      }
      try {
        await AsyncStorage.setItem(key, "true");
      } catch (err) {
        console.warn("Failed to save operator rejection acknowledgement:", err);
      }
      if (!syncRemote) return;
      try {
        await supabase.auth.updateUser({
          data: {
            operator_rejection_seen_id: applicationId,
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
            .eq("type", "operator_application_rejected")
            .eq("is_read", false);
        } catch {}
      }
    },
    [user?.id],
  );

  useEffect(() => {
    let isCancelled = false;

    async function checkRejectionSeen() {
      if (!operatorApplication || operatorApplication.status !== "rejected") {
        activeModalAppIdRef.current = null;
        setVisible(false);
        return;
      }

      const appId = operatorApplication.id;
      if (activeModalAppIdRef.current === appId) {
        return;
      }

      try {
        const key = getOperatorRejectionSeenKey(appId);

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
          meta?.operator_rejection_seen_id === appId || meta?.[key] === true;

        const notifAlreadyRead = notifications.some(
          (n) => n.type === "operator_application_rejected" && n.is_read === true,
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

        const shouldShow = shouldShowOperatorRejectionModal({
          applicationId: appId,
          applicationStatus: operatorApplication.status,
          isAcknowledged,
        });

        if (!isCancelled && shouldShow) {
          activeModalAppIdRef.current = appId;
          setVisible(true);
          void persistAcknowledged(appId, false);
        }
      } catch (err) {
        console.warn("Failed to check operator rejection seen status:", err);
      }
    }

    void checkRejectionSeen();

    return () => {
      isCancelled = true;
    };
  }, [operatorApplication, user?.id, user?.user_metadata, notifications, persistAcknowledged]);

  if (!visible || !operatorApplication) {
    return null;
  }

  const resortName = operatorApplication.resort_name?.trim() || "your establishment";
  const rejectionReason = operatorApplication.rejection_reason?.trim();

  const handleDismiss = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setVisible(false);
    setIsProcessing(false);
    void persistAcknowledged(operatorApplication.id, true);
  };

  const handleReviewAndReapply = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setVisible(false);
    setIsProcessing(false);
    void persistAcknowledged(operatorApplication.id, true);
    router.push("/profile/apply-operator");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.card}
          accessibilityRole="alert"
          accessibilityLabel="Operator application rejection notice"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Red Close Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="close-circle" size={48} color={colors.red} />
          </View>

          {/* Eyebrow */}
          <Text style={styles.eyebrow}>MABINI TOURISM OFFICE</Text>

          {/* Title */}
          <Text style={styles.title}>Application Not Approved</Text>

          {/* Message */}
          <Text style={styles.message}>
            Your application to register{" "}
            <Text style={styles.resortHighlight}>{resortName}</Text> as a dive
            establishment was not approved by the Tourism Office.
          </Text>

          {/* Rejection Reason box */}
          {rejectionReason ? (
            <View style={styles.reasonBox}>
              <View style={styles.reasonHeader}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.red} />
                <Text style={styles.reasonLabel}>Reason for Rejection</Text>
              </View>
              <Text style={styles.reasonText}>{rejectionReason}</Text>
            </View>
          ) : null}

          <Text style={styles.hintText}>
            You can review your information, update your documents, and submit a new application.
          </Text>

          {/* Side-by-Side Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleDismiss}
              disabled={isProcessing}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notice"
            >
              <Text style={styles.secondaryBtnText} numberOfLines={1}>
                Dismiss
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleReviewAndReapply}
              disabled={isProcessing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Review and Re-apply"
            >
              <Text style={styles.primaryBtnText} numberOfLines={1}>
                Review & Re-apply
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
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 10,
    letterSpacing: 1.1,
    color: colors.red,
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
    marginBottom: 12,
  },
  resortHighlight: {
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  reasonBox: {
    width: "100%",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  reasonLabel: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 11,
    color: "#B91C1C",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 12.5,
    lineHeight: 17,
    color: "#7F1D1D",
  },
  hintText: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 11.5,
    lineHeight: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 18,
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
    flex: 1.35,
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

export default OperatorRejectionModal;
