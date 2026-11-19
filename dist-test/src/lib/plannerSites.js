"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POPULAR_MABINI_DIVE_SITES = exports.FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX = exports.MAX_PLANNER_BUDGET = exports.MIN_PLANNER_BUDGET = void 0;
exports.resolvePlannerSites = resolvePlannerSites;
exports.validatePlannerBudget = validatePlannerBudget;
exports.parseLengthOfStayDays = parseLengthOfStayDays;
exports.isOutsideMabini = isOutsideMabini;
exports.alignPlanDays = alignPlanDays;
exports.sanitizePlanActivities = sanitizePlanActivities;
function defaultDepth(difficulty) {
    switch (difficulty) {
        case "Beginner":
        case "Open Water":
            return "5–18m";
        case "Intermediate":
        case "Rescue":
            return "12–28m";
        case "Advanced":
        case "Divemaster":
        case "Instructor":
            return "18–40m";
        default:
            return "8–22m";
    }
}
function normalize(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}
function toPlannerSite(site) {
    return {
        id: site.id,
        name: site.name,
        depth: site.depth_range?.trim() || defaultDepth(site.difficulty),
        difficulty: site.difficulty?.trim() || "Open Water",
        description: site.description?.trim() ||
            "Ask your dive operator about current conditions and access.",
        imageUrl: site.image_url,
        photoUrl: site.photo_url || null,
        location: site.barangay || null,
    };
}
function resolvePlannerSites(suggestions, databaseSites) {
    // Strictly filter out any sites from Tingloy or outside Mabini
    const mabiniOnlySites = databaseSites.filter((s) => !isOutsideMabini(s.name) && !isOutsideMabini(s.barangay || ""));
    const available = mabiniOnlySites.map(toPlannerSite);
    const used = new Set();
    const resolved = [];
    for (const suggestion of suggestions) {
        const requested = normalize(suggestion.name || "");
        if (!requested || isOutsideMabini(suggestion.name || ""))
            continue;
        const match = available.find((site) => {
            const actual = normalize(site.name);
            return !used.has(site.id) && (actual === requested || actual.includes(requested) || requested.includes(actual));
        });
        if (match) {
            used.add(match.id);
            resolved.push(match);
        }
    }
    for (const site of available) {
        if (resolved.length >= 3)
            break;
        if (!used.has(site.id)) {
            used.add(site.id);
            resolved.push(site);
        }
    }
    return resolved.slice(0, 3);
}
exports.MIN_PLANNER_BUDGET = 1000;
exports.MAX_PLANNER_BUDGET = 1000000;
function validatePlannerBudget(budgetStr) {
    const trimmed = budgetStr.trim().replace(/,/g, "");
    if (!trimmed) {
        return "Enter a budget for your trip";
    }
    const num = Number(trimmed);
    if (isNaN(num)) {
        return "Enter a valid numeric budget";
    }
    if (num < exports.MIN_PLANNER_BUDGET) {
        return `Minimum budget is ₱${exports.MIN_PLANNER_BUDGET.toLocaleString()} (covers pass fees and basic dive costs)`;
    }
    if (num > exports.MAX_PLANNER_BUDGET) {
        return `Budget cannot exceed ₱${exports.MAX_PLANNER_BUDGET.toLocaleString()}`;
    }
    return null;
}
function parseLengthOfStayDays(lengthOfStay) {
    const normalized = (lengthOfStay || "").trim().toLowerCase();
    if (normalized.includes("1-day") ||
        normalized.includes("1 day") ||
        normalized.includes("day trip") ||
        normalized === "1") {
        return 1;
    }
    if (normalized.includes("3-day") ||
        normalized.includes("3 days") ||
        normalized.includes("long weekend") ||
        normalized === "3") {
        return 3;
    }
    if (normalized.includes("2-day") ||
        normalized.includes("2 days") ||
        normalized.includes("weekend") ||
        normalized === "2") {
        return 2;
    }
    if (normalized.includes("4-5") ||
        normalized.includes("4–5") ||
        normalized.includes("5") ||
        normalized.includes("4")) {
        return 5;
    }
    if (normalized.includes("1-week") ||
        normalized.includes("7") ||
        normalized.includes("week")) {
        return 7;
    }
    if (normalized.includes("extended") ||
        normalized.includes("8") ||
        normalized.includes("10")) {
        return 10;
    }
    const match = normalized.match(/(\d+)/);
    if (match) {
        const val = parseInt(match[1], 10);
        if (!isNaN(val) && val > 0)
            return Math.min(val, 14);
    }
    return 1;
}
exports.FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX = /\b(tingloy|maricaban|sombrero\s+island|sepoc|caban\s+island|caban\s+cove|beatrice|mapating|layag[- ]layag|batalang\s+bato|bonito|puerto\s+galera|sabang|canyons|white\s+beach|tamaraw|mindoro|boracay|coron|el\s+nido|palawan|moalboal|malapascua|cebu|apo\s+reef|apo\s+island|subic|tubbataha|panglao|bohol|dumaguete|mactan|dauin)\b/i;
exports.POPULAR_MABINI_DIVE_SITES = [
    "Cathedral Rock",
    "Twin Rocks",
    "Arthur's Rock",
    "Kirby's Rock",
    "Secret Bay",
    "Mainit Point",
    "Ligpo Island",
    "Koala Point",
    "Eagle Point",
    "Cabancal",
    "Bethlehem",
];
function isOutsideMabini(locationOrText) {
    if (!locationOrText)
        return false;
    return exports.FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX.test(locationOrText);
}
function alignPlanDays(days, targetDays, fallbackSites = exports.POPULAR_MABINI_DIVE_SITES) {
    if (targetDays <= 0)
        return days;
    let aligned = [];
    if (days.length >= targetDays) {
        aligned = days.slice(0, targetDays);
    }
    else {
        aligned = [...days];
        let siteIdx = 0;
        const getNextSite = () => {
            const site = fallbackSites[siteIdx % fallbackSites.length];
            siteIdx += 1;
            return site;
        };
        for (let d = days.length + 1; d <= targetDays; d++) {
            const site1 = getNextSite();
            const site2 = getNextSite();
            aligned.push({
                day: d,
                title: d === targetDays
                    ? "Final Mabini Dives & Conservation De-brief"
                    : `Day ${d} Guided Mabini Exploration`,
                activities: [
                    {
                        period: "Morning",
                        time: "08:30",
                        title: `Morning Dive at ${site1}`,
                        details: `Guided morning dive exploring healthy reefs and macro marine life at ${site1}.`,
                    },
                    {
                        period: "Afternoon",
                        time: "13:30",
                        title: `Afternoon Dive at ${site2}`,
                        details: `Surface interval rest followed by a calm afternoon dive observing local biodiversity at ${site2}.`,
                    },
                    {
                        period: "Evening",
                        time: "18:00",
                        title: "Logbook Stamping & Relaxation",
                        details: "Review sightings, complete logbook entries, and observe the Mabini coastal sunset.",
                    },
                ],
            });
        }
    }
    return aligned.map((item, idx) => ({
        ...item,
        day: idx + 1,
    }));
}
function sanitizePlanActivities(days, fallbackSites = exports.POPULAR_MABINI_DIVE_SITES) {
    let siteIdx = 0;
    const getNextSite = () => {
        const s = fallbackSites[siteIdx % fallbackSites.length];
        siteIdx += 1;
        return s;
    };
    const globalRegex = new RegExp(exports.FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX.source, "gi");
    return days.map((day) => {
        let dayTitle = day.title;
        if (isOutsideMabini(dayTitle)) {
            dayTitle = dayTitle.replace(globalRegex, () => getNextSite());
        }
        const activities = day.activities.map((act) => {
            let title = act.title;
            let details = act.details;
            if (isOutsideMabini(title)) {
                title = title.replace(globalRegex, () => getNextSite());
            }
            if (isOutsideMabini(details)) {
                details = details.replace(globalRegex, () => getNextSite());
            }
            return {
                ...act,
                title,
                details,
            };
        });
        return {
            ...day,
            title: dayTitle,
            activities,
        };
    });
}
