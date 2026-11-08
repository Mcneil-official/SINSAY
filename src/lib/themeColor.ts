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

    // 1. Update or create all <meta name="theme-color"> tags
    const metaThemes = document.querySelectorAll('meta[name="theme-color"]');
    if (metaThemes.length === 0) {
      const metaTheme = document.createElement("meta");
      metaTheme.setAttribute("name", "theme-color");
      metaTheme.setAttribute("content", themeColor);
      document.head.appendChild(metaTheme);
    } else {
      metaThemes.forEach((el) => el.setAttribute("content", themeColor));
    }

    // 2. Update or create all <meta name="apple-mobile-web-app-status-bar-style"> tags
    const metaApples = document.querySelectorAll(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    if (metaApples.length === 0) {
      const metaApple = document.createElement("meta");
      metaApple.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      metaApple.setAttribute("content", appleStatusBarStyle);
      document.head.appendChild(metaApple);
    } else {
      metaApples.forEach((el) => el.setAttribute("content", appleStatusBarStyle));
    }

    // 3. Keep body, html, and #root background colors synchronized
    // This prevents overscroll elastic bounce or edge letterboxing from showing mismatched colors on iOS & Android
    if (document.body) {
      document.body.style.backgroundColor = themeColor;
    }
    if (document.documentElement) {
      document.documentElement.style.backgroundColor = themeColor;
    }
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.setProperty("background-color", themeColor, "important");
    }
  } catch {
    // Non-DOM runtimes silently no-op
  }
}
