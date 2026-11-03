import { Alert, Platform } from "react-native";

interface ConfirmLabels {
  cancelText?: string;
  confirmText?: string;
}

// Cross-platform confirm dialog. In browser iframes, window.confirm can be blocked.
export function confirmDialog(
  title: string,
  message: string,
  labels: ConfirmLabels = {},
): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && typeof window.confirm === "function") {
        return Promise.resolve(window.confirm(`${title}\n${message}`));
      }
    } catch (e) {
      console.warn("window.confirm blocked or unavailable:", e);
    }
    return Promise.resolve(true);
  }
  const { cancelText = "Cancel", confirmText = "Confirm" } = labels;
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

// Cross-platform info alert. In browser iframes, window.alert can be blocked.
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert(message ? `${title}\n${message}` : title);
        return;
      }
    } catch (e) {
      console.warn("window.alert blocked or unavailable:", e);
    }
    console.info(`[Alert] ${title}: ${message || ""}`);
    return;
  }
  Alert.alert(title, message);
}
