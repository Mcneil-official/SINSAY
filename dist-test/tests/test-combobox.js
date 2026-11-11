"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const comboboxFilter_1 = require("../src/lib/comboboxFilter");
let failures = 0;
function check(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    }
    catch (e) {
        failures += 1;
        console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`);
    }
}
function assertEqual(actual, expected) {
    if (typeof actual === "object" &&
        actual !== null &&
        typeof expected === "object" &&
        expected !== null) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
        }
        return;
    }
    if (actual !== expected) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
const sampleMabiniSites = [
    { label: "Cathedral Rock · Bagalangit, Mabini", value: "Cathedral Rock" },
    { label: "Twin Rocks · San Jose, Mabini", value: "Twin Rocks" },
    { label: "Sombrero Island · Tingloy / Mabini", value: "Sombrero Island" },
    { label: "Sepoc Beach · Tingloy / Mabini", value: "Sepoc Beach" },
    { label: "Arthur's Rock · Bagalangit, Mabini", value: "Arthur's Rock" },
    { label: "El Pinoy · Solo, Mabini", value: "El Pinoy" },
    { label: "Kirby's Rock · Bagalangit, Mabini", value: "Kirby's Rock" },
    { label: "Secret Bay · Mainit, Mabini", value: "Secret Bay" },
];
console.log("Running SearchableCombobox unit tests...");
// 1. Empty query returns all sites
check("returns all options on empty or whitespace query", () => {
    const res1 = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "");
    assertEqual(res1.length, sampleMabiniSites.length);
    const res2 = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "   ");
    assertEqual(res2.length, sampleMabiniSites.length);
});
// 2. Real-time filtering by site name
check("filters sites matching 'cathedral'", () => {
    const matches = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "cathedral");
    assertEqual(matches.length, 1);
    assertEqual(matches[0].value, "Cathedral Rock");
});
check("filters multiple sites with 'rock' (case-insensitive)", () => {
    const matches = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "ROCK");
    assertEqual(matches.length, 4); // Cathedral Rock, Twin Rocks, Arthur's Rock, Kirby's Rock
});
// 3. Filtering by barangay / subtitle
check("filters sites by barangay 'Bagalangit'", () => {
    const matches = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "Bagalangit");
    assertEqual(matches.length, 3); // Cathedral Rock, Arthur's Rock, Kirby's Rock
});
check("filters sites by barangay 'Solo'", () => {
    const matches = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "solo");
    assertEqual(matches.length, 1);
    assertEqual(matches[0].value, "El Pinoy");
});
// 4. Returns empty array for non-matching custom site queries
check("returns empty array for unrecognized site query", () => {
    const matches = (0, comboboxFilter_1.filterDiveSites)(sampleMabiniSites, "Atlantis Deep Trench");
    assertEqual(matches.length, 0);
});
// 5. Recognized site validation
check("identifies recognized dive site correctly", () => {
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleMabiniSites, "Twin Rocks"), true);
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleMabiniSites, "twin rocks"), true);
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleMabiniSites, "Cathedral Rock"), true);
});
check("flags custom site name as not recognized", () => {
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleMabiniSites, "White Rock Deep"), false);
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleMabiniSites, "Secret Garden"), false);
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleMabiniSites, ""), false);
});
// 6. Effective location resolution and custom submission
check("resolves custom site name cleanly without error", () => {
    const effective = (0, comboboxFilter_1.resolveEffectiveDiveLocation)("Secret Garden Reef");
    assertEqual(effective, "Secret Garden Reef");
});
check("trims whitespace from entered custom location", () => {
    const effective = (0, comboboxFilter_1.resolveEffectiveDiveLocation)("   Custom Point Shallow   ");
    assertEqual(effective, "Custom Point Shallow");
});
check("prefers selected recognized option if provided", () => {
    const effective = (0, comboboxFilter_1.resolveEffectiveDiveLocation)("Cathedr", "Cathedral Rock");
    assertEqual(effective, "Cathedral Rock");
});
// 7. Divemaster filtering and recognition
const sampleDiveMasters = [
    {
        label: "Instructor Carlos Cruz · PCSSD #1042 · Mabini Accredited",
        value: "Instructor Carlos Cruz",
        subtitle: "Lead Instructor · PCSSD #1042",
        badge: "Instructor",
    },
    {
        label: "DM Carlo Mendoza · PCSSD #2184 · Anilao Divers",
        value: "DM Carlo Mendoza",
        subtitle: "Certified Divemaster · PCSSD #2184",
        badge: "Divemaster",
    },
    {
        label: "Instructor Maria Santos · PCSSD #3190 · Mabini MTO Permit",
        value: "Instructor Maria Santos",
        subtitle: "Master Scuba Diver Trainer · PCSSD #3190",
        badge: "Instructor",
    },
];
check("filters divemasters by name or title", () => {
    const dmMatches = (0, comboboxFilter_1.filterDiveSites)(sampleDiveMasters, "carlos");
    assertEqual(dmMatches.length, 1);
    assertEqual(dmMatches[0].value, "Instructor Carlos Cruz");
});
check("filters divemasters by PCSSD accreditation number", () => {
    const dmMatches = (0, comboboxFilter_1.filterDiveSites)(sampleDiveMasters, "2184");
    assertEqual(dmMatches.length, 1);
    assertEqual(dmMatches[0].value, "DM Carlo Mendoza");
});
check("recognizes certified divemaster and flags custom walk-in", () => {
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleDiveMasters, "DM Carlo Mendoza"), true);
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleDiveMasters, "dm carlo mendoza"), true);
    assertEqual((0, comboboxFilter_1.isRecognizedDiveSite)(sampleDiveMasters, "Walk-in DM John Doe"), false);
});
check("resolves custom walk-in divemaster name cleanly", () => {
    const effective = (0, comboboxFilter_1.resolveEffectiveDiveLocation)("  Captain Walk-in Jack  ");
    assertEqual(effective, "Captain Walk-in Jack");
});
// 8. Boat / Shore Mode detection and Capacity Stepper logic
const isBoatMode = (mode) => {
    if (!mode)
        return true;
    const m = mode.trim().toLowerCase();
    return m.includes("boat");
};
const isShoreMode = (mode) => {
    if (!mode)
        return false;
    const m = mode.trim().toLowerCase();
    return m.includes("shore");
};
const stepCapacity = (currentVal, delta) => {
    const current = parseInt(currentVal, 10);
    const valid = Number.isInteger(current) && current > 0 ? current : 1;
    const next = Math.max(1, valid + delta);
    return String(next);
};
check("identifies Boat Entry, Boat Dive, and Boat Diving as boat modes", () => {
    assertEqual(isBoatMode("Boat Entry"), true);
    assertEqual(isBoatMode("Boat Dive"), true);
    assertEqual(isBoatMode("Boat Diving"), true);
    assertEqual(isBoatMode("Shore Entry"), false);
    assertEqual(isBoatMode("Shore Dive"), false);
});
check("identifies Shore Entry and Shore Dive as shore modes", () => {
    assertEqual(isShoreMode("Shore Entry"), true);
    assertEqual(isShoreMode("Shore Dive"), true);
    assertEqual(isShoreMode("Boat Entry"), false);
    assertEqual(isShoreMode("Boat Dive"), false);
});
check("boat capacity stepper increments accurately", () => {
    assertEqual(stepCapacity("22", 1), "23");
    assertEqual(stepCapacity("1", 1), "2");
    assertEqual(stepCapacity("0", 1), "2"); // invalid resets to 1, then +1 = 2
});
check("boat capacity stepper decrements enforcing minimum limit of 1", () => {
    assertEqual(stepCapacity("22", -1), "21");
    assertEqual(stepCapacity("2", -1), "1");
    assertEqual(stepCapacity("1", -1), "1"); // clamps at minimum 1
    assertEqual(stepCapacity("0", -1), "1"); // clamps at minimum 1
});
if (failures > 0) {
    throw new Error(`${failures} combobox test(s) failed`);
}
console.log("all combobox tests passed");
