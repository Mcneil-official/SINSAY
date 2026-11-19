import {
  FilterableOption,
  resolveDiveSiteId,
  resolveManifestDiveSiteLinks,
} from "../src/lib/comboboxFilter";

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
  if (
    typeof actual === "object" &&
    actual !== null &&
    typeof expected === "object" &&
    expected !== null
  ) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
    return;
  }
  if (actual !== expected) {
    throw new Error(
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

const mockDbSites: FilterableOption[] = [
  {
    id: "site-uuid-cathedral",
    label: "Cathedral Rock · Bagalangit, Mabini",
    value: "Cathedral Rock",
  },
  {
    id: "site-uuid-twinrocks",
    label: "Twin Rocks · San Jose, Mabini",
    value: "Twin Rocks",
  },
  {
    id: "site-uuid-sombrero",
    label: "Sombrero Island · Tingloy / Mabini",
    value: "Sombrero Island",
  },
  {
    id: "site-uuid-sepoc",
    label: "Sepoc Beach · Tingloy / Mabini",
    value: "Sepoc Beach",
  },
  {
    id: "site-uuid-arthurs",
    label: "Arthur's Rock · Bagalangit, Mabini",
    value: "Arthur's Rock",
  },
];

const fallbackOfflineSites: FilterableOption[] = [
  { label: "Cathedral Rock · Bagalangit, Mabini", value: "Cathedral Rock" },
  { label: "Twin Rocks · San Jose, Mabini", value: "Twin Rocks" },
];

console.log("# Testing Dive Manifest Foreign Key & Junction Linkage");

// 1. Exact and case-insensitive resolution by value
check("resolves exact site UUID by value", () => {
  const result = resolveDiveSiteId(mockDbSites, "Cathedral Rock");
  assertEqual(result, "site-uuid-cathedral");
});

check("resolves case-insensitive and trimmed site UUID", () => {
  const result = resolveDiveSiteId(mockDbSites, "   twin rocks   ");
  assertEqual(result, "site-uuid-twinrocks");
});

// 2. Resolution by full combobox label
check("resolves site UUID by formatted combobox label", () => {
  const result = resolveDiveSiteId(
    mockDbSites,
    "Sombrero Island · Tingloy / Mabini"
  );
  assertEqual(result, "site-uuid-sombrero");
});

// 3. Unlisted / Custom Sites & Empty Strings
check("returns null for custom unlisted site name", () => {
  const result = resolveDiveSiteId(mockDbSites, "Secret Diver's Cove Unlisted");
  assertEqual(result, null);
});

check("returns null for empty or whitespace-only location string", () => {
  assertEqual(resolveDiveSiteId(mockDbSites, ""), null);
  assertEqual(resolveDiveSiteId(mockDbSites, "   "), null);
});

// 4. Offline Fallback Sites (No UUID)
check("returns null when options do not contain UUIDs (offline fallback)", () => {
  const result = resolveDiveSiteId(fallbackOfflineSites, "Cathedral Rock");
  assertEqual(result, null);
});

// 5. Multi-Location Manifest Resolution (Single Recognized Site)
check("resolves single location trip with primary ID and clean locations", () => {
  const res = resolveManifestDiveSiteLinks(mockDbSites, ["Cathedral Rock"]);
  assertEqual(res.primaryDiveSiteId, "site-uuid-cathedral");
  assertEqual(res.diveSiteIds, ["site-uuid-cathedral"]);
  assertEqual(res.cleanLocations, ["Cathedral Rock"]);
});

// 6. Multi-Location Manifest Resolution (Multiple Recognized Sites in Order)
check("resolves multi-site trip in stop sequence order", () => {
  const res = resolveManifestDiveSiteLinks(mockDbSites, [
    "Cathedral Rock",
    "Sombrero Island",
    "Twin Rocks",
  ]);
  assertEqual(res.primaryDiveSiteId, "site-uuid-cathedral");
  assertEqual(res.diveSiteIds, [
    "site-uuid-cathedral",
    "site-uuid-sombrero",
    "site-uuid-twinrocks",
  ]);
  assertEqual(res.cleanLocations, [
    "Cathedral Rock",
    "Sombrero Island",
    "Twin Rocks",
  ]);
});

// 7. Deduplication of Repeated Sites on Same Manifest
check("deduplicates repeated dive site UUIDs on same trip", () => {
  const res = resolveManifestDiveSiteLinks(mockDbSites, [
    "Cathedral Rock",
    "Twin Rocks",
    "Cathedral Rock", // duplicate stop
  ]);
  assertEqual(res.primaryDiveSiteId, "site-uuid-cathedral");
  assertEqual(res.diveSiteIds, ["site-uuid-cathedral", "site-uuid-twinrocks"]);
  assertEqual(res.cleanLocations, [
    "Cathedral Rock",
    "Twin Rocks",
    "Cathedral Rock",
  ]);
});

// 8. Mixed Trips (Custom Site First, Then Recognized Site)
check("assigns first recognized site as primary when first stop is custom", () => {
  const res = resolveManifestDiveSiteLinks(mockDbSites, [
    "Unlisted Shore Spot",
    "Arthur's Rock",
    "Sepoc Beach",
  ]);
  assertEqual(res.primaryDiveSiteId, "site-uuid-arthurs");
  assertEqual(res.diveSiteIds, ["site-uuid-arthurs", "site-uuid-sepoc"]);
  assertEqual(res.cleanLocations, [
    "Unlisted Shore Spot",
    "Arthur's Rock",
    "Sepoc Beach",
  ]);
});

// 9. Fully Custom Trip (No Recognized Sites)
check("handles fully custom manifest trip safely without crashing", () => {
  const res = resolveManifestDiveSiteLinks(mockDbSites, [
    "Secret Spot A",
    "Private Coral B",
  ]);
  assertEqual(res.primaryDiveSiteId, null);
  assertEqual(res.diveSiteIds, []);
  assertEqual(res.cleanLocations, ["Secret Spot A", "Private Coral B"]);
});

// 10. Blank and Whitespace Elements Filtered
check("filters out empty or whitespace-only locations in multi-trip list", () => {
  const res = resolveManifestDiveSiteLinks(mockDbSites, [
    "   ",
    "Twin Rocks",
    "",
    "Sepoc Beach",
    "   ",
  ]);
  assertEqual(res.primaryDiveSiteId, "site-uuid-twinrocks");
  assertEqual(res.diveSiteIds, ["site-uuid-twinrocks", "site-uuid-sepoc"]);
  assertEqual(res.cleanLocations, ["Twin Rocks", "Sepoc Beach"]);
});

if (failures > 0) {
  console.error(`\n${failures} tests failed.`);
  process.exit(1);
} else {
  console.log("\nAll dive manifest foreign key linkage tests passed!");
}
