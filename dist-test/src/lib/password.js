"use strict";
// Pure password/email validators for signup, account creation, and reset flows.
// Dependency-free on purpose: unit-tested with tsc + node, no runner.
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_PASSWORD_LENGTH = void 0;
exports.isValidEmail = isValidEmail;
exports.checkPasswordRules = checkPasswordRules;
exports.validatePasswordForSignup = validatePasswordForSignup;
exports.validateNewPassword = validateNewPassword;
exports.MIN_PASSWORD_LENGTH = 8;
function isValidEmail(email) {
    const v = email.trim();
    if (!v || v.length > 254)
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
/**
 * Checks which of the 3 required password rules are accomplished.
 */
function checkPasswordRules(password) {
    const p = password || "";
    const hasMinLength = p.length >= exports.MIN_PASSWORD_LENGTH;
    const hasUppercase = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    return {
        hasMinLength,
        hasUppercase,
        hasNumber,
        isValid: hasMinLength && hasUppercase && hasNumber,
    };
}
/**
 * Validates password for creating a new account.
 * Returns an actionable error message if invalid, or null if all rules are satisfied.
 */
function validatePasswordForSignup(password) {
    if (!password)
        return "Enter your password";
    if (password.length < exports.MIN_PASSWORD_LENGTH) {
        return `Min. ${exports.MIN_PASSWORD_LENGTH} characters`;
    }
    if (!/[A-Z]/.test(password)) {
        return "Must include 1 capital letter (A-Z)";
    }
    if (!/[0-9]/.test(password)) {
        return "Must include 1 number (0-9)";
    }
    return null;
}
function validateNewPassword(password, confirm) {
    if (!password)
        return "Please enter a new password.";
    if (password.length < exports.MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${exports.MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must include at least 1 capital letter.";
    }
    if (!/[0-9]/.test(password)) {
        return "Password must include at least 1 number.";
    }
    if (!confirm)
        return "Please confirm your new password.";
    if (password !== confirm)
        return "Passwords do not match.";
    return null;
}
