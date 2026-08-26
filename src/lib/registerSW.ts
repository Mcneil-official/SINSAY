import { Platform } from "react-native";

export function registerServiceWorker() {
  if (Platform.OS !== "web") return;
  if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
  if (process.env.NODE_ENV !== "production") return;

  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      console.log("[SW] Registered:", reg.scope);
    })
    .catch((err) => {
      console.warn("[SW] Registration failed:", err);
    });
}
