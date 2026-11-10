/**
 * GPS-verified dive-site coordinates and name aliases for the Anilao /
 * Mabini / Tingloy area.
 *
 * Sources (highest trust first): waypointsdotph.com / waypoints.ph boat GPS
 * readings, LGU & UN-geonames entries, divers.world, Diveboard,
 * scubaspotadvisor.com, PADI. Sites without a trustworthy fix are simply
 * absent — callers fall back to database coordinates, and finally to no
 * pin at all (never a fabricated default position).
 */

export interface SiteCoords {
  lat: number;
  lng: number;
}

/** Names that refer to the same physical site. First entry is canonical. */
const ALIAS_GROUPS: readonly (readonly string[])[] = [
  ["Secret Bay (Mainit Muck)", "Secret Bay", "Mainit Muck", "Manit Muck"],
  ["Kiribatcho", "Kirby's Rock", "Kirbys Rock", "Kirby Rock"],
  ["Sepoc Wall", "Sepok Wall"],
  ["Dari Laut", "Daryl Laut", "Darilaut"],
  ["Koala", "Koala Reef"],
  ["Twin Rocks Sanctuary", "Twin Rocks", "Mag-asawang Bato"],
  ["Sombrero Island", "Sombrero"],
  ["Mainit Point", "Mainit Corner", "Cazador Point"],
  ["Red Rock", "Pulang Bato"],
  ["Basura", "Muck & Macro", "Secret Bay (Basura)"],
  ["Cathedral Rock", "Cathedral", "The Cathedral"],
  ["Arthur's Rock", "Arthurs Rock"],
  ["Eagle Point", "Eagle Point Reef"],
  ["Ligpo Island", "Ligpo"],
  ["Ligpo Pinnacle", "Ligpo Wall"],
  ["Layag-Layag", "Layag Layag"],
  ["Beatrice Rock", "Beatrice"],
  ["Devil's Point", "Devils Point"],
  ["Mapating Rock", "Mapating Cave"],
  ["Anilao Pier", "Anilao Port"],
  ["Mainit Bubbles", "Bubbles"],
  ["Batong Buhay", "Batong Buhay Sanctuary"],
  ["Siuli Reef", "Siuli"],
  ["Bethlehem", "Bethlehem Reef"],
  ["Dead Palm", "Dead Palm Reef"],
];

/** Verified coordinates keyed by canonical (normalized) site name. */
const VERIFIED_COORDS: Record<string, SiteCoords> = {
  "cathedral rock": { lat: 13.7241, lng: 120.8769 },
  "arthurs rock": { lat: 13.7039, lng: 120.8728 },
  "twin rocks sanctuary": { lat: 13.6906, lng: 120.8893 },
  "sombrero island": { lat: 13.698, lng: 120.8282 },
  "beatrice rock": { lat: 13.7022, lng: 120.8279 },
  "sepoc wall": { lat: 13.6878, lng: 120.8271 },
  "layag layag": { lat: 13.6918, lng: 120.8413 },
  kiribatcho: { lat: 13.6917, lng: 120.843 },
  "eagle point": { lat: 13.7223, lng: 120.8759 },
  "batong buhay": { lat: 13.72, lng: 120.874 },
  "anilao pier": { lat: 13.7608, lng: 120.9271 },
  "mainit point": { lat: 13.6823, lng: 120.8932 },
  "mainit bubbles": { lat: 13.6887, lng: 120.9008 },
  "secret bay mainit muck": { lat: 13.6865, lng: 120.8958 },
  basura: { lat: 13.7582, lng: 120.9167 },
  koala: { lat: 13.7165, lng: 120.8722 },
  bethlehem: { lat: 13.6729, lng: 120.8414 },
  "dari laut": { lat: 13.6786, lng: 120.8405 },
  "ligpo island": { lat: 13.8209, lng: 120.9009 },
  "ligpo pinnacle": { lat: 13.8194, lng: 120.9009 },
  "red rock": { lat: 13.7078, lng: 120.9213 },
  "siuli reef": { lat: 13.7578, lng: 120.9242 },
  "mapating rock": { lat: 13.6759, lng: 120.8135 },
  "devils point": { lat: 13.6503, lng: 120.8415 },
  "dead palm": { lat: 13.6952, lng: 120.8847 },
};

export function normalizeSiteName(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Canonical key shared by every alias of a site. */
export function canonicalSiteKey(name: string): string {
  const normalized = normalizeSiteName(name);
  for (const group of ALIAS_GROUPS) {
    if (group.some((alias) => normalizeSiteName(alias) === normalized)) {
      return normalizeSiteName(group[0]);
    }
  }
  return normalized;
}

/** True when both names resolve to the same physical site. */
export function isSameSite(a: string, b: string): boolean {
  return canonicalSiteKey(a) === canonicalSiteKey(b);
}

export function hasVerifiedCoords(name: string): boolean {
  return canonicalSiteKey(name) in VERIFIED_COORDS;
}

/**
 * Resolve the best available position for a site:
 * verified GPS fix → database coordinates → null (caller should not pin).
 */
export function resolveSiteCoords(
  name: string,
  dbLat?: number | null,
  dbLng?: number | null,
): SiteCoords | null {
  const verified = VERIFIED_COORDS[canonicalSiteKey(name)];
  if (verified) return verified;
  if (typeof dbLat === "number" && typeof dbLng === "number") {
    return { lat: dbLat, lng: dbLng };
  }
  return null;
}
