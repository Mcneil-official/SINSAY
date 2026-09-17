import { Alert, Platform } from "react-native";

interface ConfirmLabels {
  cancelText?: string;
  confirmText?: string;
}

// Cross-platform confirm dialog. Alert.alert is a no-op on web
// (react-native-web stubs it), so use window.confirm there instead.
export function confirmDialog(
  title: string,
  message: string,
  labels: ConfirmLabels = {},
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n${message}`));
  }
  const { cancelText = "Cancel", confirmText = "Confirm" } = labels;
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

// Cross-platform info alert. Same web no-op reason as above.
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
