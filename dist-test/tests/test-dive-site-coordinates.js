"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diveSiteCoordinates_1 = require("../src/lib/diveSiteCoordinates");
let failures = 0;
function check(name, fn) {
    try {
        fn();
        console.log(`ok - ${name}`);
    }
    catch (error) {
        failures += 1;
        console.error(`FAIL - ${name}: ${error instanceof Error ? error.message : error}`);
    }
}
function assertEqual(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
check("prefers valid coordinates saved on the database row", () => {
    assertEqual((0, diveSiteCoordinates_1.getDiveSiteMapCoordinates)({
        name: "Cathedral Rock",
        lat: 13.7,
        lng: 120.8,
    }), { lat: 13.7, lng: 120.8 });
});
check("uses a matching site-specific fallback for old rows", () => {
    assertEqual((0, diveSiteCoordinates_1.getDiveSiteMapCoordinates)({
        name: "Cathedral Rock",
        lat: null,
        lng: null,
    }), { lat: 13.7225, lng: 120.8758 });
});
check("uses the site-specific fallback for invalid database coordinates", () => {
    assertEqual((0, diveSiteCoordinates_1.getDiveSiteMapCoordinates)({ name: "Arthur's Rock", lat: 200, lng: 120 }), { lat: 13.7142, lng: 120.8878 });
});
check("omits an unknown site when its database coordinates are missing", () => {
    assertEqual((0, diveSiteCoordinates_1.getDiveSiteMapCoordinates)({
        name: "Uncatalogued Reef",
        lat: null,
        lng: null,
    }), null);
});
check("omits an unknown site with invalid coordinates", () => {
    assertEqual((0, diveSiteCoordinates_1.getDiveSiteMapCoordinates)({ name: "Uncatalogued Reef", lat: 13, lng: 400 }), null);
});
if (failures > 0) {
    throw new Error(`${failures} dive-site coordinate test(s) failed`);
}
console.log("all dive-site coordinate tests passed");
