"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMediaUrl = resolveMediaUrl;
exports.isExpiredFbcdnUrl = isExpiredFbcdnUrl;
exports.resolveEstablishmentMedia = resolveEstablishmentMedia;
const resortMediaRegistry_1 = require("./resortMediaRegistry");
const supabase_1 = require("./supabase");
/**
 * Resolves a storage path or external URL to a full displayable image URI.
 * - Leaves http(s) / data / blob links untouched.
 * - Strips accidental wrapping quotes.
 * - Resolves protocol-relative // URLs to https://.
 * - Expands relative Supabase storage bucket paths to their public CDN URL.
 */
function resolveMediaUrl(pathOrUrl, bucket = "operator_media") {
    if (!pathOrUrl)
        return null;
    const trimmed = pathOrUrl.trim().replace(/^["']|["']$/g, "").trim();
    if (!trimmed)
        return null;
    if (trimmed.startsWith("//")) {
        return `https:${trimmed}`;
    }
    // Handle absolute root-relative web paths like /assets/...
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
        return trimmed;
    }
    if (trimmed.startsWith("http://") ||
        trimmed.startsWith("https://") ||
        trimmed.startsWith("data:") ||
        trimmed.startsWith("blob:")) {
        return trimmed;
    }
    const cleanPath = trimmed
        .replace(/^\/+/, "")
        .replace(new RegExp(`^${bucket}/+`), "");
    const { data } = supabase_1.supabase.storage.from(bucket).getPublicUrl(cleanPath);
    return data?.publicUrl || null;
}
/**
 * Resolves all media for an establishment:
 * - Checks photo_url first (the direct database photo link)
 * - Checks image_url (the database image URL)
 * - Checks uploaded / configured cover_image_paths
 * - Checks logo_url and operator_avatar_path for the resort logo
 * - Falls back to the Authentic Resort Media Registry for recognized Mabini resorts
 */
/**
 * Checks if a Facebook CDN URL contains an expired signature (oe timestamp).
 */
function isExpiredFbcdnUrl(url) {
    if (!url || !url.includes("fbcdn.net"))
        return false;
    const match = url.match(/[?&]oe=([0-9a-fA-F]+)/);
    if (!match)
        return false;
    try {
        const expirySec = parseInt(match[1], 16);
        if (!isNaN(expirySec)) {
            return Date.now() / 1000 > expirySec;
        }
    }
    catch {
        return false;
    }
    return false;
}
function resolveEstablishmentMedia(est) {
    const allImageUrls = [];
    const addUrl = (val) => {
        if (!val)
            return;
        if (isExpiredFbcdnUrl(val))
            return;
        const resolved = resolveMediaUrl(val);
        if (resolved && !allImageUrls.includes(resolved)) {
            allImageUrls.push(resolved);
        }
    };
    // 1. photo_url (direct database link)
    if (est.photo_url) {
        addUrl(est.photo_url);
    }
    // 2. image_url (direct database link)
    if (est.image_url) {
        addUrl(est.image_url);
    }
    // 3. Uploaded / configured cover_image_paths
    if (Array.isArray(est.cover_image_paths)) {
        for (const p of est.cover_image_paths) {
            if (typeof p === "string") {
                addUrl(p);
            }
        }
    }
    // 4. Authentic Registry Fallback: If no valid non-expired image exists, use authentic resort photo
    if (allImageUrls.length === 0 && est.name) {
        const authenticPhoto = (0, resortMediaRegistry_1.getAuthenticResortPhoto)(est.name);
        if (authenticPhoto) {
            const resolved = resolveMediaUrl(authenticPhoto);
            if (resolved)
                allImageUrls.push(resolved);
        }
    }
    // 5. Final fallback to raw database strings if nothing else resolved
    if (allImageUrls.length === 0) {
        const rawFallback = est.photo_url ||
            est.image_url ||
            (Array.isArray(est.cover_image_paths) && est.cover_image_paths[0]);
        if (rawFallback && typeof rawFallback === "string") {
            const resolved = resolveMediaUrl(rawFallback);
            if (resolved)
                allImageUrls.push(resolved);
        }
    }
    const imageUrl = allImageUrls[0] || null;
    // Resolve logo: avatar -> unexpired logo_url -> authentic registry logo
    let logoUrl = resolveMediaUrl(est.operator_avatar_path) ||
        resolveMediaUrl(isExpiredFbcdnUrl(est.logo_url) ? null : est.logo_url) ||
        null;
    if (!logoUrl && est.name) {
        const authenticLogo = (0, resortMediaRegistry_1.getAuthenticResortLogo)(est.name);
        if (authenticLogo) {
            logoUrl = resolveMediaUrl(authenticLogo);
        }
    }
    return { imageUrl, logoUrl, allImageUrls };
}
