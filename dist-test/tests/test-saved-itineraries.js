"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const savedItineraries_js_1 = require("../src/lib/savedItineraries.js");
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
function assert(condition, msg) {
    if (!condition)
        throw new Error(msg);
}
const mockPlan = {
    summary: {
        experienceLevel: "Beginner",
        duration: "2 Days",
        interest: "Reef Diving & Macro",
        overview: "A weekend dive retreat exploring Cathedral Rock and Twin Rocks.",
    },
    days: [
        {
            day: 1,
            title: "Orientation and Cathedral Reef",
            activities: [
                {
                    period: "Morning",
                    time: "08:30",
                    title: "Cathedral Rock Check-out Dive",
                    details: "Practice buoyancy control and explore the underwater cross.",
                },
                {
                    period: "Afternoon",
                    time: "14:00",
                    title: "Twin Rocks Drift Dive",
                    details: "Observe resident green turtles and batfish schools.",
                },
            ],
        },
        {
            day: 2,
            title: "Macro Photography & Secret Bay",
            activities: [
                {
                    period: "Morning",
                    time: "09:00",
                    title: "Secret Bay Muck Dive",
                    details: "Search for frogfish, wonderpus, and nudibranchs.",
                },
            ],
        },
    ],
    sites: [
        {
            id: "ds-1",
            name: "Cathedral Rock",
            depth: "12–28m",
            difficulty: "Beginner",
            description: "Iconic volcanic rock pinnacle with cross and coral garden.",
        },
        {
            id: "ds-2",
            name: "Twin Rocks Sanctuary",
            depth: "5–22m",
            difficulty: "Beginner",
            description: "Protected marine sanctuary with dense fish life.",
        },
    ],
    ecoAlerts: [
        "Strictly avoid touching or resting on live coral formations.",
        "Carry a reef-safe sunscreen and no single-use plastic bottles.",
    ],
    budgetBreakdown: [
        { label: "Dive passes & boat fees", amount: 3600 },
        { label: "Gear rental & guide", amount: 2400 },
    ],
    budgetTotal: 6000,
};
// 1. Storage Key
check("defines canonical storage key", () => {
    assert(savedItineraries_js_1.SAVED_ITINERARIES_STORAGE_KEY === "@sinsay.saved_dive_itineraries", `Expected @sinsay.saved_dive_itineraries, got ${savedItineraries_js_1.SAVED_ITINERARIES_STORAGE_KEY}`);
});
// 2. Formatting Title and Header
check("formats itinerary title and destination header", () => {
    const result = (0, savedItineraries_js_1.formatItineraryForShare)({
        title: "2-Day Mabini Adventure",
        budget: "6000",
        groupSize: "2",
        activity: "Reef Diving",
        lengthOfStay: "2 Days",
        plan: mockPlan,
    });
    assert(result.includes("SINSAY DIVE ITINERARY: 2-Day Mabini Adventure"), "Missing title");
    assert(result.includes("Mabini (Anilao), Batangas"), "Missing destination");
    assert(result.includes("Duration: 2 Days"), "Missing duration");
    assert(result.includes("Group: 2 divers"), "Missing divers");
    assert(result.includes("Budget: ₱6,000"), "Missing budget");
});
// 3. Daily Timeline Formatting
check("formats daily schedule and activities", () => {
    const result = (0, savedItineraries_js_1.formatItineraryForShare)({
        title: "Weekend Trip",
        plan: mockPlan,
    });
    assert(result.includes("Day 1: Orientation and Cathedral Reef"), "Missing Day 1 header");
    assert(result.includes("08:30 (Morning): Cathedral Rock Check-out Dive"), "Missing activity 1");
    assert(result.includes("Practice buoyancy control"), "Missing activity details");
    assert(result.includes("Day 2: Macro Photography & Secret Bay"), "Missing Day 2 header");
});
// 4. Suggested Sites & Eco Rules Formatting
check("formats suggested sites and conservation alerts", () => {
    const result = (0, savedItineraries_js_1.formatItineraryForShare)({
        title: "Eco Trip",
        plan: mockPlan,
    });
    assert(result.includes("Cathedral Rock (12–28m, Beginner)"), "Missing site 1 details");
    assert(result.includes("Twin Rocks Sanctuary (5–22m, Beginner)"), "Missing site 2 details");
    assert(result.includes("Strictly avoid touching or resting on live coral formations"), "Missing eco alert 1");
    assert(result.includes("Carry a reef-safe sunscreen"), "Missing eco alert 2");
    assert(result.includes("Total: ₱6,000"), "Missing budget total");
});
// 5. Fallback for Empty Optional Fields
check("handles missing optional inputs gracefully", () => {
    const minimalPlan = {
        summary: {
            experienceLevel: "Beginner",
            duration: "1 Day",
            interest: "Discovery",
            overview: "Simple check-out dive.",
        },
        days: [],
        sites: [],
    };
    const result = (0, savedItineraries_js_1.formatItineraryForShare)({
        plan: minimalPlan,
    });
    assert(result.includes("Simple check-out dive"), "Missing fallback overview title");
    assert(result.includes("SINSAY AI Dive Assistant"), "Missing assistant footer");
});
if (failures > 0) {
    throw new Error(`${failures} saved itineraries test(s) failed`);
}
console.log("all saved itineraries tests passed");
