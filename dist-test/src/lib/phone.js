"use strict";
/**
 * Utility functions for handling Philippine mobile numbers (+63 9XXXXXXXXX).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLocalPhDigits = toLocalPhDigits;
exports.toDbPhPhone = toDbPhPhone;
exports.isValidPhDigits = isValidPhDigits;
/**
 * Strips non-digit characters, leading +63/63, and leading 0,
 * returning up to 10 digits starting with 9 (e.g. "9171234567").
 */
function toLocalPhDigits(phone) {
    if (!phone)
        return "";
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("63")) {
        digits = digits.slice(2);
    }
    else if (digits.startsWith("0")) {
        digits = digits.slice(1);
    }
    return digits.slice(0, 10);
}
/**
 * Converts a 10-digit local number (e.g. "9171234567") into canonical
 * database format: "+63 9171234567". Returns null/empty if empty.
 */
function toDbPhPhone(digits) {
    const local = toLocalPhDigits(digits);
    return local.length > 0 ? `+63 ${local}` : null;
}
/**
 * Validates that the input consists of exactly 10 digits starting with 9 (e.g. "9XXXXXXXXX").
 */
function isValidPhDigits(digits) {
    if (!digits)
        return false;
    return /^9\d{9}$/.test(digits.trim());
}
