"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const password_1 = require("../src/lib/password");
// Zero-dependency unit tests: compiled with tsc, run with plain node.
// No node: imports (no @types/node in the repo) — failures throw at the
// end, producing a non-zero exit code.
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
// --- email ---
check("accepts a normal email", () => assertEqual((0, password_1.isValidEmail)("juan@gmail.com"), true));
check("trims surrounding spaces", () => assertEqual((0, password_1.isValidEmail)("  juan@gmail.com  "), true));
check("rejects missing @", () => assertEqual((0, password_1.isValidEmail)("juangmail.com"), false));
check("rejects missing domain", () => assertEqual((0, password_1.isValidEmail)("juan@"), false));
check("rejects empty", () => assertEqual((0, password_1.isValidEmail)(""), false));
check("rejects spaces inside", () => assertEqual((0, password_1.isValidEmail)("ju an@gmail.com"), false));
// --- new password (min 8 + confirmation match) ---
check("accepts 8+ chars with match", () => assertEqual((0, password_1.validateNewPassword)("sinsay01", "sinsay01"), null));
check("rejects empty password", () => assertEqual((0, password_1.validateNewPassword)("", ""), "Please enter a new password."));
check("rejects short password", () => assertEqual((0, password_1.validateNewPassword)("abc123", "abc123"), "Password must be at least 8 characters."));
check("rejects missing confirmation", () => assertEqual((0, password_1.validateNewPassword)("sinsay01", ""), "Please confirm your new password."));
check("rejects mismatch", () => assertEqual((0, password_1.validateNewPassword)("sinsay01", "sinsay02"), "Passwords do not match."));
if (failures > 0) {
    throw new Error(`${failures} test(s) failed`);
}
console.log("all password tests passed");
