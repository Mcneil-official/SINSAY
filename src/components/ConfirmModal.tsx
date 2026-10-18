import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon = "alert-circle-outline",
  destructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={isLoading ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              destructive ? styles.iconCircleDestructive : styles.iconCirclePrimary,
            ]}
          >
            <Ionicons
              name={icon}
              size={26}
              color={destructive ? colors.red || "#EF4444" : colors.primaryBlue || "#005EEC"}
            />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                destructive ? styles.confirmBtnDestructive : styles.confirmBtnPrimary,
              ]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconCircleDestructive: {
    backgroundColor: "#FEE2E2",
  },
  iconCirclePrimary: {
    backgroundColor: "#EFF6FF",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnPrimary: {
    backgroundColor: colors.primaryBlue || "#005EEC",
  },
  confirmBtnDestructive: {
    backgroundColor: colors.red || "#EF4444",
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
