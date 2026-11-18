"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEffectiveDiveLocation = exports.isRecognizedDiveSite = exports.filterDiveSites = void 0;
exports.filterComboboxOptions = filterComboboxOptions;
exports.isRecognizedOption = isRecognizedOption;
exports.resolveEffectiveComboboxValue = resolveEffectiveComboboxValue;
exports.resolveDiveSiteId = resolveDiveSiteId;
exports.resolveManifestDiveSiteLinks = resolveManifestDiveSiteLinks;
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
/**
 * Resolves the primary dive_sites UUID corresponding to a location name.
 * Matches case-insensitively against option value or label. Returns null if unlisted/custom.
 */
function resolveDiveSiteId(options, locationName) {
    const trimmed = locationName.trim();
    if (!trimmed)
        return null;
    const normalized = trimmed.toLowerCase();
    const match = options.find((opt) => opt.value.toLowerCase() === normalized ||
        opt.label.toLowerCase() === normalized);
    return match?.id ?? null;
}
/**
 * Resolves foreign key UUIDs and cleaned location names for all stops on a manifest.
 * - Filters out blank locations
 * - Resolves known site IDs in stop order
 * - Deduplicates diveSiteIds
 * - Determines primaryDiveSiteId from first resolved site
 */
function resolveManifestDiveSiteLinks(options, locations) {
    const cleanLocations = locations
        .map((loc) => loc.trim())
        .filter((loc) => loc.length > 0);
    const resolvedIds = [];
    const seen = new Set();
    for (const loc of cleanLocations) {
        const siteId = resolveDiveSiteId(options, loc);
        if (siteId && !seen.has(siteId)) {
            seen.add(siteId);
            resolvedIds.push(siteId);
        }
    }
    return {
        primaryDiveSiteId: resolvedIds[0] ?? null,
        diveSiteIds: resolvedIds,
        cleanLocations,
    };
}
