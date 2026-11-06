"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_1 = require("../src/lib/notifications");
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
// 1. Explicit deep_link should take precedence if not generic /(tabs)
check("uses explicit deep_link when provided", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "eco_dive_activated", deep_link: "/tourist/dive-details/step1" }), "/tourist/dive-details/step1");
});
// 2. Generic deep_link "/(tabs)" falls back to specialized route
check("falls back to eco-dive complete when deep_link is /(tabs)", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "eco_dive_activated", deep_link: "/(tabs)" }), "/(tabs)/eco-dive-id/complete");
});
check("falls back to eco-dive complete when deep_link is null", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "eco_dive_activated", deep_link: null }), "/(tabs)/eco-dive-id/complete");
});
// 3. Fallbacks for all core notification types
check("routes announcement_published with matching active announcement to its ID", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "announcement_published", title: "Annual Coral Cleanup 2026", deep_link: "/(tabs)" }, [{ id: "cleanup-uuid-1234", title: "Annual Coral Cleanup 2026" }]), "/announcement/cleanup-uuid-1234");
});
check("routes announcement_published with title fallback when not in memory list", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "announcement_published", title: "Weather Advisory", deep_link: "/(tabs)" }), "/announcement/Weather%20Advisory");
});
check("routes announcement_published without title to default conservation", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "announcement_published" }), "/announcement/default-conservation");
});
check("routes dive_plan_ready to AI planner", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "dive_plan_ready" }), "/(tabs)/dive-assistant/planner");
});
check("routes operator_application_approved to operator tabs", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "operator_application_approved" }), "/(operator-tabs)");
});
check("routes operator_application_rejected to apply-operator", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "operator_application_rejected" }), "/(tabs)/profile/apply-operator");
});
check("routes pass_purchase_verified to buy-pass", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "pass_purchase_verified" }), "/(operator-tabs)/buy-pass");
});
check("routes manifest_submitted to manifests", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "manifest_submitted" }), "/(operator-tabs)/manifests");
});
check("routes unknown type to /(tabs)", () => {
    assertEqual((0, notifications_1.resolveNotificationRoute)({ type: "unknown_future_type" }), "/(tabs)");
});
if (failures > 0) {
    throw new Error(`${failures} test(s) failed`);
}
console.log("all notification tests passed");
