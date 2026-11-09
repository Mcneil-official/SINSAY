import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";

interface FileUploadProps {
  label: string;
  onPress?: () => void;
  onFileSelect?: (file: File | { name: string; mimeType?: string; size?: number; uri: string }) => void;
  fileName?: string;
  showCamera?: boolean;
  accept?: string;
}

export function FileUpload({
  label,
  onPress,
  onFileSelect,
  fileName,
  showCamera = false,
  accept = ".jpg,.jpeg,.png,.webp,.pdf",
}: FileUploadProps) {

  const createHiddenInput = (setup: (input: HTMLInputElement) => void) => {
    if (!onFileSelect || Platform.OS !== "web" || typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    setup(input);

    const cleanup = () => {
      try {
        if (input.parentNode) {
          document.body.removeChild(input);
        }
      } catch {}
    };

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) onFileSelect(file);
      cleanup();
    };
    input.oncancel = cleanup;

    document.body.appendChild(input);
    input.click();
  };

  const handleFileInput = () => {
    if (onPress) {
      onPress();
      return;
    }
    createHiddenInput((input) => {
      input.accept = accept;
    });
  };

  const handleCameraInput = () => {
    createHiddenInput((input) => {
      input.accept = "image/*";
      input.setAttribute("capture", "environment");
    });
  };

  const isMobileWeb = Platform.OS === "web" && typeof navigator !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.chip} onPress={handleFileInput} activeOpacity={0.7}>
        <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryBlue} />
        <Text style={styles.label}>{fileName || label}</Text>
        {fileName && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          </View>
        )}
      </TouchableOpacity>
      {showCamera && isMobileWeb && (
        <TouchableOpacity style={styles.cameraChip} onPress={handleCameraInput} activeOpacity={0.7}>
          <Ionicons name="camera" size={18} color={colors.primaryBlue} />
          <Text style={styles.label}>Take Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
  },
  cameraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.primaryBlue,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#EBF5FF",
  },
  label: {
    fontSize: 13,
    color: colors.primaryBlue,
    fontWeight: "500",
    flex: 1,
  },
  checkmark: {
    marginLeft: "auto",
  },
});
