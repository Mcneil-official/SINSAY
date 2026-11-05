"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phone_1 = require("../src/lib/phone");
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
// --- toLocalPhDigits ---
check("cleans leading 0 from 11-digit mobile", () => assertEqual((0, phone_1.toLocalPhDigits)("09171234567"), "9171234567"));
check("cleans +63 prefix with space", () => assertEqual((0, phone_1.toLocalPhDigits)("+63 9171234567"), "9171234567"));
check("cleans +63 prefix without space", () => assertEqual((0, phone_1.toLocalPhDigits)("+639171234567"), "9171234567"));
check("cleans 63 prefix without plus", () => assertEqual((0, phone_1.toLocalPhDigits)("639171234567"), "9171234567"));
check("accepts raw 10 digits starting with 9", () => assertEqual((0, phone_1.toLocalPhDigits)("9171234567"), "9171234567"));
check("handles punctuation and formatting dashes/parens", () => assertEqual((0, phone_1.toLocalPhDigits)("+63 (917) 123-4567"), "9171234567"));
check("handles empty / null", () => {
    assertEqual((0, phone_1.toLocalPhDigits)(""), "");
    assertEqual((0, phone_1.toLocalPhDigits)(null), "");
    assertEqual((0, phone_1.toLocalPhDigits)(undefined), "");
});
// --- toDbPhPhone ---
check("formats local digits to canonical DB format", () => assertEqual((0, phone_1.toDbPhPhone)("9171234567"), "+63 9171234567"));
check("formats uncleaned input to canonical DB format", () => assertEqual((0, phone_1.toDbPhPhone)("09171234567"), "+63 9171234567"));
check("returns null on empty input", () => {
    assertEqual((0, phone_1.toDbPhPhone)(""), null);
    assertEqual((0, phone_1.toDbPhPhone)(null), null);
});
// --- isValidPhDigits ---
check("accepts valid 10 digits starting with 9", () => assertEqual((0, phone_1.isValidPhDigits)("9171234567"), true));
check("rejects 11 digits (e.g. still has 0)", () => assertEqual((0, phone_1.isValidPhDigits)("09171234567"), false));
check("rejects numbers starting with digits other than 9", () => {
    assertEqual((0, phone_1.isValidPhDigits)("8171234567"), false);
    assertEqual((0, phone_1.isValidPhDigits)("2171234567"), false);
});
check("rejects short or long numbers", () => {
    assertEqual((0, phone_1.isValidPhDigits)("917123456"), false);
    assertEqual((0, phone_1.isValidPhDigits)("91712345678"), false);
});
check("rejects empty or whitespace", () => {
    assertEqual((0, phone_1.isValidPhDigits)(""), false);
    assertEqual((0, phone_1.isValidPhDigits)("   "), false);
});
if (failures > 0) {
    throw new Error(`${failures} phone test(s) failed`);
}
console.log("all phone tests passed");
