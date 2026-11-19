import {
  MIN_PLANNER_BUDGET,
  MAX_PLANNER_BUDGET,
  validatePlannerBudget,
  parseLengthOfStayDays,
  alignPlanDays,
  isOutsideMabini,
  sanitizePlanActivities,
  resolvePlannerSites,
  PlanDayItem,
  POPULAR_MABINI_DIVE_SITES,
} from "../src/lib/plannerSites";
import { DiveSiteRow } from "../src/types/supabase";

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
    throw new Error(
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// ---------------------------------------------------------------------------
// 1. Budget Validation Tests
// ---------------------------------------------------------------------------

check("rejects empty or whitespace-only budget", () => {
  assertEqual(validatePlannerBudget(""), "Enter a budget for your trip");
  assertEqual(validatePlannerBudget("   "), "Enter a budget for your trip");
});

check("rejects non-numeric budget string", () => {
  assertEqual(validatePlannerBudget("abc"), "Enter a valid numeric budget");
  assertEqual(validatePlannerBudget("five thousand"), "Enter a valid numeric budget");
});

check("rejects sub-minimum budgets (₱1, ₱0, negative, ₱999)", () => {
  const expectedMsg = `Minimum budget is ₱${MIN_PLANNER_BUDGET.toLocaleString()} (covers pass fees and basic dive costs)`;
  assertEqual(validatePlannerBudget("0"), expectedMsg);
  assertEqual(validatePlannerBudget("1"), expectedMsg);
  assertEqual(validatePlannerBudget("-500"), expectedMsg);
  assertEqual(validatePlannerBudget("999"), expectedMsg);
});

check("rejects budgets exceeding MAX_PLANNER_BUDGET", () => {
  assertEqual(
    validatePlannerBudget("1000001"),
    `Budget cannot exceed ₱${MAX_PLANNER_BUDGET.toLocaleString()}`
  );
  assertEqual(
    validatePlannerBudget("5,000,000"),
    `Budget cannot exceed ₱${MAX_PLANNER_BUDGET.toLocaleString()}`
  );
});

check("accepts valid budgets (₱1,000 minimum, ₱5,000, ₱25,000, ₱1,000,000)", () => {
  assertEqual(validatePlannerBudget("1000"), null);
  assertEqual(validatePlannerBudget(" 1,000 "), null);
  assertEqual(validatePlannerBudget("5,000"), null);
  assertEqual(validatePlannerBudget("25000"), null);
  assertEqual(validatePlannerBudget("1,000,000"), null);
});

// ---------------------------------------------------------------------------
// 2. Length of Stay Duration & Plan Day Alignment Tests
// ---------------------------------------------------------------------------

check("parses length of stay options to exact target day counts", () => {
  assertEqual(parseLengthOfStayDays("Day Trip (1 Day)"), 1);
  assertEqual(parseLengthOfStayDays("1-day"), 1);
  assertEqual(parseLengthOfStayDays("1"), 1);

  assertEqual(parseLengthOfStayDays("2 Days (Weekend)"), 2);
  assertEqual(parseLengthOfStayDays("2-days"), 2);
  assertEqual(parseLengthOfStayDays("2"), 2);

  assertEqual(parseLengthOfStayDays("3 Days (Long Weekend)"), 3);
  assertEqual(parseLengthOfStayDays("3-days"), 3);
  assertEqual(parseLengthOfStayDays("3"), 3);

  assertEqual(parseLengthOfStayDays("4–5 Days"), 5);
  assertEqual(parseLengthOfStayDays("4-5-days"), 5);
  assertEqual(parseLengthOfStayDays("5"), 5);

  assertEqual(parseLengthOfStayDays("1 Week (7 Days)"), 7);
  assertEqual(parseLengthOfStayDays("1-week"), 7);
  assertEqual(parseLengthOfStayDays("7"), 7);
  assertEqual(parseLengthOfStayDays("7 days"), 7);
  assertEqual(parseLengthOfStayDays("7 day plan"), 7);

  assertEqual(parseLengthOfStayDays("Extended Stay (8+ Days)"), 10);
  assertEqual(parseLengthOfStayDays("extended"), 10);
});

check("alignPlanDays clamps over-generation to exact target days (e.g. 3 days -> 1 day)", () => {
  const threeDays: PlanDayItem[] = [
    {
      day: 1,
      title: "Day 1",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 1", details: "Det 1" },
      ],
    },
    {
      day: 2,
      title: "Day 2",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 2", details: "Det 2" },
      ],
    },
    {
      day: 3,
      title: "Day 3",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 3", details: "Det 3" },
      ],
    },
  ];

  const aligned = alignPlanDays(threeDays, 1);
  assertEqual(aligned.length, 1);
  assertEqual(aligned[0].day, 1);
  assertEqual(aligned[0].title, "Day 1");
});

