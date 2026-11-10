import {
  canonicalSiteKey,
  hasVerifiedCoords,
  isSameSite,
  normalizeSiteName,
  resolveSiteCoords,
} from "../src/lib/diveSiteCatalog";

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

function assertEqual(actual: unknown, expected: unknown) {
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`expected ${expected} +/- ${tolerance}, got ${actual}`);
  }
}

// 1. Verified coordinates take precedence over DB values
check("verified coords override DB coords", () => {
  const coords = resolveSiteCoords("Twin Rocks Sanctuary", 13.7025, 120.8992);
  if (!coords) throw new Error("expected coords");
  assertClose(coords.lat, 13.6906, 0.0001);
  assertClose(coords.lng, 120.8893, 0.0001);
});

check("verified coords used when DB has none", () => {
  const coords = resolveSiteCoords("Cathedral Rock", null, null);
  if (!coords) throw new Error("expected coords");
  assertClose(coords.lat, 13.7241, 0.0001);
  assertClose(coords.lng, 120.8769, 0.0001);
});

// 2. Unverified sites fall back to DB, then null (never a fake default)
check("unverified site falls back to DB coords", () => {
  const coords = resolveSiteCoords("Some Local Spot", 13.755, 120.896);
  if (!coords) throw new Error("expected coords");
  assertEqual(coords.lat, 13.755);
  assertEqual(coords.lng, 120.896);
});

check("site with no data resolves to null, not a default center", () => {
  assertEqual(resolveSiteCoords("Mystery Reef", null, undefined), null);
  assertEqual(resolveSiteCoords("Mystery Reef"), null);
});

check("site with partial DB coords resolves to null", () => {
  assertEqual(resolveSiteCoords("Mystery Reef", 13.7, null), null);
});

// 3. Alias groups — same physical site shares one canonical key
check("Mainit Muck aliases Secret Bay (Mainit Muck)", () => {
  assertEqual(canonicalSiteKey("Mainit Muck"), canonicalSiteKey("Secret Bay (Mainit Muck)"));
  assertEqual(isSameSite("Mainit Muck", "Secret Bay (Mainit Muck)"), true);
});

check("Kiribatcho aliases Kirby's Rock", () => {
  assertEqual(isSameSite("Kiribatcho", "Kirby's Rock"), true);
});

check("Sepoc Wall aliases Sepok Wall", () => {
  assertEqual(isSameSite("Sepoc Wall", "Sepok Wall"), true);
});

check("Dari Laut aliases Daryl Laut", () => {
  assertEqual(isSameSite("Dari Laut", "Daryl Laut"), true);
});

check("Basura does NOT alias Secret Bay (different sites)", () => {
  assertEqual(isSameSite("Basura", "Secret Bay"), false);
  assertEqual(isSameSite("Basura", "Secret Bay (Mainit Muck)"), false);
});

check("Mainit Point does not alias Mainit Bubbles", () => {
  assertEqual(isSameSite("Mainit Point", "Mainit Bubbles"), false);
});

// 4. Normalization
check("normalize strips apostrophes, hyphens and case", () => {
  assertEqual(normalizeSiteName("Layag-Layag"), "layag layag");
  assertEqual(normalizeSiteName("Devil's Point"), "devils point");
  assertEqual(normalizeSiteName("  Twin Rocks  "), "twin rocks");
});

// 5. Verified coverage for the previously wrong pins
check("previously wrong pins now have verified coords", () => {
  assertEqual(hasVerifiedCoords("Red Rock"), true);
  assertEqual(hasVerifiedCoords("Dari Laut"), true);
  assertEqual(hasVerifiedCoords("Secret Bay (Basura)"), true);
  assertEqual(hasVerifiedCoords("Bethlehem"), true);
  assertEqual(hasVerifiedCoords("Ligpo Island"), true);
});

check("Basura resolves to the Anilao Pier-area pin", () => {
  const coords = resolveSiteCoords("Basura", 13.7345, 120.871);
  if (!coords) throw new Error("expected coords");
  assertClose(coords.lat, 13.7582, 0.0001);
  assertClose(coords.lng, 120.9167, 0.0001);
});

check("Secret Bay (Mainit Muck) resolves to the south-tip pin", () => {
  const coords = resolveSiteCoords("Secret Bay (Mainit Muck)", 13.69, 120.9);
  if (!coords) throw new Error("expected coords");
  assertClose(coords.lat, 13.6865, 0.0001);
  assertClose(coords.lng, 120.8958, 0.0001);
});

if (failures > 0) {
  throw new Error(`${failures} dive site catalog test(s) failed`);
}
console.log("all dive site catalog tests passed");
