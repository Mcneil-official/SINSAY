import assert from "node:assert";
import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  LOCALES,
  Locale,
  t,
} from "../src/lib/i18n";

console.log("Running i18n unit tests...");

// Test 1: Locales and Storage constants
assert.strictEqual(DEFAULT_LOCALE, "en", "Default locale must be English");
assert.strictEqual(
  LANGUAGE_STORAGE_KEY,
  "@sinsay_language_preference",
  "Storage key must be @sinsay_language_preference"
);
assert.strictEqual(LOCALES.length, 2, "Must support 2 locales");
assert.ok(
  LOCALES.some((l) => l.code === "en"),
  "Must include English locale"
);
assert.ok(
  LOCALES.some((l) => l.code === "fil"),
  "Must include Filipino locale"
);
console.log("ok - locales and storage key configured");

// Test 2: Basic translation lookup
assert.strictEqual(t("tab_home", "en"), "Home");
assert.strictEqual(t("tab_home", "fil"), "Tahanan");

assert.strictEqual(t("tab_map", "en"), "Map");
assert.strictEqual(t("tab_map", "fil"), "Mapa");

assert.strictEqual(t("tab_dashboard", "en"), "Dashboard");
assert.strictEqual(t("tab_dashboard", "fil"), "Dashboard");

assert.strictEqual(t("tab_manifests", "en"), "Manifests");
assert.strictEqual(t("tab_manifests", "fil"), "Manifesto");

assert.strictEqual(t("my_account", "en"), "My Account");
assert.strictEqual(t("my_account", "fil"), "Aking Account");

assert.strictEqual(t("language", "en"), "Language");
assert.strictEqual(t("language", "fil"), "Wika");
console.log("ok - translates basic navigation and profile keys");

// Test 3: Parameter substitution
const enGreeting = t("greeting_diver", "en", { greeting: "Good morning", name: "Diver" });
assert.strictEqual(enGreeting, "Good morning, Diver");

const filGreeting = t("greeting_diver", "fil", { greeting: "Magandang umaga", name: "Juan" });
assert.strictEqual(filGreeting, "Magandang umaga, Juan");

const verifiedResort = t("verified_by", "fil", { resort: "Solitude Acacia" });
assert.strictEqual(verifiedResort, "Bineripika ng Solitude Acacia");
console.log("ok - handles parameter interpolation correctly");

// Test 4: Missing key fallback
assert.strictEqual(
  t("non_existent_key_xyz", "en"),
  "non_existent_key_xyz",
  "Fallback to raw key when missing"
);
assert.strictEqual(
  t("non_existent_key_xyz", "fil"),
  "non_existent_key_xyz",
  "Fallback to raw key when missing in non-default locale"
);
console.log("ok - handles missing key fallback gracefully");

console.log("all i18n tests passed");