check("alignPlanDays pads under-generation up to exact target days (e.g. 2 days -> 5 days)", () => {
  const twoDays: PlanDayItem[] = [
    {
      day: 1,
      title: "Day 1",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 1", details: "Det 1" },
      ],
    },
    {
      day: 2,
      title: "Day 2",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 2", details: "Det 2" },
      ],
    },
  ];

  const aligned = alignPlanDays(twoDays, 5);
  assertEqual(aligned.length, 5);
  assertEqual(
    JSON.stringify(aligned.map((d) => d.day)),
    JSON.stringify([1, 2, 3, 4, 5])
  );

  // Check padded days have valid activities and dive sites
  assertEqual(aligned[2].activities.length > 0, true);
  assertEqual(aligned[3].activities.length > 0, true);
  assertEqual(aligned[4].activities.length > 0, true);
});

check("alignPlanDays expands 3-day AI output to exact 7-day user request", () => {
  const threeDays: PlanDayItem[] = [
    {
      day: 1,
      title: "Day 1",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 1", details: "Det 1" },
      ],
    },
    {
      day: 2,
      title: "Day 2",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 2", details: "Det 2" },
      ],
    },
    {
      day: 3,
      title: "Day 3",
      activities: [
        { period: "Morning", time: "08:00", title: "Act 3", details: "Det 3" },
      ],
    },
  ];

  const aligned = alignPlanDays(threeDays, 7);
  assertEqual(aligned.length, 7);
  assertEqual(
    JSON.stringify(aligned.map((d) => d.day)),
    JSON.stringify([1, 2, 3, 4, 5, 6, 7])
  );
  assertEqual(aligned[6].day, 7);
  assertEqual(aligned[6].activities.length > 0, true);
});

// ---------------------------------------------------------------------------
// 3. Geographic Boundary Detection Tests (Excluding Tingloy LGU)
// ---------------------------------------------------------------------------

check("detects Tingloy and outside dive destinations correctly", () => {
  const outsideCases = [
    "Tingloy",
    "Tingloy Island",
    "Maricaban",
    "Maricaban Island",
    "Sombrero Island",
    "Sepoc Beach",
    "Sepoc Wall",
    "Beatrice Rock",
    "Caban Island",
    "Caban Cove",
    "Layag-Layag",
    "Mapating Rock",
    "Batalang Bato",
    "Bonito Island",
    "Puerto Galera",
    "Sabang Beach",
    "The Canyons",
    "Oriental Mindoro",
    "Coron Shipwrecks",
    "El Nido Marine Reserve",
    "Boracay White Beach",
    "Moalboal Pescador Island",
    "Malapascua Thresher Sharks",
    "Balicasag Island, Panglao",
    "Apo Reef Natural Park",
    "Apo Island Dauin",
    "Subic Bay Wrecks",
    "Tubbataha Reef",
  ];

  for (const text of outsideCases) {
    if (!isOutsideMabini(text)) {
      throw new Error(`Expected isOutsideMabini("${text}") to be true, got false`);
    }
  }
});

check("identifies authentic Mabini destinations as NOT outside", () => {
  const validCases = [
    "Cathedral Rock",
    "Twin Rocks Marine Sanctuary",
    "Arthur's Rock",
    "Kirby's Rock",
    "Mainit Point",
    "Secret Bay (Amphitheater)",
    "Koala Point",
    "Ligpo Island",
    "Eagle Point",
    "Bethlehem",
    "Cabancal",
    "Dive-and-Trek",
    "Balanoy",
    "Red Rock",
    "Dead Rock",
    "Anilao Proper",
    "Mabini, Batangas",
  ];

  for (const text of validCases) {
    if (isOutsideMabini(text)) {
      throw new Error(`Expected isOutsideMabini("${text}") to be false, got true`);
    }
  }
});

