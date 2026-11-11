import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  getOperatorApprovalSeenKey,
  shouldShowOperatorApprovalModal,
} from "../lib/operatorApproval";

export { getOperatorApprovalSeenKey };

export function OperatorApprovalModal() {
  const router = useRouter();
  const { operatorApplication, isOperator, setViewAsTourist } = useAuth();
  const [visible, setVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function checkApprovalSeen() {
      if (!operatorApplication || operatorApplication.status !== "approved") {
        setVisible(false);
        return;
      }

      try {
        const key = getOperatorApprovalSeenKey(operatorApplication.id);
        const seen = await AsyncStorage.getItem(key);
        const shouldShow = shouldShowOperatorApprovalModal({
          applicationId: operatorApplication.id,
          applicationStatus: operatorApplication.status,
          isAcknowledged: seen === "true",
        });
        if (!isCancelled) {
          setVisible(shouldShow);
        }
      } catch (err) {
        console.warn("Failed to check operator approval seen status:", err);
      }
    }

    void checkApprovalSeen();

    return () => {
      isCancelled = true;
    };
  }, [operatorApplication, isOperator]);

  if (!visible || !operatorApplication) {
    return null;
  }

  const resortName = operatorApplication.resort_name?.trim() || "your establishment";

  const markAcknowledged = async () => {
    try {
      const key = getOperatorApprovalSeenKey(operatorApplication.id);
      await AsyncStorage.setItem(key, "true");
    } catch (err) {
      console.warn("Failed to save operator approval acknowledgement:", err);
    }
  };

  const handleSwitchToOperator = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await markAcknowledged();
    setViewAsTourist(false);
    setVisible(false);
    setIsProcessing(false);
    router.replace("/(operator-tabs)");
  };

  const handleStayInTouristMode = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    await markAcknowledged();
    setViewAsTourist(true);
    setVisible(false);
    setIsProcessing(false);
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
          {/* Badge icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-circle" size={32} color="#0D9488" />
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

          {/* Actions */}
          <View style={styles.actionColumn}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleSwitchToOperator}
              disabled={isProcessing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Switch to Operator Dashboard"
            >
              <Text style={styles.primaryBtnText}>
                Switch to Operator Dashboard
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handleStayInTouristMode}
              disabled={isProcessing}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Stay in Tourist Mode"
            >
              <Text style={styles.secondaryBtnText}>
                Stay in Tourist Mode
              </Text>
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
    padding: 20,
    zIndex: 99999,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    color: "#0D9488",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 19,
    lineHeight: 24,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    fontFamily: "Quicksand_500Medium",
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    textAlign: "center",
    marginBottom: 24,
  },
  resortHighlight: {
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  actionColumn: {
    width: "100%",
    gap: 10,
  },
  primaryBtn: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryBlue || "#005EEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  primaryBtnText: {
    fontFamily: "Quicksand_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  secondaryBtn: {
    width: "100%",
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontFamily: "Quicksand_600SemiBold",
    fontSize: 14,
    color: "#334155",
  },
});

export default OperatorApprovalModal;
