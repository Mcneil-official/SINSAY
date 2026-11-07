import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { DiveSiteRow } from "../types/supabase";

export interface MarineSpecies {
  name: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export interface PinPosition {
  x: number;
  y: number;
}

export interface SiteEnrichment {
  coords?: PinPosition;
  barangay: string;
  depthRange: string;
  featureTag: string;
  difficulty: string;
  isMpa: boolean;
  description: string;
  marineLife: MarineSpecies[];
  ecoRules: string[];
}

export function getDifficultyColor(diff?: string | null): string {
  switch (diff) {
    case "Beginner":
    case "Open Water":
      return "#10B981";
    case "Intermediate":
    case "Rescue":
      return "#F59E0B";
    case "Advanced":
    case "Divemaster":
    case "Instructor":
      return "#EF4444";
    default:
      return colors.primaryBlue;
  }
}

export const SITE_ENRICHMENTS: Record<string, SiteEnrichment> = {
  "Cathedral Rock": {
    coords: { x: 184, y: 182 },
    barangay: "Bagalangit, Mabini",
    depthRange: "12–28m",
    featureTag: "Cavern & Coral Sanctuary",
    difficulty: "Beginner",
    isMpa: true,
    description:
      "One of Mabini's most famous marine sanctuaries. Two dramatic volcanic rock formations rise from a sloping sandy bottom with an underwater grotto and cross at 15m, carpeted in vivid anthias, sponges, and gorgonian sea fans.",
    marineLife: [
      { name: "Hawksbill Sea Turtle", tag: "Resident", icon: "shield-outline" },
      { name: "Giant Frogfish", tag: "Macro", icon: "eye-outline" },
      { name: "Yellowtail Barracuda", tag: "Schooling", icon: "fish-outline" },
      { name: "Nudibranchs (Chromodoris)", tag: "Macro", icon: "color-palette-outline" },
      { name: "Blue-Spotted Stingray", tag: "Reef Floor", icon: "compass-outline" },
    ],
    ecoRules: [
      "Strict No-Touch Sanctuary: Keep fins at least 1.5m above the coral garden and cavern floor.",
      "Do not feed fish or touch resident Hawksbill turtles—maintain a respectful 3m viewing distance.",
      "No reef hooks, pointer sticks on live coral, or flash strobes within 0.5m of frogfish.",
    ],
  },
  "El Pinoy": {
    coords: { x: 194, y: 198 },
    barangay: "Bagalangit, Mabini",
    depthRange: "8–24m",
    featureTag: "Reef Slope & Clam Sanctuary",
    difficulty: "Beginner",
    isMpa: true,
    description:
      "A scenic and tranquil coral slope in Bagalangit featuring gentle terraces of hard corals, giant clams (Tridacna), schooling damselfish, and colorful nudibranchs along the sandy edges.",
    marineLife: [
      { name: "Giant Clams (Tridacna)", tag: "Coral Garden", icon: "sparkles-outline" },
      { name: "Hawksbill Sea Turtle", tag: "Resident", icon: "shield-outline" },
      { name: "Nudibranchs", tag: "Macro Slope", icon: "color-palette-outline" },
      { name: "Anemonefish & Coral Shrimps", tag: "Shallow Reef", icon: "fish-outline" },
    ],
    ecoRules: [
      "Maintain neutral buoyancy: keep fins at least 1.5m clear of giant clams and fragile staghorn thickets.",
      "Never touch, prod, or cast shadows over giant clams to provoke sudden mantle closure.",
      "Verify your Eco-Dive ID pass and dive exclusively with certified Mabini local dive guides.",
    ],
  },
  "Arthur's Rock": {
    coords: { x: 202, y: 212 },
    barangay: "Bagalangit, Mabini",
    depthRange: "8–26m",
    featureTag: "Macro Pinnacle & Sanctuary",
    difficulty: "Advanced",
    isMpa: true,
    description:
      "A protected coral slope descending from a shallow boulder reef into rich crinoid and soft-coral gardens, prized by underwater photographers for rare critters and vibrant reef life.",
    marineLife: [
      { name: "Pygmy Seahorse", tag: "Gorgonian Fan", icon: "sparkles-outline" },
      { name: "Harlequin Shrimp", tag: "Rare Critter", icon: "star-outline" },
      { name: "Banded Sea Krait", tag: "Reef Slope", icon: "water-outline" },
      { name: "Ornate Ghost Pipefish", tag: "Camouflaged", icon: "leaf-outline" },
    ],
    ecoRules: [
      "Marine Protected Area: Limit strobe flashes to 3 shots per pygmy seahorse to prevent stress blindness.",
      "Never manipulate crinoids or sea fans to position macro subjects.",
      "Maintain neutral buoyancy at least 1.5m above the crinoid bed.",
    ],
  },
  "Twin Rocks": {
    coords: { x: 222, y: 238 },
    barangay: "Solo, Mabini",
    depthRange: "5–22m",
    featureTag: "Core Marine Sanctuary",
    difficulty: "Beginner",
    isMpa: true,
    description:
      "A premier marine sanctuary off Barangay Solo where twin submerged barges and thriving hard-coral slopes host giant trevallies, turtles, and clouds of damselfish.",
    marineLife: [
      { name: "Green Sea Turtle", tag: "Resident", icon: "shield-outline" },
      { name: "Giant Trevally", tag: "Pelagic", icon: "flash-outline" },
      { name: "Ribbon Eel", tag: "Sandy Slope", icon: "water-outline" },
      { name: "Clown Anemonefish", tag: "Reef Shallow", icon: "fish-outline" },
    ],
    ecoRules: [
      "Core No-Take Zone: Anchoring, fishing, and shell collection are strictly prohibited.",
      "Practice frog-kicking over sandy patches to avoid silting delicate table corals.",
      "Maintain at least 2m viewing distance from resident green sea turtles.",
    ],
  },
  "Anilao Cove": {
    coords: { x: 202, y: 140 },
    barangay: "Anilao Proper, Mabini",
    depthRange: "5–18m",
    featureTag: "Calm Lagoon & Macro Muck",
    difficulty: "Beginner",
    isMpa: true,
    description:
      "Sheltered cove in Mabini renowned for gentle currents, juvenile reef fish nurseries, and world-class twilight/night macro diving along black-sand patches.",
    marineLife: [
      { name: "Wonderpus Octopus", tag: "Night / Muck", icon: "moon-outline" },
      { name: "Flamboyant Cuttlefish", tag: "Bottom Dweller", icon: "color-palette-outline" },
      { name: "Mandarin Fish", tag: "Dusk Rubble", icon: "sparkles-outline" },
      { name: "Juvenile Batfish", tag: "Shallow Reef", icon: "fish-outline" },
    ],
    ecoRules: [
      "Use red focus lights during dusk mandarin fish dives—avoid continuous bright white beams.",
      "Maintain trim buoyancy above black-sand muck habitats to protect burrowing cephalopods.",
      "Do not disturb rubble piles where mandarin fish mate at sunset.",
    ],
  },
  "Sombrero Island": {
    coords: { x: 86, y: 246 },
    barangay: "Maricaban Strait",
    depthRange: "8–25m",
    featureTag: "Island Reef & Drop-Off",
    difficulty: "Intermediate",
    isMpa: true,
    description:
      "A hat-shaped offshore island at the western entrance to Maricaban Strait offering sweeping coral terraces, swim-throughs, and nutrient-rich currents.",
    marineLife: [
      { name: "Whitetip Reef Shark", tag: "Deep Ledge", icon: "flash-outline" },
      { name: "Emperor Angelfish", tag: "Coral Terrace", icon: "fish-outline" },
      { name: "Moray Eel", tag: "Crevices", icon: "eye-outline" },
      { name: "Sea Fans & Barrel Sponges", tag: "Wall", icon: "leaf-outline" },
    ],
    ecoRules: [
      "Check current strength with your dive guide before descending and carry a Surface Marker Buoy (SMB).",
      "Stay clear of shallow surge zones to avoid damaging fire and staghorn corals.",
    ],
  },
  "Sepoc Beach": {
    coords: { x: 118, y: 294 },
    barangay: "Maricaban Island, Tingloy",
    depthRange: "6–20m",
    featureTag: "Vertical Wall & Coral Garden",
    difficulty: "Beginner",
    isMpa: true,
    description:
      "Crystal-clear turquoise waters off the western tip of Maricaban Island featuring a shallow coral garden that drops into a colorful miniature wall teeming with sponges.",
    marineLife: [
      { name: "Hawksbill Turtle", tag: "Wall Ledge", icon: "shield-outline" },
      { name: "Blue-Ringed Octopus", tag: "Rubble Reef", icon: "warning-outline" },
      { name: "Anthias & Fusiliers", tag: "Reef Crest", icon: "fish-outline" },
      { name: "Leaf Scorpionfish", tag: "Camouflaged", icon: "leaf-outline" },
    ],
    ecoRules: [
      "Marine Protected Area: Do not step on shallow reef flats when boarding or exiting dive boats.",
      "Blue-ringed octopuses are venomous—observe from a safe distance and never provoke.",
    ],
  },
  Mainit: {
    coords: { x: 278, y: 268 },
    barangay: "Mainit, Mabini",
    depthRange: "15–35m",
    featureTag: "Strong Current & Pelagic Point",
    difficulty: "Advanced",
    isMpa: true,
    description:
      "Thrilling southern point of the Calumpan Peninsula where upwelling currents from Maricaban Strait attract patrolling sharks, dogtooth tuna, and swirling jacks.",
    marineLife: [
      { name: "Bigeye Trevally School", tag: "Pelagic", icon: "flash-outline" },
      { name: "Whitetip & Grey Reef Sharks", tag: "Deep Point", icon: "compass-outline" },
      { name: "Geothermal Bubble Vents", tag: "Volcanic Sand", icon: "flame-outline" },
      { name: "Napoleon Wrasse", tag: "Outer Slope", icon: "fish-outline" },
    ],
    ecoRules: [
      "Advanced Drift Site: Stay together with your buddy team and deploy your SMB before ascending.",
      "Do not hold onto live coral heads in current—tuck into natural rock eddies only if needed.",
    ],
  },
  Tingloy: {
    coords: { x: 186, y: 318 },
    barangay: "Tingloy Island",
    depthRange: "10–28m",
    featureTag: "Island Sanctuary & Soft Corals",
    difficulty: "Intermediate",
    isMpa: true,
    description:
      "Vibrant island reef along the Maricaban Strait celebrated for kaleidoscopic soft coral trees, crystal visibility, and abundant pelagic and macro marine life.",
    marineLife: [
      { name: "Soft Coral Dendronephthya", tag: "Reef Slope", icon: "flower-outline" },
      { name: "Frogfish & Ghost Pipefish", tag: "Macro", icon: "eye-outline" },
      { name: "Schooling Bannerfish", tag: "Mid-Water", icon: "fish-outline" },
      { name: "Sea Turtles", tag: "Sanctuary", icon: "shield-outline" },
    ],
    ecoRules: [
      "Keep hoses and gauges clipped tightly to your BCD so they never drag across soft coral trees.",
      "Ensure your Eco-Dive ID pass is verified before entering Tingloy sanctuary waters.",
    ],
  },
};

const FALLBACK_POSITIONS: PinPosition[] = [
  { x: 184, y: 182 },
  { x: 202, y: 212 },
  { x: 222, y: 238 },
  { x: 202, y: 140 },
  { x: 86, y: 246 },
  { x: 118, y: 294 },
  { x: 278, y: 268 },
  { x: 186, y: 318 },
  { x: 152, y: 262 },
  { x: 244, y: 286 },
];

export function getSiteEnrichment(site: DiveSiteRow, index: number = 0): SiteEnrichment {
  const known =
    SITE_ENRICHMENTS[site.name] ||
    Object.entries(SITE_ENRICHMENTS).find(([name]) =>
      site.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(site.name.toLowerCase())
    )?.[1];

  let coords = known?.coords;

  if (
    !coords &&
    typeof site.lat === "number" &&
    typeof site.lng === "number" &&
    site.lat >= 13.62 &&
    site.lat <= 13.82 &&
    site.lng >= 120.82 &&
    site.lng <= 121.02
  ) {
    const normX = (site.lng - 120.82) / 0.18;
    const normY = (13.8 - site.lat) / 0.16;
    coords = {
      x: Math.round(Math.min(Math.max(normX * 280 + 60, 68), 332)),
      y: Math.round(Math.min(Math.max(normY * 200 + 125, 130), 322)),
    };
  }

  if (!coords) {
    coords = FALLBACK_POSITIONS[index % FALLBACK_POSITIONS.length];
  }

  return {
    coords,
    barangay: site.barangay
      ? `${site.barangay}, Mabini, Batangas`
      : known?.barangay || "Mabini, Batangas",
    depthRange: site.depth_range || known?.depthRange || "8–24m",
    featureTag:
      known?.featureTag ||
      (site.site_type ? `${site.site_type} Sanctuary` : "Coral Reef Sanctuary"),
    difficulty: site.difficulty || known?.difficulty || "Open Water",
    isMpa: known?.isMpa ?? true,
    description:
      site.description ||
      known?.description ||
      "Protected marine ecosystem in Mabini, Batangas featuring healthy coral slopes, abundant reef fish, and diverse macro marine life.",
    marineLife: known?.marineLife || [
      { name: "Hawksbill Sea Turtle", tag: "Resident", icon: "shield-outline" },
      { name: "Painted Frogfish", tag: "Macro", icon: "eye-outline" },
      { name: "Nudibranchs", tag: "Reef Slope", icon: "color-palette-outline" },
      { name: "Anthias & Damselfish", tag: "Coral Garden", icon: "fish-outline" },
    ],
    ecoRules: known?.ecoRules || [
      "Strict No-Touch Zone: Maintain neutral buoyancy at least 1.5m above live corals.",
      "Do not feed marine life, wear reef gloves, or rest camera gear on the reef substrate.",
      "Keep your Eco-Dive ID active and follow your accredited dive guide's briefing.",
    ],
  };
}