check("POPULAR_MABINI_DIVE_SITES does not contain Tingloy sites", () => {
  for (const site of POPULAR_MABINI_DIVE_SITES) {
    if (isOutsideMabini(site)) {
      throw new Error(
        `POPULAR_MABINI_DIVE_SITES contains non-Mabini / Tingloy site: ${site}`
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 4. Plan Activity Sanitization Tests (Swaps Tingloy / Outside Mentions)
// ---------------------------------------------------------------------------

check("sanitizes day titles and activities containing Tingloy or outside destinations", () => {
  const taintedDays: PlanDayItem[] = [
    {
      day: 1,
      title: "Exploring Sombrero Island & Sepoc Beach",
      activities: [
        {
          period: "Morning",
          time: "08:00 AM",
          title: "Dive at Sombrero Island",
          details: "Take a boat to Sombrero Island in Tingloy for colorful corals.",
        },
        {
          period: "Afternoon",
          time: "01:00 PM",
          title: "Cathedral Rock Dive",
          details: "Visit the iconic cross at Cathedral Rock in Anilao, Mabini.",
        },
      ],
    },
    {
      day: 2,
      title: "Day 2 in Maricaban Island",
      activities: [
        {
          period: "Morning",
          time: "09:00 AM",
          title: "Sepoc Beach Wall Dive",
          details: "Explore the vertical drop-off at Sepoc Beach.",
        },
      ],
    },
  ];

  const cleaned = sanitizePlanActivities(taintedDays);

  // Day 1 title should not contain Sombrero Island or Sepoc
  if (isOutsideMabini(cleaned[0].title)) {
    throw new Error(`Day 1 title still contains outside destination: ${cleaned[0].title}`);
  }

  // Day 1 activity 1 title and details should be sanitized
  if (isOutsideMabini(cleaned[0].activities[0].title)) {
    throw new Error(`Day 1 activity 1 title was not sanitized: ${cleaned[0].activities[0].title}`);
  }
  if (isOutsideMabini(cleaned[0].activities[0].details)) {
    throw new Error(`Day 1 activity 1 details was not sanitized: ${cleaned[0].activities[0].details}`);
  }

  // Day 1 activity 2 was already valid (Cathedral Rock) - should be preserved
  assertEqual(cleaned[0].activities[1].title, "Cathedral Rock Dive");
  assertEqual(cleaned[0].activities[1].details, "Visit the iconic cross at Cathedral Rock in Anilao, Mabini.");

  // Day 2 title should not contain Maricaban Island
  if (isOutsideMabini(cleaned[1].title)) {
    throw new Error(`Day 2 title still contains outside destination: ${cleaned[1].title}`);
  }

  // Day 2 activity 1 should not contain Sepoc Beach
  if (isOutsideMabini(cleaned[1].activities[0].title)) {
    throw new Error(`Day 2 activity 1 title was not sanitized: ${cleaned[1].activities[0].title}`);
  }
});

// ---------------------------------------------------------------------------
// 5. Site Resolution Rejection of Outside & Tingloy Sites
// ---------------------------------------------------------------------------

check("resolvePlannerSites rejects outside and Tingloy site suggestions and DB rows", () => {
  const mockDbSites: DiveSiteRow[] = [
    {
      id: "ds-1",
      name: "Cathedral Rock",
      depth_range: "10–25m",
      difficulty: "Intermediate",
      description: "Famous cross underwater.",
      image_url: null,
      rating: "4.8",
      photo_url: null,
      barangay: "Bagalangit",
      lat: null,
      lng: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "ds-2",
      name: "Twin Rocks",
      depth_range: "5–18m",
      difficulty: "Beginner",
      description: "Marine sanctuary with schooling jacks.",
      image_url: null,
      rating: "4.9",
      photo_url: null,
      barangay: "San Teodoro",
      lat: null,
      lng: null,
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "ds-tingloy-1",
      name: "Sombrero Island",
      depth_range: "5–20m",
      difficulty: "Beginner",
      description: "Hat-shaped island off Tingloy.",
      image_url: null,
      rating: "4.7",
      photo_url: null,
      barangay: "Maricaban Island, Tingloy",
      lat: null,
      lng: null,
      created_at: "2026-01-01T00:00:00Z",
    },
  ];

  const suggestions = [
    { name: "Sombrero Island" },
    { name: "Sepoc Beach" },
    { name: "Twin Rocks" },
    { name: "Puerto Galera Canyons" },
  ];

  const resolved = resolvePlannerSites(suggestions, mockDbSites);

  // Twin Rocks should be matched and resolved
  const twinRockMatch = resolved.find((s) => s.name === "Twin Rocks");
  if (!twinRockMatch) {
    throw new Error("Expected Twin Rocks to be resolved");
  }

  // None of the outside or Tingloy sites should be present
  for (const s of resolved) {
    if (isOutsideMabini(s.name)) {
      throw new Error(`resolvePlannerSites returned outside / Tingloy site: ${s.name}`);
    }
  }
});

// ---------------------------------------------------------------------------
// Exit Code
// ---------------------------------------------------------------------------

if (failures > 0) {
  console.error(`\n${failures} tests failed.`);
  process.exit(1);
} else {
  console.log("\nAll planner validation tests passed.");
}
