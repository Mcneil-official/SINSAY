"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_FEEDBACK_SURVEY_URL = exports.SESSION_KEY_FEEDBACK_DISMISSED = exports.STORAGE_KEY_FEEDBACK_SUBMITTED = void 0;
exports.isRouteBlacklisted = isRouteBlacklisted;
exports.isProfileRoute = isProfileRoute;
exports.STORAGE_KEY_FEEDBACK_SUBMITTED = "@sinsay_feedback_submitted";
exports.SESSION_KEY_FEEDBACK_DISMISSED = "sinsay_feedback_dismissed_session";
// Configurable feedback survey URL (Google Form / Typeform)
exports.DEFAULT_FEEDBACK_SURVEY_URL = (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_FEEDBACK_FORM_URL) ||
    "https://forms.gle/3SHsqNhqcEDLXexdA";
function isRouteBlacklisted(pathname) {
    if (!pathname)
        return true;
    const normalized = pathname.trim().toLowerCase();
    return (normalized === "/" ||
        normalized === "/index" ||
        normalized === "/loginpage" ||
        normalized === "/signup" ||
        normalized.startsWith("/next") ||
        normalized.startsWith("/auth/"));
}
function isProfileRoute(pathname) {
    if (!pathname)
        return false;
    const normalized = pathname.trim().toLowerCase();
    return (normalized.includes("/profile") ||
        normalized === "/operator-profile-edit");
}
