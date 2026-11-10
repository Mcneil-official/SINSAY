import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { DidYouKnowCard, ErrorState, resolveSiteImage } from "../../components";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  canonicalSiteKey,
  isSameSite,
  resolveSiteCoords,
} from "../../lib/diveSiteCatalog";
import { supabase } from "../../lib/supabase";
import { DiveSiteRow } from "../../types/supabase";

interface MarineSpecies {
  name: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface SiteEnrichment {
  lat: number;
  lng: number;
  barangay: string;
  depthRange: string;
  featureTag: string;
  difficulty: string;
  isMpa: boolean;
  description: string;
  marineLife: MarineSpecies[];
  ecoRules: string[];
}

export const ALL_DEFAULT_SITES: DiveSiteRow[] = [
  {
    id: "landmark-cathedral-rock",
    site_code: "DS-001",
    name: "Cathedral Rock",
    barangay: "Bagalangit",
    depth_range: "12–28m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.9",
    description:
      "Iconic marine sanctuary featuring two submerged volcanic rock pinnacles framing a cross-adorned cavern at 15 meters, surrounded by vibrant soft corals and dense schools of reef fish.",
    image_url: null,
    photo_url: null,
    lat: 13.7241,
    lng: 120.8769,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-arthurs-rock",
    site_code: "DS-002",
    name: "Arthur's Rock",
    barangay: "Bagalangit",
    depth_range: "8–26m",
    difficulty: "Advanced",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "A protected coral slope descending from a shallow boulder reef into rich crinoid and soft-coral gardens, prized by underwater photographers for rare critters and vibrant reef life.",
    image_url: null,
    photo_url: null,
    lat: 13.7039,
    lng: 120.8728,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-twin-rocks",
    site_code: "DS-003",
    name: "Twin Rocks Sanctuary",
    barangay: "Solo",
    depth_range: "5–22m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.9",
    description:
      "A premier marine sanctuary off Barangay Solo where twin submerged barges and thriving hard-coral slopes host giant trevallies, resident turtles, and clouds of damselfish.",
    image_url: null,
    photo_url: null,
    lat: 13.6906,
    lng: 120.8893,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-anilao-cove",
    site_code: "DS-004",
    name: "Anilao Cove",
    barangay: "Anilao Proper",
    depth_range: "5–18m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.7",
    description:
      "Sheltered cove with gentle slopes and calm surface conditions, perfect for check-out dives and night macro critter hunts.",
    image_url: null,
    photo_url: null,
    lat: 13.7550,
    lng: 120.8960,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-sombrero-island",
    site_code: "DS-005",
    name: "Sombrero Island",
    barangay: "Maricaban Strait",
    depth_range: "10–35m",
    difficulty: "Intermediate",
    site_type: "Wall",
    status: "Active",
    rating: "4.9",
    description:
      "Hat-shaped offshore island encircled by steep drop-offs, vibrant sea fan gardens, schooling jacks, and occasional reef sharks in brisk currents.",
    image_url: null,
    photo_url: null,
    lat: 13.698,
    lng: 120.8282,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-beatrice-rock",
    site_code: "DS-006",
    name: "Beatrice Rock",
    barangay: "Sombrero Channel",
    depth_range: "14–32m",
    difficulty: "Advanced",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "Dynamic current-swept pinnacle swarming with thousands of orange and purple anthias, fusiliers, and hunting bluefin trevallies.",
    image_url: null,
    photo_url: null,
    lat: 13.7022,
    lng: 120.8279,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-sepoc-wall",
    site_code: "DS-007",
    name: "Sepoc Wall",
    barangay: "Maricaban NW",
    depth_range: "6–28m",
    difficulty: "Beginner",
    site_type: "Wall",
    status: "Active",
    rating: "4.7",
    description:
      "Gentle vertical wall with coral crevices, barrel sponges, and friendly sea turtles basking along sunny reef flats.",
    image_url: null,
    photo_url: null,
    lat: 13.6878,
    lng: 120.8271,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-layag-layag",
    site_code: "DS-008",
    name: "Layag-Layag",
    barangay: "Caban Island",
    depth_range: "8–24m",
    difficulty: "Intermediate",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "Vibrant ridge formation with thriving staghorn thickets, colorful nudibranchs, and schools of yellowtail snappers.",
    image_url: null,
    photo_url: null,
    lat: 13.6918,
    lng: 120.8413,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-kiribatcho",
    site_code: "DS-009",
    name: "Kiribatcho",
    barangay: "Caban Island",
    depth_range: "12–28m",
    difficulty: "Intermediate",
    site_type: "Wall",
    status: "Active",
    rating: "4.7",
    description:
      "Dramatic wall drop-off favored by macro photographers for pygmy seahorses, ornate ghost pipefish, and rare nudibranchs.",
    image_url: null,
    photo_url: null,
    lat: 13.6917,
    lng: 120.843,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-eagle-point",
    site_code: "DS-010",
    name: "Eagle Point",
    barangay: "Bagalangit",
    depth_range: "5–25m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "House reef with easy boat access, healthy hard-coral bommies, clownfish colonies, and moray eels in shallow crevices.",
    image_url: null,
    photo_url: null,
    lat: 13.7223,
    lng: 120.8759,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-batong-buhay",
    site_code: "DS-011",
    name: "Batong Buhay",
    barangay: "Bagalangit",
    depth_range: "10–30m",
    difficulty: "Advanced",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "Deep sloping coral reef known for encounters with big pelagics, hunting Spanish mackerels, and lush black coral bushes.",
    image_url: null,
    photo_url: null,
    lat: 13.7200,
    lng: 120.8740,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-anilao-pier",
    site_code: "DS-012",
    name: "Anilao Pier",
    barangay: "Anilao Proper",
    depth_range: "3–14m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "Legendary night and twilight critter diving directly beneath the public pier pilings; famed for bobtail squids, stargazers, and frogfish.",
    image_url: null,
    photo_url: null,
    lat: 13.7608,
    lng: 120.9271,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-mainit-muck",
    site_code: "DS-013",
    name: "Mainit Muck",
    barangay: "San Jose",
    depth_range: "5–20m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.9",
    description:
      "Warm hydrothermal springs bubbling up through dark volcanic sand, creating unique habitats for mimic octopuses, wonderpus, and dragonets.",
    image_url: null,
    photo_url: null,
    lat: 13.6865,
    lng: 120.8958,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-mapating-rock",
    site_code: "DS-014",
    name: "Mapating Rock",
    barangay: "Maricaban Strait",
    depth_range: "15–40m",
    difficulty: "Advanced",
    site_type: "Pinnacle",
    status: "Active",
    rating: "4.9",
    description:
      "Current-swept open-water pinnacle ('Shark Rock') attracting whitetip and grey reef sharks, giant trevallies, and schooling tuna.",
    image_url: null,
    photo_url: null,
    lat: 13.6759,
    lng: 120.8135,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-red-rock",
    site_code: "DS-015",
    name: "Red Rock",
    barangay: "Bagalangit",
    depth_range: "8–25m",
    difficulty: "Intermediate",
    site_type: "Reef",
    status: "Active",
    rating: "4.7",
    description:
      "Named after reddish volcanic shoreline cliffs, offering terraced coral gardens with sea anemones, porcelain crabs, and pipefish.",
    image_url: null,
    photo_url: null,
    lat: 13.7078,
    lng: 120.9213,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-mermaid-rock",
    site_code: "DS-016",
    name: "Mermaid Rock",
    barangay: "Bagalangit",
    depth_range: "6–22m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.7",
    description:
      "Picturesque reef slope adorned with leather soft corals, blue damselfish, juvenile batfish, and resident hawksbill turtles.",
    image_url: null,
    photo_url: null,
    lat: 13.7190,
    lng: 120.8760,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-koala",
    site_code: "DS-017",
    name: "Koala",
    barangay: "Bagalangit",
    depth_range: "9–26m",
    difficulty: "Intermediate",
    site_type: "Wall",
    status: "Active",
    rating: "4.6",
    description:
      "A scenic drift dive along lush sloping drop-offs with crinoid-covered boulders, triggerfish, and hunting sweetlips.",
    image_url: null,
    photo_url: null,
    lat: 13.7165,
    lng: 120.8722,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-bethlehem",
    site_code: "DS-018",
    name: "Bethlehem",
    barangay: "Solo",
    depth_range: "6–20m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "Protected reef garden known for nudibranch biodiversity, painted frogfish, and dense schooling fusiliers.",
    image_url: null,
    photo_url: null,
    lat: 13.6729,
    lng: 120.8414,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-secret-bay",
    site_code: "DS-019",
    name: "Basura",
    barangay: "San Jose",
    depth_range: "5–18m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.9",
    description:
      "World-renowned black-sand muck diving amphitheater famous for mimic octopuses, wonderpus, flamboyant cuttlefish, and frogfish.",
    image_url: null,
    photo_url: null,
    lat: 13.7582,
    lng: 120.9167,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-dead-palm",
    site_code: "DS-020",
    name: "Dead Palm",
    barangay: "San Teodoro",
    depth_range: "7–22m",
    difficulty: "Intermediate",
    site_type: "Reef",
    status: "Active",
    rating: "4.6",
    description:
      "Rich macro slope named after an old shoreline landmark, home to pygmy seahorses, banded sea kraits, and mantis shrimps.",
    image_url: null,
    photo_url: null,
    lat: 13.6952,
    lng: 120.8847,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-divers-sanctuary",
    site_code: "DS-021",
    name: "Diver's Sanctuary",
    barangay: "Bagalangit",
    depth_range: "6–20m",
    difficulty: "Beginner",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "Protected reef sanctuary with vibrant brain corals, giant clams, and friendly schools of batfish.",
    image_url: null,
    photo_url: null,
    lat: 13.7160,
    lng: 120.8800,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-dari-laut",
    site_code: "DS-022",
    name: "Dari Laut",
    barangay: "San Teodoro",
    depth_range: "12–25m",
    difficulty: "Intermediate",
    site_type: "Wreck",
    status: "Active",
    rating: "4.8",
    description:
      "Sunken floating casino timber wreck now encrusted with hard and soft corals, serving as an artificial reef haven for sweetlips and moray eels.",
    image_url: null,
    photo_url: null,
    lat: 13.6786,
    lng: 120.8405,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-ligpo-island",
    site_code: "DS-023",
    name: "Ligpo Island",
    barangay: "Ligpo",
    depth_range: "10–30m",
    difficulty: "Intermediate",
    site_type: "Wall",
    status: "Active",
    rating: "4.8",
    description:
      "Dramatic offshore rocky islet with steep coral drop-offs, gorgonian sea fans, and frequent sightings of schooling barracudas.",
    image_url: null,
    photo_url: null,
    lat: 13.8209,
    lng: 120.9009,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-mainit-point",
    site_code: "DS-024",
    name: "Mainit Point",
    barangay: "San Jose",
    depth_range: "8–28m",
    difficulty: "Advanced",
    site_type: "Reef",
    status: "Active",
    rating: "4.8",
    description:
      "High-energy tip of the peninsula featuring roaring currents, schooling jacks, dogtooth tuna, and pristine gorgonian seafans.",
    image_url: null,
    photo_url: null,
    lat: 13.6823,
    lng: 120.8932,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "landmark-devils-point",
    site_code: "DS-025",
    name: "Devil's Point",
    barangay: "Maricaban Strait",
    depth_range: "12–35m",
    difficulty: "Advanced",
    site_type: "Wall",
    status: "Active",
    rating: "4.8",
    description:
      "Exhilarating deep drift along underwater ravines, hosting black coral forests, stingrays, and cruising trevallies.",
    image_url: null,
    photo_url: null,
    lat: 13.6503,
    lng: 120.8415,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const SITE_ENRICHMENTS: Record<string, Partial<SiteEnrichment>> = {
  "Cathedral Rock": {
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
      { name: "Nudibranchs", tag: "Macro", icon: "color-palette-outline" },
    ],
    ecoRules: [
      "Strict No-Touch Sanctuary: Keep fins at least 1.5m above the coral garden.",
      "Do not feed fish or touch resident Hawksbill turtles—maintain a 3m viewing distance.",
      "No reef hooks or flash strobes within 0.5m of frogfish.",
    ],
  },
  "Arthur's Rock": {
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
    ],
    ecoRules: [
      "Limit strobe flashes to 3 shots per pygmy seahorse to prevent stress blindness.",
      "Never manipulate crinoids or sea fans to position macro subjects.",
    ],
  },
  "Twin Rocks Sanctuary": {
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
    ],
    ecoRules: [
      "Core No-Take Zone: Anchoring, fishing, and shell collection are strictly prohibited.",
      "Practice frog-kicking over sandy patches to avoid silting delicate table corals.",
    ],
  },
  "Sombrero Island": {
    barangay: "Maricaban Strait",
    depthRange: "10–35m",
    featureTag: "Offshore Island Sanctuary",
    difficulty: "Intermediate",
    isMpa: true,
    description:
      "Hat-shaped offshore island encircled by steep drop-offs, vibrant sea fan gardens, schooling jacks, and occasional reef sharks in brisk currents.",
    marineLife: [
      { name: "Whitetip Reef Shark", tag: "Pelagic", icon: "shield-outline" },
      { name: "Schooling Jacks", tag: "Pelagic", icon: "fish-outline" },
      { name: "Gorgonian Sea Fans", tag: "Deep Wall", icon: "leaf-outline" },
    ],
    ecoRules: [
      "Carry a surface marker buoy (SMB) on every dive due to open-water current shears.",
      "Stay close to your accredited dive guide when rounding the northern current ridge.",
    ],
  },
};

