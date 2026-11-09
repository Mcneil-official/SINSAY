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
    if (typeof actual === "object" &&
        actual !== null &&
        typeof expected === "object" &&
        expected !== null) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
        return;
    }
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
// --- password complexity rules check (checkPasswordRules) ---
check("evaluates rule accomplishment accurately", () => {
    // Empty
    assertEqual((0, password_1.checkPasswordRules)(""), {
        hasMinLength: false,
        hasUppercase: false,
        hasNumber: false,
        isValid: false,
    });
    // Length only
    assertEqual((0, password_1.checkPasswordRules)("abcdefgh"), {
        hasMinLength: true,
        hasUppercase: false,
        hasNumber: false,
        isValid: false,
    });
    // Length + Uppercase, missing number
    assertEqual((0, password_1.checkPasswordRules)("Abcdefgh"), {
        hasMinLength: true,
        hasUppercase: true,
        hasNumber: false,
        isValid: false,
    });
    // Length + Number, missing uppercase
    assertEqual((0, password_1.checkPasswordRules)("abcdefg1"), {
        hasMinLength: true,
        hasUppercase: false,
        hasNumber: true,
        isValid: false,
    });
    // All 3 satisfied: 8+ chars, uppercase, number
    assertEqual((0, password_1.checkPasswordRules)("Sinsay2026"), {
        hasMinLength: true,
        hasUppercase: true,
        hasNumber: true,
        isValid: true,
    });
});
// --- signup password validation (validatePasswordForSignup) ---
check("signup rejects password shorter than 8 chars", () => {
    assertEqual((0, password_1.validatePasswordForSignup)("Pass1"), "Min. 8 characters");
});
check("signup rejects password missing capital letter", () => {
    assertEqual((0, password_1.validatePasswordForSignup)("sinsay2026"), "Must include 1 capital letter (A-Z)");
});
check("signup rejects password missing number", () => {
    assertEqual((0, password_1.validatePasswordForSignup)("SinsayPassword"), "Must include 1 number (0-9)");
});
check("signup accepts valid password meeting all 3 criteria", () => {
    assertEqual((0, password_1.validatePasswordForSignup)("Sinsay2026"), null);
});
// --- new password reset validation (validateNewPassword) ---
check("accepts compliant 8+ chars with uppercase, number and match", () => assertEqual((0, password_1.validateNewPassword)("Sinsay01", "Sinsay01"), null));
check("rejects empty password", () => assertEqual((0, password_1.validateNewPassword)("", ""), "Please enter a new password."));
check("rejects short password", () => assertEqual((0, password_1.validateNewPassword)("Ab1", "Ab1"), "Password must be at least 8 characters."));
check("rejects missing uppercase in reset", () => assertEqual((0, password_1.validateNewPassword)("sinsay01", "sinsay01"), "Password must include at least 1 capital letter."));
check("rejects missing number in reset", () => assertEqual((0, password_1.validateNewPassword)("SinsayPassword", "SinsayPassword"), "Password must include at least 1 number."));
check("rejects missing confirmation", () => assertEqual((0, password_1.validateNewPassword)("Sinsay01", ""), "Please confirm your new password."));
check("rejects mismatch", () => assertEqual((0, password_1.validateNewPassword)("Sinsay01", "Sinsay02"), "Passwords do not match."));
if (failures > 0) {
    throw new Error(`${failures} test(s) failed`);
}
console.log("all password tests passed");
