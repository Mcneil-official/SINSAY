"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const feedbackPrompt_1 = require("../src/lib/feedbackPrompt");
let failures = 0;
function check(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    }
    catch (e) {
        failures += 1;
        console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`);
    }
}
function assertEqual(actual, expected) {
    if (actual !== expected) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
// 1. Route Blacklist Behavior
check("blacklists root splash screen", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/"), true);
});
check("blacklists /index splash route", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/index"), true);
});
check("blacklists loginpage", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/loginpage"), true);
});
check("blacklists signup page", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/signup"), true);
});
check("blacklists onboarding routes (/next, /next2, /next3)", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/next"), true);
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/next2"), true);
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/next3"), true);
});
check("blacklists auth callback route", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)("/auth/callback"), true);
});
check("handles null or empty pathname safely as blacklisted", () => {
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)(null), true);
    assertEqual((0, feedbackPrompt_1.isRouteBlacklisted)(""), true);
});
// 2. Profile Route Filtering Behavior (Profile-only trigger)
check("recognizes tourist profile tab", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)/profile"), true);
});
check("recognizes tourist edit-profile subroute", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)/profile/edit-profile"), true);
});
check("recognizes tourist apply-operator subroute", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)/profile/apply-operator"), true);
});
check("recognizes operator profile tab", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(operator-tabs)/profile"), true);
});
check("recognizes operator profile edit standalone route", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/operator-profile-edit"), true);
});
check("does not trigger on tourist home tab", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)"), false);
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)/index"), false);
});
check("does not trigger on eco-dive-id tab", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)/eco-dive-id"), false);
});
check("does not trigger on dive assistant tab", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(tabs)/dive-assistant"), false);
});
check("does not trigger on operator dashboard", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/(operator-tabs)"), false);
});
check("does not trigger on manifest creation flow", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)("/establishment/create-manifest/step1"), false);
});
check("handles null or empty pathname safely for profile check", () => {
    assertEqual((0, feedbackPrompt_1.isProfileRoute)(null), false);
    assertEqual((0, feedbackPrompt_1.isProfileRoute)(""), false);
});
// 3. Survey URL configuration
check("provides a valid default Google Form survey URL", () => {
    assertEqual(typeof feedbackPrompt_1.DEFAULT_FEEDBACK_SURVEY_URL, "string");
    assertEqual(feedbackPrompt_1.DEFAULT_FEEDBACK_SURVEY_URL, "https://forms.gle/3SHsqNhqcEDLXexdA");
});
if (failures > 0) {
    process.exit(1);
}
else {
    console.log("all feedback prompt tests passed");
}
