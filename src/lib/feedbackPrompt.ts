export const STORAGE_KEY_FEEDBACK_SUBMITTED = "@sinsay_feedback_submitted";
export const SESSION_KEY_FEEDBACK_DISMISSED = "sinsay_feedback_dismissed_session";

// Configurable feedback survey URL (Google Form / Typeform)
export const DEFAULT_FEEDBACK_SURVEY_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_FEEDBACK_FORM_URL) ||
  "https://forms.gle/3SHsqNhqcEDLXexdA";

export function isRouteBlacklisted(pathname: string | null): boolean {
  if (!pathname) return true;
  const normalized = pathname.trim().toLowerCase();
  return (
    normalized === "/" ||
    normalized === "/index" ||
    normalized === "/loginpage" ||
    normalized === "/signup" ||
    normalized.startsWith("/next") ||
    normalized.startsWith("/auth/")
  );
}

export function isProfileRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const normalized = pathname.trim().toLowerCase();
  return (
    normalized.includes("/profile") ||
    normalized === "/operator-profile-edit"
  );
}
