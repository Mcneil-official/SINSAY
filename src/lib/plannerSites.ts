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
  const available = databaseSites.map(toPlannerSite);
  const used = new Set<string>();
  const resolved: PlannerSite[] = [];

  for (const suggestion of suggestions) {
    const requested = normalize(suggestion.name || "");
    if (!requested) continue;
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
