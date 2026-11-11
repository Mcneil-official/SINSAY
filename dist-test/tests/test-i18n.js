"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const i18n_1 = require("../src/lib/i18n");
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
console.log("Running i18n unit tests...");
// Test 1: Locales and Storage constants
check("Default locale must be English", () => assertEqual(i18n_1.DEFAULT_LOCALE, "en"));
check("Storage key must be @sinsay_language_preference", () => assertEqual(i18n_1.LANGUAGE_STORAGE_KEY, "@sinsay_language_preference"));
check("Must support 2 locales", () => assertEqual(i18n_1.LOCALES.length, 2));
check("Must include English locale", () => assertEqual(i18n_1.LOCALES.some((l) => l.code === "en"), true));
check("Must include Filipino locale", () => assertEqual(i18n_1.LOCALES.some((l) => l.code === "fil"), true));
// Test 2: Basic translation lookup
check("Translates tab_home en", () => assertEqual((0, i18n_1.t)("tab_home", "en"), "Home"));
check("Translates tab_home fil", () => assertEqual((0, i18n_1.t)("tab_home", "fil"), "Tahanan"));
check("Translates tab_map en", () => assertEqual((0, i18n_1.t)("tab_map", "en"), "Map"));
check("Translates tab_map fil", () => assertEqual((0, i18n_1.t)("tab_map", "fil"), "Mapa"));
check("Translates tab_dashboard en", () => assertEqual((0, i18n_1.t)("tab_dashboard", "en"), "Dashboard"));
check("Translates tab_dashboard fil", () => assertEqual((0, i18n_1.t)("tab_dashboard", "fil"), "Dashboard"));
check("Translates tab_manifests en", () => assertEqual((0, i18n_1.t)("tab_manifests", "en"), "Manifests"));
check("Translates tab_manifests fil", () => assertEqual((0, i18n_1.t)("tab_manifests", "fil"), "Manifesto"));
check("Translates my_account en", () => assertEqual((0, i18n_1.t)("my_account", "en"), "My Account"));
check("Translates my_account fil", () => assertEqual((0, i18n_1.t)("my_account", "fil"), "Aking Account"));
check("Translates language en", () => assertEqual((0, i18n_1.t)("language", "en"), "Language"));
check("Translates language fil", () => assertEqual((0, i18n_1.t)("language", "fil"), "Wika"));
// Test 3: Parameter substitution
check("Substitutes parameters in English greeting", () => {
    const enGreeting = (0, i18n_1.t)("greeting_diver", "en", { greeting: "Good morning", name: "Diver" });
    assertEqual(enGreeting, "Good morning, Diver");
});
check("Substitutes parameters in Filipino greeting", () => {
    const filGreeting = (0, i18n_1.t)("greeting_diver", "fil", { greeting: "Magandang umaga", name: "Juan" });
    assertEqual(filGreeting, "Magandang umaga, Juan");
});
check("Substitutes parameters in verified resort label", () => {
    const verifiedResort = (0, i18n_1.t)("verified_by", "fil", { resort: "Solitude Acacia" });
    assertEqual(verifiedResort, "Bineripika ng Solitude Acacia");
});
// Test 4: Missing key fallback
check("Fallback to raw key when missing in en", () => {
    assertEqual((0, i18n_1.t)("non_existent_key_xyz", "en"), "non_existent_key_xyz");
});
check("Fallback to raw key when missing in fil", () => {
    assertEqual((0, i18n_1.t)("non_existent_key_xyz", "fil"), "non_existent_key_xyz");
});
if (failures > 0) {
    throw new Error(`${failures} test(s) failed`);
}
console.log("all i18n tests passed");