function getDifficultyColor(diff?: string | null): string {
  if (!diff) return "#10B981";
  const d = diff.toLowerCase();
  if (d.includes("beginner") || d.includes("open water")) return "#10B981";
  if (d.includes("intermediate") || d.includes("rescue")) return "#F59E0B";
  if (d.includes("advanced") || d.includes("divemaster") || d.includes("instructor")) return "#EF4444";
  return "#2563EB";
}

function getEnrichment(site: DiveSiteRow): SiteEnrichment {
  const known = SITE_ENRICHMENTS[site.name];
  const coords = resolveSiteCoords(site.name, site.lat, site.lng);
  const lat = coords?.lat ?? 13.722;
  const lng = coords?.lng ?? 120.875;

  return {
    lat,
    lng,
    barangay: site.barangay
      ? `${site.barangay}, Mabini, Batangas`
      : known?.barangay || "Mabini, Batangas",
    depthRange: site.depth_range || known?.depthRange || "10–25m",
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

// Generates high-performance Leaflet container with OpenStreetMap tiles
// 100% Free, ZERO API keys, ZERO watermarks, smooth 60fps pan & pinch-to-zoom!
function generateLeafletMapHtml(
  sitesJson: string,
  initialSelectedId: string | null
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background: #E8ECE9;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .leaflet-bar { border: none !important; box-shadow: none !important; }
    .custom-pin {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }
    .pin-halo {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      transition: transform 0.2s ease;
    }
    .pin-core {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pin-dot {
      width: 3.5px;
      height: 3.5px;
      border-radius: 50%;
      background: #ffffff;
    }
    .pin-pulse {
      position: absolute;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 2px dashed #2563EB;
      background: rgba(37,99,235,0.18);
      animation: pulse 1.8s infinite ease-out;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(1.35); opacity: 0; }
    }
    .user-beacon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #2563EB;
      border: 3px solid #ffffff;
      box-shadow: 0 0 12px rgba(37,99,235,0.85);
    }
    .leaflet-control-attribution {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const sites = ${sitesJson};
    let selectedId = ${initialSelectedId ? `'${initialSelectedId}'` : 'null'};

    const map = L.map('map', {
      center: [13.722, 120.875],
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap Standard Tiles (100% Free, Zero API Keys, Zero Watermarks)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // 1. Official RA 8550 Maricaban Strait Median Line
    const medianCoords = [
      [13.676, 120.790],
      [13.673, 120.830],
      [13.670, 120.865],
      [13.668, 120.900],
      [13.672, 120.935],
      [13.680, 120.965]
    ];
    L.polyline(medianCoords, {
      color: '#0284C7',
      weight: 2.5,
      dashArray: '6, 6',
      opacity: 0.85
    }).addTo(map);

    // 2. Marine Protected Area (MPA) Polygons
    // Cathedral Rock Sanctuary
    L.polygon([
      [13.725, 120.871],
      [13.725, 120.879],
      [13.719, 120.879],
      [13.719, 120.871]
    ], {
      color: '#059669',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#10B981',
      fillOpacity: 0.18
    }).addTo(map);

    // Twin Rocks Core Sanctuary (Sitio Balanoy, Brgy. San Teodoro;
    // ~22.9 ha per Mabini CDP — redrawn around the LGU/boat-GPS pin 13.6906/120.8893)
    L.polygon([
      [13.6930, 120.8865],
      [13.6930, 120.8920],
      [13.6895, 120.8920],
      [13.6895, 120.8865]
    ], {
      color: '#059669',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#10B981',
      fillOpacity: 0.18
    }).addTo(map);

    // Sombrero Island Marine Reserve
    L.polygon([
      [13.701, 120.822],
      [13.701, 120.835],
      [13.691, 120.835],
      [13.691, 120.822]
    ], {
      color: '#059669',
      weight: 1.5,
      dashArray: '4, 4',
      fillColor: '#10B981',
      fillOpacity: 0.18
    }).addTo(map);

    function getPinColor(diff) {
      if (diff === 'Beginner' || diff === 'Open Water') return '#10B981';
      if (diff === 'Intermediate' || diff === 'Rescue') return '#F59E0B';
      if (diff === 'Advanced' || diff === 'Divemaster' || diff === 'Instructor') return '#EF4444';
      return '#2563EB';
    }

    function createDivIcon(site, isSelected) {
      const color = getPinColor(site.difficulty);
      const pulseHtml = isSelected ? '<div class="pin-pulse"></div>' : '';
      const haloScale = isSelected ? 'transform: scale(1.25);' : '';
      const coreStyle = isSelected ? 'width:16px;height:16px;border-width:2.5px;' : '';

      const html = '<div class="custom-pin">'
        + pulseHtml
        + '<div class="pin-halo" style="background-color:' + color + (isSelected ? '44' : '26') + ';' + haloScale + '"></div>'
        + '<div class="pin-core" style="background-color:' + color + ';' + coreStyle + '">'
        + '<div class="pin-dot"></div>'
        + '</div>'
        + '</div>';

      return L.divIcon({
        className: '',
        html: html,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }

    const markers = {};

    // 3. Dive Site Markers
    sites.forEach(site => {
      if (typeof site.lat !== 'number' || typeof site.lng !== 'number') return;
      const isSelected = site.id === selectedId;
      const icon = createDivIcon(site, isSelected);

      const marker = L.marker([site.lat, site.lng], {
        icon: icon,
        zIndexOffset: isSelected ? 1000 : 10
      }).addTo(map);

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectedId = site.id;
        updateMarkers();
        map.flyTo([site.lat, site.lng], 14.5, { duration: 0.8 });
        window.parent.postMessage({ type: 'SELECT_SITE', siteId: site.id }, '*');
      });

      markers[site.id] = { marker, site };
    });

    function updateMarkers() {
      Object.keys(markers).forEach(id => {
        const { marker, site } = markers[id];
        const isSelected = site.id === selectedId;
        marker.setIcon(createDivIcon(site, isSelected));
        marker.setZIndexOffset(isSelected ? 1000 : 10);
      });
    }

    map.on('click', () => {
      selectedId = null;
      updateMarkers();
      window.parent.postMessage({ type: 'DESELECT_SITE' }, '*');
    });

    let userMarker = null;

    // React Native Bridge
    window.addEventListener('message', (e) => {
      const data = e.data;
      if (!data || !map) return;

      if (data.type === 'FOCUS_SITE') {
        selectedId = data.siteId;
        updateMarkers();
        if (data.siteId && markers[data.siteId]) {
          const { site } = markers[data.siteId];
          map.flyTo([site.lat, site.lng], 14.5, { duration: 0.8 });
        }
      } else if (data.type === 'ZOOM_IN') {
        map.zoomIn();
      } else if (data.type === 'ZOOM_OUT') {
        map.zoomOut();
      } else if (data.type === 'RESET_VIEW') {
        selectedId = null;
        updateMarkers();
        map.flyTo([13.722, 120.875], 13, { duration: 0.8 });
      } else if (data.type === 'LOCATE_ME') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              if (userMarker) {
                userMarker.setLatLng([lat, lng]);
              } else {
                const userIcon = L.divIcon({
                  className: '',
                  html: '<div class="user-beacon"></div>',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                });
                userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
              }
              map.flyTo([lat, lng], 14.5, { duration: 0.8 });
            },
            () => {
              alert('Location access is disabled or unavailable.');
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        }
      }
    });

    // Keep tiles and markers aligned if the iframe size changes after init
    // (safe-area insets, drawer layout, orientation).
    setTimeout(() => map.invalidateSize(), 200);
    window.addEventListener('resize', () => map.invalidateSize());
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapBottomOffset = 16;
  const drawerScrollBottom = 28;
  const router = useRouter();
  const { site: requestedSite } = useLocalSearchParams<{ site?: string }>();
  const { user } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [sites, setSites] = useState<DiveSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [heroImgError, setHeroImgError] = useState(false);

  const iframeRef = useRef<any>(null);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    supabase
      .from("dive_sites")
      .select("*")
      .order("created_at", { ascending: false })
      .then(
        ({ data, error: fetchError }) => {
          if (!active) return;
          if (fetchError) {
            setError(true);
          } else {
            const rawRows = (data ?? []).filter(
              (r) => !r.status || r.status !== "Restricted",
            );
            // Combine with catalog to ensure all 25 sites are present.
            // Alias-aware: catalog "Mainit Muck" is skipped when the DB has
            // "Secret Bay (Mainit Muck)", so the two never stack.
            const dbKeys = new Set(
              rawRows.map((r) => canonicalSiteKey(r.name)),
            );
            const missingDefaults = ALL_DEFAULT_SITES.filter(
              (d) => !dbKeys.has(canonicalSiteKey(d.name)),
            );
            const merged = [...rawRows, ...missingDefaults];
            setSites(merged);
            setError(false);
          }
          setLoading(false);
        },
        () => {
          if (!active) return;
          setError(true);
          setLoading(false);
        },
      );
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const { data } = await supabase
        .from("tourist_favorites")
        .select("dive_site_id")
        .eq("tourist_id", user.id);
      setFavoriteIds(new Set((data ?? []).map((f) => f.dive_site_id)));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const handleToggleFavorite = useCallback(
    async (diveSiteId: string) => {
      if (!user || diveSiteId.startsWith("landmark-")) return;
      const isFav = favoriteIds.has(diveSiteId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(diveSiteId);
        else next.add(diveSiteId);
        return next;
      });
      try {
        if (isFav) {
          const { error } = await supabase
            .from("tourist_favorites")
            .delete()
            .eq("tourist_id", user.id)
            .eq("dive_site_id", diveSiteId);
          if (error) {
            setFavoriteIds((prev) => new Set(prev).add(diveSiteId));
          }
        } else {
          const { error } = await supabase
            .from("tourist_favorites")
            .insert({ tourist_id: user.id, dive_site_id: diveSiteId });
          if (error) {
            setFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(diveSiteId);
              return next;
            });
          }
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(diveSiteId);
          else next.delete(diveSiteId);
          return next;
        });
      }
    },
    [favoriteIds, user],
  );

  const selectedSiteIndex = useMemo(
    () => sites.findIndex((s) => s.id === selectedSiteId),
    [sites, selectedSiteId],
  );

  const selectedSite =
    selectedSiteIndex >= 0 ? sites[selectedSiteIndex] : null;

  const selectedEnrichment = useMemo(() => {
    if (!selectedSite) return null;
    return getEnrichment(selectedSite);
  }, [selectedSite]);

  // Handle message from Leaflet iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.type === "SELECT_SITE") {
          setHeroImgError(false);
          setSelectedSiteId(data.siteId);
        } else if (data?.type === "DESELECT_SITE") {
          setSelectedSiteId(null);
        }
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, []);

  const handleSelectPin = useCallback((siteId: string) => {
    setHeroImgError(false);
    setSelectedSiteId(siteId);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "FOCUS_SITE", siteId },
        "*",
      );
    }
  }, []);

  useEffect(() => {
    if (!requestedSite || sites.length === 0 || selectedSiteId) return;
    const requested = sites.find((site) => isSameSite(site.name, requestedSite));
    if (requested) handleSelectPin(requested.id);
  }, [requestedSite, sites, selectedSiteId, handleSelectPin]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedSiteId(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "ZOOM_IN" }, "*");
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "ZOOM_OUT" }, "*");
    }
  }, []);

  const handleResetMap = useCallback(() => {
    setSelectedSiteId(null);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "RESET_VIEW" }, "*");
    }
  }, []);

  const handleLocateMe = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "LOCATE_ME" }, "*");
    }
  }, []);

  // Format sites payload for Leaflet. Sites with no trustworthy position
  // (no verified fix and no DB coordinates) are dropped instead of being
  // stacked at a fake default center.
  const sitesForMap = useMemo(() => {
    return sites.flatMap((s) => {
      const coords = resolveSiteCoords(s.name, s.lat, s.lng);
      if (!coords) return [];
      return [
        {
          id: s.id,
          name: s.name,
          difficulty: s.difficulty || getEnrichment(s).difficulty,
          lat: coords.lat,
          lng: coords.lng,
        },
      ];
    });
  }, [sites]);

  const leafletHtml = useMemo(() => {
    return generateLeafletMapHtml(
      JSON.stringify(sitesForMap),
      selectedSiteId,
    );
  }, [selectedSiteId, sitesForMap]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ErrorState
            message="Failed to load Mabini dive map."
            onRetry={handleRetry}
          />
        </View>
      ) : (
        <View style={styles.mapViewport}>
          {/* 1. LEAFLET CARTO VOYAGER ILLUSTRATED CONTAINER (ZERO CLUTTER, SMOOTH PAN & ZOOM) */}
          <View style={styles.canvasWrap}>
            {React.createElement("iframe", {
              ref: iframeRef,
              srcDoc: leafletHtml,
              style: {
                width: "100%",
                height: "100%",
                border: "none",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#E8ECE9",
              },
              title: "Mabini Peninsula Illustrated Dive Map",
            })}
          </View>

          {/* 2. TOP OVERLAY: CLEAN HEADER BAR (NO FILTERS TAKING UP SPACE) */}
          <View style={styles.topOverlay} pointerEvents="box-none">
            <View style={styles.topHeaderCard}>
              <View style={styles.topHeaderLeft}>
                <View style={styles.compassBadge}>
                  <Ionicons
                    name="navigate-circle"
                    size={20}
                    color={colors.primaryBlue}
                  />
                </View>
                <View>
                  <Text style={styles.topTitle}>Mabini Peninsula Dive Map</Text>
                  <Text style={styles.topSubtitle}>
                    {sites.length} Dive Sites • Tap any pin to explore
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.allSitesBtn}
                onPress={() => router.push("/dive-sites")}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="View all dive sites list"
              >
                <Ionicons
                  name="list-outline"
                  size={15}
                  color={colors.primaryBlue}
                />
                <Text style={styles.allSitesBtnText}>List</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. BOTTOM MAP LEGEND */}
          {!selectedSite && (
            <View
              style={[styles.bottomLegendWrap, { bottom: mapBottomOffset }]}
              pointerEvents="box-none"
            >
              <View style={styles.legendBarCard}>
                <View style={styles.legendBarHeader}>
                  <Ionicons
                    name="layers-outline"
                    size={13}
                    color={colors.primaryBlue}
                  />
                  <Text style={styles.legendBarTitle}>MAP LEGEND</Text>
                </View>
                <View style={styles.legendBarRow}>
                  <View style={styles.legendItemRow}>
                    <View
                      style={[
                        styles.legendPinDot,
                        { backgroundColor: "#10B981" },
                      ]}
                    />
                    <Text style={styles.legendItemText}>Beginner</Text>
                  </View>
                  <View style={styles.legendItemRow}>
                    <View
                      style={[
                        styles.legendPinDot,
                        { backgroundColor: "#F59E0B" },
                      ]}
                    />
                    <Text style={styles.legendItemText}>Intermediate</Text>
                  </View>
                  <View style={styles.legendItemRow}>
                    <View
                      style={[
                        styles.legendPinDot,
                        { backgroundColor: "#EF4444" },
                      ]}
                    />
                    <Text style={styles.legendItemText}>Advanced</Text>
                  </View>
                  <View style={styles.legendItemRow}>
                    <View style={styles.legendMpaBox} />
                    <Text style={styles.legendItemText}>MPA Zone</Text>
                  </View>
                  <View style={styles.legendItemRow}>
                    <View style={styles.legendTerritorialLine} />
                    <Text style={styles.legendItemText}>Territorial Line</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 4. MAP ZOOM & ACTION CONTROLS */}
          <View
            style={[
              styles.mapControlsCol,
              { bottom: mapBottomOffset },
              selectedSite ? styles.mapControlsColFocused : null,
            ]}
          >
            <TouchableOpacity
              style={styles.mapCtrlBtn}
              onPress={handleZoomIn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Zoom in"
            >
              <Ionicons name="add" size={18} color={colors.darkText} />
            </TouchableOpacity>
            <View style={styles.mapCtrlDivider} />
            <TouchableOpacity
              style={styles.mapCtrlBtn}
              onPress={handleZoomOut}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Zoom out"
            >
              <Ionicons name="remove" size={18} color={colors.darkText} />
            </TouchableOpacity>
            <View style={styles.mapCtrlDivider} />
            <TouchableOpacity
              style={styles.mapCtrlBtn}
              onPress={handleLocateMe}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Locate my position"
            >
              <Ionicons
                name="locate"
                size={17}
                color={colors.primaryBlue}
              />
            </TouchableOpacity>
            <View style={styles.mapCtrlDivider} />
            <TouchableOpacity
              style={styles.mapCtrlBtn}
              onPress={handleResetMap}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Reset map view"
            >
              <Ionicons
                name="refresh-outline"
                size={16}
                color={colors.darkText}
              />
            </TouchableOpacity>
          </View>

          {/* 5. SLIDE-UP DETAIL DRAWER */}
          {selectedSite && selectedEnrichment && (
            <View style={styles.drawerSheet}>
              <View style={styles.drawerGrabberRow}>
                <View style={styles.drawerGrabber} />
              </View>

              <ScrollView
                style={styles.drawerScroll}
                contentContainerStyle={[
                  styles.drawerScrollContent,
                  { paddingBottom: drawerScrollBottom },
                ]}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Image Card */}
                <View style={styles.heroCard}>
                  <Image
                    source={
                      heroImgError
                        ? resolveSiteImage(null, null, selectedSiteIndex)
                        : resolveSiteImage(
                            selectedSite.image_url,
                            selectedSite.photo_url,
                            selectedSiteIndex,
                          )
                    }
                    style={styles.heroImage}
                    resizeMode="cover"
                    onError={() => setHeroImgError(true)}
                  />

                  {/* Dark gradient overlay for overlaid badge & controls readability */}
                  <View
                    style={[
                      styles.heroGradientOverlay,
                      { backgroundColor: "rgba(2, 8, 23, 0.42)" },
                    ]}
                    pointerEvents="none"
                  />

                  {/* Marine Protected Area Badge */}
                  <View style={styles.mpaBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={13}
                      color="#34D399"
                    />
                    <Text style={styles.mpaBadgeText}>
                      Marine Protected Area
                    </Text>
                  </View>

                  {/* Close Button (X) to collapse the drawer */}
                  <TouchableOpacity
                    style={styles.closeDrawerBtn}
                    onPress={handleCloseDrawer}
                    activeOpacity={0.85}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Close site details drawer"
                  >
                    <Ionicons name="close" size={18} color={colors.white} />
                  </TouchableOpacity>
                </View>

                {/* Title & Bookmark / Favorite Bar */}
                <View style={styles.titleBarRow}>
                  <View style={styles.titleCol}>
                    <Text style={styles.drawerSiteTitle}>
                      {selectedSite.name}
                    </Text>
                    <View style={styles.drawerLocationRow}>
                      <Ionicons
                        name="location-sharp"
                        size={13}
                        color={colors.primaryBlue}
                      />
                      <Text style={styles.drawerLocationText}>
                        {selectedEnrichment.barangay}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.titleActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.bookmarkBtn,
                        favoriteIds.has(selectedSite.id) &&
                          styles.heartBtnActive,
                      ]}
                      onPress={() => handleToggleFavorite(selectedSite.id)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        favoriteIds.has(selectedSite.id)
                          ? `Remove ${selectedSite.name} from favorites`
                          : `Add ${selectedSite.name} to favorites`
                      }
                    >
                      <Ionicons
                        name={
                          favoriteIds.has(selectedSite.id)
                            ? "heart"
                            : "heart-outline"
                        }
                        size={18}
                        color={
                          favoriteIds.has(selectedSite.id)
                            ? colors.heartRed
                            : "#475569"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Specs Row (Depth, Feature Tag, Difficulty) */}
                <View style={styles.quickSpecsRow}>
                  <View style={styles.specPill}>
                    <Ionicons
                      name="water-outline"
                      size={14}
                      color={colors.primaryBlue}
                    />
                    <View>
                      <Text style={styles.specLabel}>DEPTH RANGE</Text>
                      <Text style={styles.specValue}>
                        {selectedEnrichment.depthRange}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.specPill, styles.specPillWide]}>
                    <Ionicons
                      name="compass-outline"
                      size={14}
                      color="#0D9488"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.specLabel}>FEATURE TAG</Text>
                      <Text style={styles.specValue} numberOfLines={1}>
                        {selectedEnrichment.featureTag}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.specDiffBadge,
                      {
                        backgroundColor:
                          getDifficultyColor(selectedEnrichment.difficulty) +
                          "18",
                        borderColor:
                          getDifficultyColor(selectedEnrichment.difficulty) +
                          "55",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.specDiffText,
                        {
                          color: getDifficultyColor(
                            selectedEnrichment.difficulty,
                          ),
                        },
                      ]}
                    >
                      {selectedEnrichment.difficulty}
                    </Text>
                  </View>
                </View>

                {/* Site Description */}
                <View style={styles.drawerSection}>
                  <Text style={styles.drawerSectionTitle}>Site Overview</Text>
                  <Text style={styles.drawerDescription}>
                    {selectedEnrichment.description}
                  </Text>
                </View>

                {/* Marine Life Found in That Dive Site */}
                <View style={styles.drawerSection}>
                  <View style={styles.sectionTitleWithIcon}>
                    <Ionicons
                      name="fish-outline"
                      size={16}
                      color={colors.primaryBlue}
                    />
                    <Text style={styles.drawerSectionTitle}>
                      Marine Life Found Here
                    </Text>
                  </View>

                  <View style={styles.marineLifeGrid}>
                    {selectedEnrichment.marineLife.map((species) => (
                      <View key={species.name} style={styles.speciesChip}>
                        <View style={styles.speciesIconCircle}>
                          <Ionicons
                            name={species.icon}
                            size={14}
                            color={colors.primaryBlue}
                          />
                        </View>
                        <View style={styles.speciesTextCol}>
                          <Text style={styles.speciesName} numberOfLines={1}>
                            {species.name}
                          </Text>
                          <Text style={styles.speciesTag}>{species.tag}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Eco-Alert Banner (Conservation Rules / Actionable Guidance) */}
                <View style={styles.ecoAlertBanner}>
                  <View style={styles.ecoAlertHeader}>
                    <View style={styles.ecoAlertIconWrap}>
                      <Ionicons name="leaf" size={15} color="#047857" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ecoAlertTitle}>
                        Eco-Alert • Conservation Rules
                      </Text>
                      <Text style={styles.ecoAlertSub}>
                        Actionable guidance for diving {selectedSite.name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ecoRulesList}>
                    {selectedEnrichment.ecoRules.map((rule, i) => (
                      <View key={i} style={styles.ecoRuleRow}>
                        <View style={styles.ecoRuleDot} />
                        <Text style={styles.ecoRuleText}>{rule}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Contextual Did You Know Card */}
                <DidYouKnowCard siteName={selectedSite.name} />
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapViewport: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  canvasWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#E8ECE9",
  },
  topOverlay: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    zIndex: 10,
  },
  topHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  compassBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
  },
  topSubtitle: {
    fontSize: 10.5,
    color: colors.gray,
    marginTop: 1,
  },
  allSitesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
  },
  allSitesBtnText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  bottomLegendWrap: {
    position: "absolute",
    left: 14,
    right: 68,
    zIndex: 10,
  },
  legendBarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  legendBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  legendBarTitle: {
    fontSize: 9.5,
    fontWeight: "700",
    color: colors.darkText,
    letterSpacing: 0.5,
  },
  legendBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  legendItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendPinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendMpaBox: {
    width: 12,
    height: 8,
    borderRadius: 2,
    backgroundColor: "rgba(16, 185, 129, 0.3)",
    borderWidth: 1,
    borderColor: "#059669",
    borderStyle: "dashed",
  },
  legendTerritorialLine: {
    width: 14,
    height: 0,
    borderBottomWidth: 2,
    borderColor: "#0284C7",
    borderStyle: "dashed",
  },
  legendItemText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569",
  },
  mapControlsCol: {
    position: "absolute",
    right: 14,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  mapControlsColFocused: {
    display: "none",
  },
  mapCtrlBtn: {
    width: 40,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCtrlDivider: {
    width: 24,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  drawerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "58%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 16,
    zIndex: 50,
  },
  drawerGrabberRow: {
    width: "100%",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
  },
  drawerGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCard: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mpaBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(2, 44, 34, 0.78)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  mpaBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#A7F3D0",
  },
  closeDrawerBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleCol: {
    flex: 1,
  },
  drawerSiteTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.darkText,
  },
  drawerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  drawerLocationText: {
    fontSize: 11,
    color: colors.gray,
  },
  titleActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBtnActive: {
    backgroundColor: "#FEE2E2",
  },
  quickSpecsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  specPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  specPillWide: {
    flex: 1,
  },
  specLabel: {
    fontSize: 8.5,
    fontWeight: "700",
    color: colors.gray,
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.darkText,
  },
  specDiffBadge: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  specDiffText: {
    fontSize: 11,
    fontWeight: "700",
  },
  drawerSection: {
    marginBottom: 4,
  },
  drawerSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 4,
  },
  drawerDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: "#475569",
  },
  sectionTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  marineLifeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  speciesChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  speciesIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  speciesTextCol: {},
  speciesName: {
    fontSize: 10.5,
    fontWeight: "700",
    color: colors.darkText,
  },
  speciesTag: {
    fontSize: 9,
    color: colors.gray,
  },
  ecoAlertBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  ecoAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  ecoAlertIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  ecoAlertTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#166534",
  },
  ecoAlertSub: {
    fontSize: 9.5,
    color: "#15803D",
  },
  ecoRulesList: {
    gap: 5,
  },
  ecoRuleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  ecoRuleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#16A34A",
    marginTop: 5,
  },
  ecoRuleText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 14,
    color: "#14532D",
  },
});
