"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiveSiteMapCoordinates = getDiveSiteMapCoordinates;
// Retained as site-specific approximate positions for older database rows that
// predate the lat/lng columns. Never use a shared area center as a site pin.
const SITE_COORDINATE_FALLBACKS = {
    "cathedral rock": { lat: 13.7225, lng: 120.8758 },
    "arthur's rock": { lat: 13.7142, lng: 120.8878 },
    "twin rocks sanctuary": { lat: 13.7025, lng: 120.8992 },
    "sombrero island": { lat: 13.696, lng: 120.8285 },
};
function isValidCoordinates(lat, lng) {
    return (typeof lat === "number" &&
        Number.isFinite(lat) &&
        Math.abs(lat) <= 90 &&
        typeof lng === "number" &&
        Number.isFinite(lng) &&
        Math.abs(lng) <= 180);
}
function getDiveSiteMapCoordinates(site) {
    if (isValidCoordinates(site.lat, site.lng)) {
        return { lat: site.lat, lng: site.lng };
    }
    return SITE_COORDINATE_FALLBACKS[site.name.trim().toLowerCase()] ?? null;
}
