"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resortInitials_1 = require("../src/lib/resortInitials");
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
// 1. Two-word names
check("extracts initials from Solitude Acacia Resort", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("Solitude Acacia Resort"), "SA");
});
check("extracts initials from Arthur's Place Dive Resort", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("Arthur's Place Dive Resort"), "AP");
});
check("extracts initials from Sea Spring Resort", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("Sea Spring Resort"), "SS");
});
check("extracts initials from Camp Netanya Resort & Spa", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("Camp Netanya Resort & Spa"), "CN");
});
check("extracts initials from Eagle Point Beach and Dive Resort", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("Eagle Point Beach and Dive Resort"), "EP");
});
// 2. Ignores stopwords like "The", "and", "&", "of"
check("ignores 'The' prefix in The Philip Ann Resort", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("The Philip Ann Resort"), "PA");
});
// 3. Single-word names
check("extracts first two letters from a single word resort name", () => {
    assertEqual((0, resortInitials_1.getResortInitials)("Solitude"), "SO");
    assertEqual((0, resortInitials_1.getResortInitials)("Altamare"), "AL");
});
// 4. Edge cases
check("handles empty or whitespace strings cleanly", () => {
    assertEqual((0, resortInitials_1.getResortInitials)(""), "");
    assertEqual((0, resortInitials_1.getResortInitials)("   "), "");
});
if (failures > 0) {
    throw new Error(`${failures} resort initials test(s) failed`);
}
console.log("all resort initials tests passed");
