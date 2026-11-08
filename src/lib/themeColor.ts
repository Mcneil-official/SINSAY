import { Platform } from "react-native";

/**
 * Dynamically updates the browser / PWA theme color and iOS status bar style.
 * This controls the color of the native Android navigation bar (bottom 3 buttons),
 * the top status bar, and iOS Safari status bar/overscroll background.
 *
 * @param themeColor The system theme color (used for Android status bar and browser chrome)
 * @param appleStatusBarStyle iOS status bar style ("default" for dark icons, "black-translucent" for white icons over dark/blue headers)
 * @param canvasBackground The underlying background color for html, body, and #root.
 */
export function setSystemThemeColor(
  themeColor: string,
  appleStatusBarStyle: "default" | "black-translucent" = "default",
  canvasBackground: string = "#FFFFFF"
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

    // 3. Keep body, html, and #root background colors synchronized with canvasBackground
    // On tab screens, canvasBackground is #FFFFFF so that the area below the white navbar is seamless white.
    // On Splash & Auth screens, canvasBackground is blue (#005AF1) so no white strip appears.
    // On Onboarding screens, canvasBackground is #f8f7f5 matching the onboarding background.
    if (document.body) {
      document.body.style.backgroundColor = canvasBackground;
    }
    if (document.documentElement) {
      document.documentElement.style.backgroundColor = canvasBackground;
    }
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.setProperty("background-color", canvasBackground, "important");
    }
  } catch {
    // Non-DOM runtimes silently no-op
  }
}
