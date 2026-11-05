import { Platform } from "react-native";

/**
 * Dynamically updates the browser / PWA theme color and iOS status bar style.
 * This controls the color of the native Android navigation bar (bottom 3 buttons),
 * the top status bar, and iOS Safari status bar/overscroll background.
 */
export function setSystemThemeColor(
  themeColor: string,
  appleStatusBarStyle: "default" | "black-translucent" = "default"
) {
  if (Platform.OS !== "web") return;
  try {
    if (typeof document === "undefined") return;

    // 1. Update or create <meta name="theme-color">
    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement("meta");
      metaTheme.setAttribute("name", "theme-color");
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute("content", themeColor);

    // 2. Update or create <meta name="apple-mobile-web-app-status-bar-style"> for iOS
    let metaApple = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (!metaApple) {
      metaApple = document.createElement("meta");
      metaApple.setAttribute(
        "name",
        "apple-mobile-web-app-status-bar-style"
      );
      document.head.appendChild(metaApple);
    }
    metaApple.setAttribute("content", appleStatusBarStyle);

    // 3. Ensure document body and html background colors match
    // This prevents overscroll elastic bounce or edge letterboxing from showing mismatched colors on iOS & Android
    if (document.body) {
      document.body.style.backgroundColor = themeColor;
    }
    if (document.documentElement) {
      document.documentElement.style.backgroundColor = themeColor;
    }
  } catch {
    // Non-DOM runtimes silently no-op
  }
}
