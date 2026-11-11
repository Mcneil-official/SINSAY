"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_NAMES = exports.BOOKING_PLATFORMS = void 0;
exports.detectTravelPlatform = detectTravelPlatform;
exports.normalizeTravelUrl = normalizeTravelUrl;
exports.findDuplicateBookingPlatform = findDuplicateBookingPlatform;
exports.getAvailableBookingPlatforms = getAvailableBookingPlatforms;
exports.getNextAvailableBookingPlatform = getNextAvailableBookingPlatform;
exports.sanitizeBookingLinks = sanitizeBookingLinks;
exports.BOOKING_PLATFORMS = [
    "messenger",
    "agoda",
    "whatsapp",
    "booking",
    "viber",
    "tripadvisor",
    "klook",
    "airbnb",
    "instagram",
    "website",
    "direct",
];
exports.PLATFORM_NAMES = {
    messenger: "Facebook",
    agoda: "Agoda",
    whatsapp: "WhatsApp",
    booking: "Booking.com",
    viber: "Viber",
    tripadvisor: "TripAdvisor",
    klook: "Klook",
    airbnb: "Airbnb",
    instagram: "Instagram",
    website: "Website",
    direct: "Book Online",
};
function detectTravelPlatform(url) {
    const lower = url.toLowerCase();
    if (lower.includes("m.me") || lower.includes("messenger.com"))
        return "messenger";
    if (lower.includes("agoda.com"))
        return "agoda";
    if (lower.includes("wa.me") || lower.includes("whatsapp.com"))
        return "whatsapp";
    if (lower.includes("booking.com"))
        return "booking";
    if (lower.includes("viber.com") || lower.includes("viber.me"))
        return "viber";
    if (lower.includes("tripadvisor."))
        return "tripadvisor";
    if (lower.includes("klook.com"))
        return "klook";
    if (lower.includes("airbnb.com"))
        return "airbnb";
    if (lower.includes("instagram.com"))
        return "instagram";
    if (lower.includes("facebook.com") ||
        lower.includes("fb.com") ||
        lower.includes("fb.me"))
        return "messenger";
    return "direct";
}
function normalizeTravelUrl(url, type) {
    const trimmed = url.trim();
    const hasHttpScheme = /^https?:\/\//i.test(trimmed);
    if (type === "messenger" && !hasHttpScheme) {
        return trimmed.toLowerCase().startsWith("m.me/")
            ? `https://${trimmed}`
            : `https://www.facebook.com/${trimmed.replace(/^@/, "")}`;
    }
    if (type === "whatsapp" && !hasHttpScheme) {
        const digitsOnly = trimmed.replace(/[^0-9]/g, "");
        return `https://wa.me/${digitsOnly}`;
    }
    if (type === "instagram" && !hasHttpScheme) {
        return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
    }
    return hasHttpScheme ? trimmed : `https://${trimmed}`;
}
function findDuplicateBookingPlatform(links) {
    const seen = new Set();
    for (const link of links) {
        if (seen.has(link.platform))
            return link.platform;
        seen.add(link.platform);
    }
    return null;
}
function getAvailableBookingPlatforms(links, currentLinkId) {
    const used = new Set(links
        .filter((link) => link.id !== currentLinkId)
        .map((link) => link.platform));
    return exports.BOOKING_PLATFORMS.filter((platform) => !used.has(platform));
}
function getNextAvailableBookingPlatform(links) {
    return getAvailableBookingPlatforms(links)[0] ?? null;
}
function sanitizeBookingLinks(links) {
    const duplicate = findDuplicateBookingPlatform(links);
    if (duplicate) {
        throw new Error(`Only one ${exports.PLATFORM_NAMES[duplicate]} channel is allowed.`);
    }
    return links
        .filter((link) => link.url.trim().length > 0)
        .map((link) => ({
        ...link,
        label: exports.PLATFORM_NAMES[link.platform] || "Book Online",
        url: normalizeTravelUrl(link.url, link.platform),
    }));
}
