import { DiveSiteRow } from "../types/supabase";

export type PlannerSite = {
  id: string;
  name: string;
  depth: string;
  difficulty: string;
  description: string;
  imageUrl: string | null;
  photoUrl: string | null;
  location: string | null;
};

function defaultDepth(difficulty: string | null): string {
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

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function toPlannerSite(site: DiveSiteRow): PlannerSite {
  return {
    id: site.id,
    name: site.name,
    depth: site.depth_range?.trim() || defaultDepth(site.difficulty),
    difficulty: site.difficulty?.trim() || "Open Water",
    description:
      site.description?.trim() ||
      "Ask your dive operator about current conditions and access.",
    imageUrl: site.image_url,
    photoUrl: site.photo_url || null,
    location: site.barangay || null,
  };
}

export function resolvePlannerSites(
  suggestions: { name?: string | null }[],
  databaseSites: DiveSiteRow[],
): PlannerSite[] {
  // Strictly filter out any sites from Tingloy or outside Mabini
  const mabiniOnlySites = databaseSites.filter(
    (s) => !isOutsideMabini(s.name) && !isOutsideMabini(s.barangay || "")
  );
  const available = mabiniOnlySites.map(toPlannerSite);
  const used = new Set<string>();
  const resolved: PlannerSite[] = [];

  for (const suggestion of suggestions) {
    const requested = normalize(suggestion.name || "");
    if (!requested || isOutsideMabini(suggestion.name || "")) continue;
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
    if (resolved.length >= 3) break;
    if (!used.has(site.id)) {
      used.add(site.id);
      resolved.push(site);
    }
  }

  return resolved.slice(0, 3);
}

export const MIN_PLANNER_BUDGET = 1000;
export const MAX_PLANNER_BUDGET = 1000000;

export function validatePlannerBudget(budgetStr: string): string | null {
  const trimmed = budgetStr.trim().replace(/,/g, "");
  if (!trimmed) {
    return "Enter a budget for your trip";
  }
  const num = Number(trimmed);
  if (isNaN(num)) {
    return "Enter a valid numeric budget";
  }
  if (num < MIN_PLANNER_BUDGET) {
    return `Minimum budget is ₱${MIN_PLANNER_BUDGET.toLocaleString()} (covers pass fees and basic dive costs)`;
  }
  if (num > MAX_PLANNER_BUDGET) {
    return `Budget cannot exceed ₱${MAX_PLANNER_BUDGET.toLocaleString()}`;
  }
  return null;
}

export function parseLengthOfStayDays(lengthOfStay: string): number {
  const normalized = (lengthOfStay || "").trim().toLowerCase();
  if (
    normalized.includes("1-day") ||
    normalized.includes("1 day") ||
    normalized.includes("day trip") ||
    normalized === "1"
  ) {
    return 1;
  }
  if (
    normalized.includes("3-day") ||
    normalized.includes("3 days") ||
    normalized.includes("long weekend") ||
    normalized === "3"
  ) {
    return 3;
  }
  if (
    normalized.includes("2-day") ||
    normalized.includes("2 days") ||
    normalized.includes("weekend") ||
    normalized === "2"
  ) {
    return 2;
  }
  if (
    normalized.includes("4-5") ||
    normalized.includes("4–5") ||
    normalized.includes("5") ||
    normalized.includes("4")
  ) {
    return 5;
  }
  if (
    normalized.includes("1-week") ||
    normalized.includes("7") ||
    normalized.includes("week")
  ) {
    return 7;
  }
  if (
    normalized.includes("extended") ||
    normalized.includes("8") ||
    normalized.includes("10")
  ) {
    return 10;
  }
  const match = normalized.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0) return Math.min(val, 14);
  }
  return 1;
}

export const FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX =
  /\b(tingloy|maricaban|sombrero\s+island|sepoc|caban\s+island|caban\s+cove|beatrice|mapating|layag[- ]layag|batalang\s+bato|bonito|puerto\s+galera|sabang|canyons|white\s+beach|tamaraw|mindoro|boracay|coron|el\s+nido|palawan|moalboal|malapascua|cebu|apo\s+reef|apo\s+island|subic|tubbataha|panglao|bohol|dumaguete|mactan|dauin)\b/i;

export const POPULAR_MABINI_DIVE_SITES = [
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

export function isOutsideMabini(locationOrText: string): boolean {
  if (!locationOrText) return false;
  return FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX.test(locationOrText);
}

export type PlanActivity = {
  period: "Morning" | "Afternoon" | "Evening";
  time: string;
  title: string;
  details: string;
};

export type PlanDayItem = {
  day: number;
  title: string;
  activities: PlanActivity[];
};

export function alignPlanDays(
  days: PlanDayItem[],
  targetDays: number,
  fallbackSites: string[] = POPULAR_MABINI_DIVE_SITES
): PlanDayItem[] {
  if (targetDays <= 0) return days;

  let aligned: PlanDayItem[] = [];

  if (days.length >= targetDays) {
    aligned = days.slice(0, targetDays);
  } else {
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
        title:
          d === targetDays
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
            details:
              "Review sightings, complete logbook entries, and observe the Mabini coastal sunset.",
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

export function sanitizePlanActivities(
  days: PlanDayItem[],
  fallbackSites: string[] = POPULAR_MABINI_DIVE_SITES
): PlanDayItem[] {
  let siteIdx = 0;
  const getNextSite = () => {
    const s = fallbackSites[siteIdx % fallbackSites.length];
    siteIdx += 1;
    return s;
  };

  const globalRegex = new RegExp(
    FORBIDDEN_OUTSIDE_DESTINATIONS_REGEX.source,
    "gi"
  );

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

