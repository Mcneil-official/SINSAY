"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEffectiveDiveLocation = exports.isRecognizedDiveSite = exports.filterDiveSites = void 0;
exports.filterComboboxOptions = filterComboboxOptions;
exports.isRecognizedOption = isRecognizedOption;
exports.resolveEffectiveComboboxValue = resolveEffectiveComboboxValue;
/**
 * Filters combobox options in real time by query string.
 * Performs case-insensitive matching across value, label, subtitle, and badge.
 */
function filterComboboxOptions(options, query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized)
        return options;
    return options.filter((opt) => {
        const valMatch = opt.value.toLowerCase().includes(normalized);
        const labelMatch = opt.label.toLowerCase().includes(normalized);
        const subMatch = Boolean(opt.subtitle?.toLowerCase().includes(normalized));
        const badgeMatch = Boolean(opt.badge?.toLowerCase().includes(normalized));
        return valMatch || labelMatch || subMatch || badgeMatch;
    });
}
/**
 * Backwards-compatible alias for dive sites.
 */
exports.filterDiveSites = filterComboboxOptions;
/**
 * Checks if a typed value matches any recognized option (by value or label).
 */
function isRecognizedOption(options, candidate) {
    const normalized = candidate.trim().toLowerCase();
    if (!normalized)
        return false;
    return options.some((s) => s.value.toLowerCase() === normalized ||
        s.label.toLowerCase() === normalized);
}
/**
 * Backwards-compatible alias for dive sites.
 */
exports.isRecognizedDiveSite = isRecognizedOption;
/**
 * Resolves the effective value to save on the manifest.
 * Allows custom names if not on the recognized list.
 */
function resolveEffectiveComboboxValue(typedValue, selectedOptionValue) {
    if (selectedOptionValue && selectedOptionValue.trim()) {
        return selectedOptionValue.trim();
    }
    return typedValue.trim();
}
/**
 * Backwards-compatible alias for dive sites.
 */
exports.resolveEffectiveDiveLocation = resolveEffectiveComboboxValue;
