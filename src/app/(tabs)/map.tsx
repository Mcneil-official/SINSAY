import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { DidYouKnowCard, ErrorState, resolveSiteImage } from "../../components";
import { BOTTOM_NAV_HEIGHT } from "../../components/BottomNav";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import { DiveSiteRow } from "../../types/supabase";

interface PinPosition {
  x: number;
  y: number;
}

interface MarineSpecies {
  name: string;
  tag: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface SiteEnrichment {
  coords: PinPosition;
  barangay: string;
  depthRange: string;
  featureTag: string;
  difficulty: string;
  isMpa: boolean;
  description: string;
  marineLife: MarineSpecies[];
  ecoRules: string[];
}

const DEFAULT_CATHEDRAL_ROCK: DiveSiteRow = {
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
  lat: 13.7225,
  lng: 120.8758,
  created_at: "2026-01-01T00:00:00.000Z",
};

// Pin coordinates calibrated in the upper/middle map region (y: 132–322)
// so the bottom Map Legend never overlaps any pins.
const SITE_ENRICHMENTS: Record<string, SiteEnrichment> = {
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

const DIFFICULTY_FILTERS = [
  { key: "All", label: "All Sites" },
  { key: "Beginner", label: "Beginner" },
  { key: "Intermediate", label: "Intermediate" },
  { key: "Advanced", label: "Advanced" },
];

function getDifficultyColor(diff?: string | null): string {
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

function matchesDifficultyFilter(
  siteDiff: string | null | undefined,
  filter: string,
): boolean {
  if (filter === "All") return true;
  if (filter === "Beginner") {
    return !siteDiff || siteDiff === "Beginner" || siteDiff === "Open Water";
  }
  if (filter === "Intermediate") {
    return siteDiff === "Intermediate" || siteDiff === "Rescue";
  }
  if (filter === "Advanced") {
    return (
      siteDiff === "Advanced" ||
      siteDiff === "Divemaster" ||
      siteDiff === "Instructor"
    );
  }
  return true;
}

function getEnrichment(site: DiveSiteRow, index: number): SiteEnrichment {
  const known = SITE_ENRICHMENTS[site.name];
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

export default function MapScreen() {
  const router = useRouter();
  const { site: requestedSite } = useLocalSearchParams<{ site?: string }>();
  const { user } = useAuth();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [sites, setSites] = useState<DiveSiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<PinPosition>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [heroImgError, setHeroImgError] = useState(false);

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originPanX: 0,
    originPanY: 0,
  });

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
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          setError(true);
        } else {
          const rawRows = (data ?? []).filter(
            (r) => !r.status || r.status !== "Restricted",
          );
          const hasCathedral = rawRows.some(
            (r) => r.name.toLowerCase() === "cathedral rock",
          );
          const merged = hasCathedral
            ? rawRows
            : [DEFAULT_CATHEDRAL_ROCK, ...rawRows];
          setSites(merged);
          setError(false);
        }
        setLoading(false);
      },
      () => {
        if (!active) return;
        setError(true);
        setLoading(false);
      });
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

  const filteredSites = useMemo(
    () =>
      sites.filter((s) =>
        matchesDifficultyFilter(s.difficulty, selectedDifficulty),
      ),
    [sites, selectedDifficulty],
  );

  const selectedSiteIndex = useMemo(
    () => filteredSites.findIndex((s) => s.id === selectedSiteId),
    [filteredSites, selectedSiteId],
  );

  const selectedSite =
    selectedSiteIndex >= 0 ? filteredSites[selectedSiteIndex] : null;

  const selectedEnrichment = useMemo(() => {
    if (!selectedSite) return null;
    return getEnrichment(selectedSite, Math.max(selectedSiteIndex, 0));
  }, [selectedSite, selectedSiteIndex]);

  const handleSelectPin = useCallback((siteId: string) => {
    if (dragRef.current.moved) return;
    setHeroImgError(false);
    setSelectedSiteId(siteId);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1.85);
  }, []);

  useEffect(() => {
    if (!requestedSite || sites.length === 0 || selectedSiteId) return;
    const requested = sites.find(
      (site) => site.name.toLowerCase() === requestedSite.toLowerCase(),
    );
    if (requested) handleSelectPin(requested.id);
  }, [requestedSite, sites, selectedSiteId, handleSelectPin]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedSiteId(null);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomScale((z) => Math.min(z + 0.35, 2.6));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((z) => Math.max(z - 0.35, 0.85));
  }, []);

  const handleResetMap = useCallback(() => {
    setSelectedSiteId(null);
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1);
  }, []);

  const effectiveZoom = selectedEnrichment
    ? Math.max(zoomScale, 1.75)
    : zoomScale;

  const startDrag = useCallback(
    (clientX: number, clientY: number) => {
      dragRef.current = {
        active: true,
        moved: false,
        startX: clientX,
        startY: clientY,
        originPanX: panOffset.x,
        originPanY: panOffset.y,
      };
    },
    [panOffset.x, panOffset.y],
  );

  const moveDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragRef.current.active) return;
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      if (!dragRef.current.moved && Math.hypot(dx, dy) > 5) {
        dragRef.current.moved = true;
        setIsDragging(true);
      }
      if (dragRef.current.moved) {
        const vw = 400 / effectiveZoom;
        const vh = 560 / effectiveZoom;
        const scaleX = vw / Math.max(screenWidth, 320);
        const scaleY = vh / Math.max(screenHeight, 480);
        const nextX = Math.min(
          Math.max(dragRef.current.originPanX - dx * scaleX, -150),
          150,
        );
        const nextY = Math.min(
          Math.max(dragRef.current.originPanY - dy * scaleY, -160),
          160,
        );
        setPanOffset({ x: nextX, y: nextY });
      }
    },
    [effectiveZoom, screenHeight, screenWidth],
  );

  const endDrag = useCallback(() => {
    if (!dragRef.current.active) return;
    const wasMoved = dragRef.current.moved;
    dragRef.current.active = false;
    setIsDragging(false);
    if (!wasMoved && selectedSiteId) {
      handleCloseDrawer();
    }
    setTimeout(() => {
      dragRef.current.moved = false;
    }, 40);
  }, [handleCloseDrawer, selectedSiteId]);

  // Compute dynamic SVG viewBox so Map Focus State zooms into the active pin
  // and applies interactive panOffset in all directions
  const viewBox = useMemo(() => {
    const baseW = 400;
    const baseH = 560;
    const vw = baseW / effectiveZoom;
    const vh = baseH / effectiveZoom;

    if (selectedEnrichment) {
      const targetX = selectedEnrichment.coords.x + panOffset.x;
      // Place the pin in the clear middle window between the top bar and the 58% drawer
      const targetY = selectedEnrichment.coords.y + vh * 0.11 + panOffset.y;
      const minX = Math.min(Math.max(targetX - vw / 2, -140), baseW - vw + 140);
      const minY = Math.min(Math.max(targetY - vh / 2, -160), baseH - vh + 160);
      return `${minX.toFixed(1)} ${minY.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
    }

    const minX = (baseW - vw) / 2 + panOffset.x;
    const minY = (baseH - vh) / 2 + panOffset.y;
    return `${minX.toFixed(1)} ${minY.toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
  }, [effectiveZoom, panOffset.x, panOffset.y, selectedEnrichment]);

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {/* 1. MODERN FULL-SCREEN MARINE GIS VECTOR CANVAS (PAN & ZOOM ENABLED) */}
          <View
            style={[
              styles.canvasWrap,
              isDragging ? styles.canvasDragging : styles.canvasGrab,
            ]}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => {
              const { pageX, pageY } = e.nativeEvent;
              startDrag(pageX, pageY);
            }}
            onResponderMove={(e) => {
              const { pageX, pageY } = e.nativeEvent;
              moveDrag(pageX, pageY);
            }}
            onResponderRelease={endDrag}
            onResponderTerminate={endDrag}
            {...({
              onPointerDown: (e: any) => {
                if (e?.clientX !== undefined && e?.clientY !== undefined) {
                  startDrag(e.clientX, e.clientY);
                }
              },
              onPointerMove: (e: any) => {
                if (e?.clientX !== undefined && e?.clientY !== undefined) {
                  moveDrag(e.clientX, e.clientY);
                }
              },
              onPointerUp: endDrag,
              onPointerLeave: endDrag,
              onWheel: (e: any) => {
                if (typeof e?.deltaY === "number") {
                  if (e.deltaY < 0) {
                    setZoomScale((z) => Math.min(z + 0.18, 2.6));
                  } else if (e.deltaY > 0) {
                    setZoomScale((z) => Math.max(z - 0.18, 0.85));
                  }
                }
              },
            } as any)}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox={viewBox}
              preserveAspectRatio="xMidYMid slice"
            >
              <Defs>
                {/* Modern Deep-to-Coastal Bathymetry Gradient */}
                <LinearGradient id="oceanGrad" x1="0" y1="0" x2="0.2" y2="1">
                  <Stop offset="0" stopColor="#E3F2FD" />
                  <Stop offset="0.45" stopColor="#C2E2FC" />
                  <Stop offset="0.8" stopColor="#9ED1FA" />
                  <Stop offset="1" stopColor="#82C2F6" />
                </LinearGradient>

                {/* Deep Pelagic Trench Gradient */}
                <LinearGradient id="trenchGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#7CC0F7" stopOpacity="0.45" />
                  <Stop offset="1" stopColor="#4EA4EE" stopOpacity="0.55" />
                </LinearGradient>

                {/* Lush Modern Peninsula Landmass Gradient */}
                <LinearGradient id="landGrad" x1="0.1" y1="0" x2="0.9" y2="1">
                  <Stop offset="0" stopColor="#ECF6EE" />
                  <Stop offset="0.55" stopColor="#D7EDE0" />
                  <Stop offset="1" stopColor="#BFE2CD" />
                </LinearGradient>

                {/* Highland Ridge Gradient */}
                <LinearGradient id="ridgeGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#B4DEC5" stopOpacity="0.7" />
                  <Stop offset="1" stopColor="#94CCA9" stopOpacity="0.85" />
                </LinearGradient>
              </Defs>

              {/* Expanded Ocean Base so panning in any direction never reveals edges */}
              <Rect
                x="-300"
                y="-300"
                width="1000"
                height="1200"
                fill="url(#oceanGrad)"
              />

              {/* Layered Bathymetric Depth Contours */}
              <Path
                d="M-300 75 Q110 135 148 215 Q186 292 700 328 L700 900 L-300 900 Z"
                fill="url(#trenchGrad)"
              />
              <Path
                d="M-300 195 Q88 238 140 278 Q215 340 700 368 L700 900 L-300 900 Z"
                fill="#5AB0F2"
                opacity={0.28}
              />
              <Path
                d="M-300 365 Q150 340 265 375 Q340 398 700 385 L700 900 L-300 900 Z"
                fill="#3B9AE8"
                opacity={0.22}
              />

              {/* Subtle Modern GIS Graticule Grid */}
              {[-40, 40, 120, 200, 280, 360, 440, 520].map((y) => (
                <Line
                  key={`lat-${y}`}
                  x1="-250"
                  y1={y}
                  x2="650"
                  y2={y}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  opacity={0.45}
                  strokeDasharray="3,5"
                />
              ))}
              {[-80, 0, 80, 160, 240, 320, 400, 480].map((x) => (
                <Line
                  key={`lng-${x}`}
                  x1={x}
                  y1="-250"
                  x2={x}
                  y2="800"
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  opacity={0.45}
                  strokeDasharray="3,5"
                />
              ))}

              {/* Turquoise Shallow Coral Reef Shelves Hugging Shorelines */}
              {/* Calumpan Peninsula Reef Shelf */}
              <Path
                d="M204 -200 L520 -200 L520 238 Q358 258 334 282 Q302 310 270 298 Q232 284 212 248 Q190 218 184 182 Q180 142 196 102 Q206 52 204 -200 Z"
                fill="#67E8F9"
                opacity={0.38}
              />
              {/* Sombrero Island Reef Halo */}
              <Circle cx={86} cy={246} r={24} fill="#67E8F9" opacity={0.42} />
              {/* Caban Island Reef Halo */}
              <Path
                d="M142 268 Q166 258 178 274 Q174 290 152 288 Q134 282 142 268 Z"
                fill="#67E8F9"
                opacity={0.42}
              />
              {/* Maricaban (Tingloy) Island Reef Shelf */}
              <Path
                d="M96 300 Q148 278 210 304 Q256 328 242 358 Q204 380 142 362 Q90 342 96 300 Z"
                fill="#67E8F9"
                opacity={0.38}
              />

              {/* Mabini Municipal Ocean Territorial Water Boundary (RA 8550 / NAMRIA) */}
              {/* Subtle Territorial Sea Fill for Mabini Municipal Waters */}
              <Path
                d="M35 -200 L35 60 Q30 140 45 190 Q70 215 120 230 Q165 252 215 272 Q260 286 315 296 Q370 298 430 278 Q490 252 550 215 L550 -200 Z"
                fill="#0284C7"
                opacity={0.038}
              />

              {/* Outer Nautical Boundary Buffer Glow */}
              <Path
                d="M35 -200 L35 60 Q30 140 45 190 Q70 215 120 230 Q165 252 215 272 Q260 286 315 296 Q370 298 430 278 Q490 252 550 215"
                fill="none"
                stroke="rgba(2, 132, 199, 0.22)"
                strokeWidth={5}
                strokeLinecap="round"
              />

              {/* Official Ocean Territorial Boundary Line */}
              <Path
                d="M35 -200 L35 60 Q30 140 45 190 Q70 215 120 230 Q165 252 215 272 Q260 286 315 296 Q370 298 430 278 Q490 252 550 215"
                fill="none"
                stroke="#0284C7"
                strokeWidth={1.8}
                strokeDasharray="9,4,2,4"
              />

              {/* Boundary Demarcation Waypoint Cross Ticks */}
              <Line x1={30} y1={60} x2={40} y2={60} stroke="#0284C7" strokeWidth={1.2} />
              <Line x1={40} y1={190} x2={50} y2={190} stroke="#0284C7" strokeWidth={1.2} />
              <Line x1={210} y1={270} x2={220} y2={274} stroke="#0284C7" strokeWidth={1.2} />
              <Line x1={310} y1={294} x2={320} y2={298} stroke="#0284C7" strokeWidth={1.2} />
              <Line x1={425} y1={282} x2={435} y2={274} stroke="#0284C7" strokeWidth={1.2} />

              {/* Marine Protected Area (MPA) Sanctuary Zone Boundaries */}
              <Path
                d="M170 124 Q154 186 196 252 Q238 288 292 282 Q264 232 220 176 Z"
                fill="rgba(16, 185, 129, 0.14)"
                stroke="#059669"
                strokeWidth={1.1}
                strokeDasharray="4,3"
              />
              <Circle
                cx={86}
                cy={246}
                r={20}
                fill="rgba(16, 185, 129, 0.12)"
                stroke="#059669"
                strokeWidth={1}
                strokeDasharray="3,3"
              />

              {/* Landmass Coastal Drop Shadows */}
              <Path
                d="M214 -200 L520 -200 L520 226 Q354 244 330 268 Q302 294 274 284 Q242 270 224 236 Q202 206 196 176 Q192 138 206 100 Q216 52 214 -200 Z"
                fill="#0F172A"
                opacity={0.07}
              />

              {/* Calumpan Peninsula (Mabini / Anilao) Landmass */}
              <Path
                d="M214 -200 L520 -200 L520 222 Q354 240 330 264 Q302 290 274 280 Q242 266 224 232 Q202 202 196 172 Q192 134 206 96 Q216 48 214 -200 Z"
                fill="url(#landGrad)"
                stroke="#6EB88D"
                strokeWidth={1.6}
              />

              {/* Mt. Gulugod Baboy Topographic Elevation Rings */}
              <Path
                d="M244 74 Q256 142 252 206 Q268 242 296 244 Q324 204 318 130 Q306 78 244 74 Z"
                fill="url(#ridgeGrad)"
              />
              <Path
                d="M262 108 Q270 154 268 196 Q282 218 298 216 Q312 184 304 134 Z"
                fill="#8BC4A2"
                opacity={0.55}
              />

              {/* Coastal Road Network on Mabini Peninsula */}
              <Path
                d="M210 132 Q202 174 228 228 Q250 262 278 272 Q308 274 338 242"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={1.5}
                opacity={0.75}
                strokeDasharray="3,2"
              />

              {/* Sombrero Island */}
              <Circle
                cx={86}
                cy={246}
                r={12}
                fill="url(#landGrad)"
                stroke="#6EB88D"
                strokeWidth={1.5}
              />

              {/* Caban Island */}
              <Path
                d="M146 271 Q164 264 172 275 Q168 286 152 284 Q140 279 146 271 Z"
                fill="url(#landGrad)"
                stroke="#6EB88D"
                strokeWidth={1.4}
              />

              {/* Maricaban / Tingloy Island */}
              <Path
                d="M106 306 Q152 286 204 310 Q246 330 234 352 Q198 370 144 354 Q98 338 106 306 Z"
                fill="url(#landGrad)"
                stroke="#6EB88D"
                strokeWidth={1.6}
              />
              {/* Tingloy Interior Ridge */}
              <Path
                d="M132 318 Q168 308 206 326 Q200 344 162 342 Q130 334 132 318 Z"
                fill="url(#ridgeGrad)"
              />

              {/* Modern Cartographic Typography & Place Labels */}
              <SvgText
                x={292}
                y={134}
                fill="#1E4631"
                fontSize={10.5}
                fontWeight="700"
                textAnchor="middle"
                letterSpacing={1.4}
              >
                MABINI PENINSULA
              </SvgText>
              <SvgText
                x={292}
                y={147}
                fill="#3B6E52"
                fontSize={7.8}
                fontWeight="600"
                textAnchor="middle"
                letterSpacing={0.6}
              >
                CALUMPAN SANCTUARY COAST
              </SvgText>
              <SvgText
                x={284}
                y={182}
                fill="#3B6E52"
                fontSize={7.5}
                fontWeight="600"
                textAnchor="middle"
              >
                ▲ Mt. Gulugod Baboy (525m)
              </SvgText>

              {/* Barangay Place Dots */}
              <Circle cx={212} cy={136} r={2.2} fill="#3B6E52" />
              <SvgText x={228} y={138} fill="#3B6E52" fontSize={7} fontWeight="600">
                Anilao
              </SvgText>
              <Circle cx={206} cy={184} r={2.2} fill="#3B6E52" />
              <SvgText x={226} y={186} fill="#3B6E52" fontSize={7} fontWeight="600">
                Bagalangit
              </SvgText>
              <Circle cx={232} cy={234} r={2.2} fill="#3B6E52" />
              <SvgText x={246} y={236} fill="#3B6E52" fontSize={7} fontWeight="600">
                Solo
              </SvgText>

              <SvgText
                x={172}
                y={336}
                fill="#1E4631"
                fontSize={9.5}
                fontWeight="700"
                textAnchor="middle"
                letterSpacing={1}
              >
                MARICABAN (TINGLOY)
              </SvgText>
              <SvgText
                x={86}
                y={228}
                fill="#285948"
                fontSize={7.5}
                fontWeight="600"
                textAnchor="middle"
              >
                Sombrero Is.
              </SvgText>
              <SvgText
                x={158}
                y={261}
                fill="#285948"
                fontSize={7}
                fontWeight="600"
                textAnchor="middle"
              >
                Caban Is.
              </SvgText>

              {/* Water Body Labels */}
              <SvgText
                x={78}
                y={152}
                fill="#2B6CB0"
                fontSize={10.5}
                fontStyle="italic"
                fontWeight="600"
                textAnchor="middle"
                opacity={0.75}
              >
                BALAYAN BAY
              </SvgText>
              <SvgText
                x={248}
                y={312}
                fill="#1E4E8C"
                fontSize={8.5}
                fontStyle="italic"
                fontWeight="600"
                textAnchor="middle"
                opacity={0.75}
              >
                MARICABAN STRAIT
              </SvgText>
              <SvgText
                x={348}
                y={326}
                fill="#2B6CB0"
                fontSize={9}
                fontStyle="italic"
                fontWeight="600"
                textAnchor="middle"
                opacity={0.75}
              >
                BATANGAS BAY
              </SvgText>

              {/* Ocean Territorial Water Boundary Demarcation Labels */}
              <SvgText
                x={24}
                y={95}
                fill="#0284C7"
                fontSize={6.2}
                fontWeight="700"
                letterSpacing={0.8}
                transform="rotate(-90, 24, 95)"
                opacity={0.85}
              >
                MABINI TERRITORIAL WATER LIMIT (15-KM)
              </SvgText>
              <SvgText
                x={175}
                y={252}
                fill="#0284C7"
                fontSize={5.8}
                fontWeight="700"
                letterSpacing={0.7}
                transform="rotate(22, 175, 252)"
                opacity={0.85}
              >
                MARICABAN STRAIT MEDIAN LINE
              </SvgText>
              <SvgText
                x={438}
                y={270}
                fill="#0284C7"
                fontSize={5.8}
                fontWeight="700"
                letterSpacing={0.8}
                transform="rotate(-23, 438, 270)"
                opacity={0.85}
              >
                MABINI MUNICIPAL OCEAN BOUNDARY
              </SvgText>

              {/* Subtle Compass Rose Watermark (Upper Left Ocean) */}
              <G opacity={0.45}>
                <Circle
                  cx={46}
                  cy={108}
                  r={14}
                  fill="none"
                  stroke="#2B6CB0"
                  strokeWidth={0.8}
                />
                <Path
                  d="M46 91 L49 108 L46 105 L43 108 Z"
                  fill="#2B6CB0"
                />
                <SvgText
                  x={46}
                  y={88}
                  fill="#2B6CB0"
                  fontSize={7}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  N
                </SvgText>
              </G>

              {/* Dive Site Pins & Focus Target Ring Marker */}
              {filteredSites.map((site, idx) => {
                const info = getEnrichment(site, idx);
                const pos = info.coords;
                const isSelected = selectedSite?.id === site.id;
                const pinColor = getDifficultyColor(info.difficulty);
                const pillW = Math.max(site.name.length * 4.7 + 16, 62);

                return (
                  <G
                    key={site.id}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleSelectPin(site.id);
                    }}
                  >
                    {isSelected ? (
                      <>
                        {/* Outer Concentric Target Ring */}
                        <Circle
                          cx={pos.x}
                          cy={pos.y}
                          r={24}
                          fill="rgba(38, 121, 232, 0.16)"
                          stroke={colors.primaryBlue}
                          strokeWidth={1.5}
                          strokeDasharray="4,3"
                        />
                        {/* Middle Concentric Target Ring */}
                        <Circle
                          cx={pos.x}
                          cy={pos.y}
                          r={14}
                          fill="rgba(38, 121, 232, 0.28)"
                          stroke="#FFFFFF"
                          strokeWidth={1.5}
                        />
                        {/* Crosshair Ticks */}
                        <Line
                          x1={pos.x - 29}
                          y1={pos.y}
                          x2={pos.x - 20}
                          y2={pos.y}
                          stroke={colors.primaryBlue}
                          strokeWidth={1.4}
                        />
                        <Line
                          x1={pos.x + 20}
                          y1={pos.y}
                          x2={pos.x + 29}
                          y2={pos.y}
                          stroke={colors.primaryBlue}
                          strokeWidth={1.4}
                        />
                        <Line
                          x1={pos.x}
                          y1={pos.y - 29}
                          x2={pos.x}
                          y2={pos.y - 20}
                          stroke={colors.primaryBlue}
                          strokeWidth={1.4}
                        />
                        <Line
                          x1={pos.x}
                          y1={pos.y + 20}
                          x2={pos.x}
                          y2={pos.y + 29}
                          stroke={colors.primaryBlue}
                          strokeWidth={1.4}
                        />
                        {/* Inner Bullseye Pin */}
                        <Circle
                          cx={pos.x}
                          cy={pos.y}
                          r={7.5}
                          fill={colors.primaryBlue}
                          stroke="#FFFFFF"
                          strokeWidth={2.5}
                        />
                        <Circle cx={pos.x} cy={pos.y} r={2.8} fill="#FFFFFF" />

                        {/* Floating Label Tag below Focused Pin so it never overlaps the top bar */}
                        <G>
                          <Rect
                            x={pos.x - Math.max(site.name.length * 3.5 + 14, 54)}
                            y={pos.y + 28}
                            width={Math.max(site.name.length * 7 + 28, 108)}
                            height={22}
                            rx={11}
                            fill="#0B192C"
                            stroke="#60A5FA"
                            strokeWidth={1.2}
                          />
                          <SvgText
                            x={pos.x}
                            y={pos.y + 42.5}
                            fill="#FFFFFF"
                            fontSize={9.5}
                            fontWeight="700"
                            textAnchor="middle"
                          >
                            {site.name}
                          </SvgText>
                        </G>
                      </>
                    ) : (
                      <>
                        {/* Modern Glowing Pin Marker + Pill Callout */}
                        <Circle
                          cx={pos.x}
                          cy={pos.y}
                          r={11}
                          fill={pinColor}
                          opacity={0.24}
                        />
                        <Circle
                          cx={pos.x}
                          cy={pos.y}
                          r={6.2}
                          fill={pinColor}
                          stroke="#FFFFFF"
                          strokeWidth={2.2}
                        />
                        <Circle cx={pos.x} cy={pos.y} r={2} fill="#FFFFFF" />

                        {/* Crisp Rounded White Label Pill */}
                        <Rect
                          x={pos.x - pillW / 2}
                          y={pos.y - 24}
                          width={pillW}
                          height={14}
                          rx={7}
                          fill="rgba(255, 255, 255, 0.92)"
                          stroke="#CBD5E1"
                          strokeWidth={0.8}
                        />
                        <SvgText
                          x={pos.x}
                          y={pos.y - 14.5}
                          fill="#0F172A"
                          fontSize={7.2}
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {site.name}
                        </SvgText>
                      </>
                    )}
                  </G>
                );
              })}
            </Svg>
          </View>

          {/* 2. TOP OVERLAY: TITLE BAR & DIFFICULTY FILTERS */}
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
                    Tap any site pin to explore • {filteredSites.length} sites
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

            {!selectedSite && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterRow}
              >
                {DIFFICULTY_FILTERS.map((f) => {
                  const isActive = selectedDifficulty === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.filterChip,
                        isActive && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedDifficulty(f.key)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      accessibilityLabel={f.label}
                    >
                      {f.key !== "All" && (
                        <View
                          style={[
                            styles.filterDot,
                            {
                              backgroundColor: isActive
                                ? colors.white
                                : getDifficultyColor(f.key),
                            },
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.filterChipText,
                          isActive && styles.filterChipTextActive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* 3. BOTTOM MAP LEGEND (DOCKED BELOW PINS SO NOTHING OVERLAPS) */}
          {!selectedSite && (
            <View style={styles.bottomLegendWrap} pointerEvents="box-none">
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

          {/* 4. MAP ZOOM & RESET CONTROLS */}
          <View
            style={[
              styles.mapControlsCol,
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
              onPress={handleResetMap}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Reset map view"
            >
              <Ionicons
                name="locate-outline"
                size={17}
                color={colors.primaryBlue}
              />
            </TouchableOpacity>
          </View>

          {/* 5. SLIDE-UP DETAIL DRAWER (FOCUSED PIN STATE) */}
          {selectedSite && selectedEnrichment && (
            <View style={styles.drawerSheet}>
              <View style={styles.drawerGrabberRow}>
                <View style={styles.drawerGrabber} />
              </View>

              <ScrollView
                style={styles.drawerScroll}
                contentContainerStyle={styles.drawerScrollContent}
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
                    style={styles.heroGradientOverlay}
                    pointerEvents="none"
                  >
                    <Svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <Defs>
                        <LinearGradient
                          id="mapDrawerHeroGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor="#020817"
                            stopOpacity="0.58"
                          />
                          <Stop
                            offset="0.4"
                            stopColor="#020817"
                            stopOpacity="0.1"
                          />
                          <Stop
                            offset="1"
                            stopColor="#020817"
                            stopOpacity="0.65"
                          />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        fill="url(#mapDrawerHeroGrad)"
                      />
                    </Svg>
                  </View>

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
    backgroundColor: "#E3F2FD",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
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
    userSelect: "none" as any,
  },
  canvasGrab: {
    cursor: "grab" as any,
  },
  canvasDragging: {
    cursor: "grabbing" as any,
  },
  topOverlay: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    zIndex: 20,
    gap: 10,
  },
  topHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(219, 232, 244, 0.9)",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  topHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  compassBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  topSubtitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  allSitesBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  allSitesBtnText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterRow: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterChipActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  filterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#334155",
  },
  filterChipTextActive: {
    color: colors.white,
  },
  bottomLegendWrap: {
    position: "absolute",
    left: 16,
    right: 66,
    bottom: BOTTOM_NAV_HEIGHT + 16,
    zIndex: 20,
  },
  legendBarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    gap: 6,
  },
  legendBarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendBarTitle: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#475569",
    letterSpacing: 0.7,
  },
  legendBarRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  legendItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendPinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendMpaBox: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderWidth: 1,
    borderColor: "#059669",
  },
  legendTerritorialLine: {
    width: 14,
    height: 0,
    borderBottomWidth: 2,
    borderColor: "#0284C7",
    borderStyle: "dashed",
  },
  legendItemText: {
    fontSize: 11,
    fontFamily: "Quicksand_600SemiBold",
    color: "#334155",
  },
  mapControlsCol: {
    position: "absolute",
    right: 16,
    bottom: BOTTOM_NAV_HEIGHT + 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    zIndex: 20,
    overflow: "hidden",
  },
  mapControlsColFocused: {
    bottom: "64%",
  },
  mapCtrlBtn: {
    width: 38,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  mapCtrlDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  drawerSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "62%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
    zIndex: 40,
    overflow: "hidden",
  },
  drawerGrabberRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
  },
  drawerGrabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: BOTTOM_NAV_HEIGHT + 28,
    gap: 14,
  },
  heroCard: {
    height: 168,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0B192C",
    position: "relative",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  heroGradientOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundImage:
      "linear-gradient(180deg, rgba(2, 8, 23, 0.58) 0%, rgba(2, 8, 23, 0.1) 40%, rgba(2, 8, 23, 0.65) 100%)" as any,
  },
  mpaBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(4, 13, 31, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.55)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mpaBadgeText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#ECFDF5",
  },
  closeDrawerBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.68)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBarRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 3,
  },
  drawerSiteTitle: {
    fontSize: 20,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  drawerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  drawerLocationText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  titleActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookmarkBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkBtnActive: {
    backgroundColor: "#EBF3FF",
    borderColor: colors.primaryBlue,
  },
  heartBtnActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  quickSpecsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  specPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  specPillWide: {
    flex: 1,
    minWidth: 130,
  },
  specLabel: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  specValue: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  specDiffBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  specDiffText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
  },
  drawerSection: {
    gap: 6,
  },
  sectionTitleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  drawerSectionTitle: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  drawerDescription: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    lineHeight: 19.5,
  },
  marineLifeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  speciesChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: "47%",
    flex: 1,
  },
  speciesIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  speciesTextCol: {
    flex: 1,
  },
  speciesName: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  speciesTag: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  ecoAlertBanner: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginTop: 2,
  },
  ecoAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ecoAlertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  ecoAlertTitle: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#065F46",
  },
  ecoAlertSub: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#047857",
  },
  ecoRulesList: {
    gap: 6,
  },
  ecoRuleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  ecoRuleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#059669",
    marginTop: 6,
  },
  ecoRuleText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#065F46",
    lineHeight: 17.5,
  },
});
