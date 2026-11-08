import { Platform } from "react-native";

export function registerServiceWorker() {
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1. Ensure PWA link & meta tags exist in the document head
  try {
    const head = document.head;

    if (!head.querySelector('link[rel="manifest"]')) {
      const manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = "/manifest.json";
      head.appendChild(manifestLink);
    }

    if (!head.querySelector('link[rel="apple-touch-icon"]')) {
      const appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      appleTouchIcon.sizes = "180x180";
      appleTouchIcon.href = "/pwa-apple-touch-icon.png";
      head.appendChild(appleTouchIcon);
    }

    const metas = [
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "SINSAY" },
      { name: "application-name", content: "SINSAY" },
      { name: "theme-color", content: "#FFFFFF" },
    ];

    metas.forEach(({ name, content }) => {
      if (!head.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement("meta");
        meta.name = name;
        meta.content = content;
        head.appendChild(meta);
      }
    });
  } catch (e) {
    console.debug("[PWA] Meta injection note:", e);
  }

  // 2. Register Service Worker
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  // Only skip if explicitly on non-https and not localhost
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.endsWith(".localhost");

  if (!isLocalhost && window.location.protocol !== "https:") {
    console.warn("[SW] Service Workers require HTTPS or localhost");
    return;
  }

  // Listen for active worker change to reload page with fresh assets
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registered successfully with scope:", reg.scope);
        // Force an immediate check for updated sw.js
        reg.update().catch(() => {});
      })
      .catch((err) => {
        console.warn("[SW] Registration failed:", err);
      });
  });
}