"use strict";
// Pure password/email validators for the reset flow (and reuse anywhere).
// Dependency-free on purpose: unit-tested with tsc + node --test, no runner.
Object.defineProperty(exports, "__esModule", { value: true });
exports.MIN_PASSWORD_LENGTH = void 0;
exports.isValidEmail = isValidEmail;
exports.validateNewPassword = validateNewPassword;
exports.MIN_PASSWORD_LENGTH = 8;
function isValidEmail(email) {
    const v = email.trim();
    if (!v || v.length > 254)
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}
function validateNewPassword(password, confirm) {
    if (!password)
        return "Please enter a new password.";
    if (password.length < exports.MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${exports.MIN_PASSWORD_LENGTH} characters.`;
    }
    if (!confirm)
        return "Please confirm your new password.";
    if (password !== confirm)
        return "Passwords do not match.";
    return null;
}
