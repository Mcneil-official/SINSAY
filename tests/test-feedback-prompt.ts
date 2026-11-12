import {
  isRouteBlacklisted,
  isProfileRoute,
  DEFAULT_FEEDBACK_SURVEY_URL,
} from "../src/lib/feedbackPrompt";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// 1. Route Blacklist Behavior
check("blacklists root splash screen", () => {
  assertEqual(isRouteBlacklisted("/"), true);
});

check("blacklists /index splash route", () => {
  assertEqual(isRouteBlacklisted("/index"), true);
});

check("blacklists loginpage", () => {
  assertEqual(isRouteBlacklisted("/loginpage"), true);
});

check("blacklists signup page", () => {
  assertEqual(isRouteBlacklisted("/signup"), true);
});

check("blacklists onboarding routes (/next, /next2, /next3)", () => {
  assertEqual(isRouteBlacklisted("/next"), true);
  assertEqual(isRouteBlacklisted("/next2"), true);
  assertEqual(isRouteBlacklisted("/next3"), true);
});

check("blacklists auth callback route", () => {
  assertEqual(isRouteBlacklisted("/auth/callback"), true);
});

check("handles null or empty pathname safely as blacklisted", () => {
  assertEqual(isRouteBlacklisted(null), true);
  assertEqual(isRouteBlacklisted(""), true);
});

// 2. Profile Route Filtering Behavior (Profile-only trigger)
check("recognizes tourist profile tab", () => {
  assertEqual(isProfileRoute("/(tabs)/profile"), true);
});

check("recognizes tourist edit-profile subroute", () => {
  assertEqual(isProfileRoute("/(tabs)/profile/edit-profile"), true);
});

check("recognizes tourist apply-operator subroute", () => {
  assertEqual(isProfileRoute("/(tabs)/profile/apply-operator"), true);
});

check("recognizes operator profile tab", () => {
  assertEqual(isProfileRoute("/(operator-tabs)/profile"), true);
});

check("recognizes operator profile edit standalone route", () => {
  assertEqual(isProfileRoute("/operator-profile-edit"), true);
});

check("does not trigger on tourist home tab", () => {
  assertEqual(isProfileRoute("/(tabs)"), false);
  assertEqual(isProfileRoute("/(tabs)/index"), false);
});

check("does not trigger on eco-dive-id tab", () => {
  assertEqual(isProfileRoute("/(tabs)/eco-dive-id"), false);
});

check("does not trigger on dive assistant tab", () => {
  assertEqual(isProfileRoute("/(tabs)/dive-assistant"), false);
});

check("does not trigger on operator dashboard", () => {
  assertEqual(isProfileRoute("/(operator-tabs)"), false);
});

check("does not trigger on manifest creation flow", () => {
  assertEqual(isProfileRoute("/establishment/create-manifest/step1"), false);
});

check("handles null or empty pathname safely for profile check", () => {
  assertEqual(isProfileRoute(null), false);
  assertEqual(isProfileRoute(""), false);
});

// 3. Survey URL configuration
check("provides a valid default Google Form survey URL", () => {
  assertEqual(typeof DEFAULT_FEEDBACK_SURVEY_URL, "string");
  assertEqual(DEFAULT_FEEDBACK_SURVEY_URL, "https://forms.gle/3SHsqNhqcEDLXexdA");
});

if (failures > 0) {
  process.exit(1);
} else {
  console.log("all feedback prompt tests passed");
}

