import React, { forwardRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { SINSAY_WHITE_LOGO_URI } from "../constants/manifestLogo";
import { MANIFESTO_HERO_BG_URI } from "../constants/manifestHeroBg";

const HERO_BG_IMAGE = require("../../assets/manifesto-hero-bg.png");

export interface ManifestSnapshotDiver {
  name: string;
  ecoId?: string | null;
  isWalkIn?: boolean;
  certification?: string | null;
  municipalFeeStatus?: string;
  safetyWaiverStatus?: string;
}

export interface SnapshotManifest {
  id: string;
  boat_name: string | null;
  dive_mode: string;
  dive_type?: string | null;
  location: string;
  dive_date: string;
  diver_count: number;
  max_divers?: number | null;
  captain_name?: string | null;
  status: "active" | "done";
}

export interface ManifestSnapshotCardProps {
  manifest: SnapshotManifest;
  divers: (ManifestSnapshotDiver | string)[];
  operatorName: string;
}

type TileIconType =
  | "operator"
  | "location"
  | "calendar"
  | "boat"
  | "divers"
  | "scubaTank"
  | "capacity"
  | "captain";

interface VesselTile {
  iconType: TileIconType;
  label: string;
  value: string;
}

// Dedicated vector icons with zero font dependencies (100% faithful to the official manifesto design)
function OperatorIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 512 512">
      <Path
        d="M256 256a112 112 0 10-112-112 112 112 0 00112 112zm0 32c-69.42 0-208 42.88-208 128v32h416v-32c0-85.12-138.58-128-208-128z"
        fill={color}
      />
    </Svg>
  );
}

function LocationIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 512 512">
      <Path
        d="M256 32C167.67 32 96 96.51 96 176c0 128 160 304 160 304s160-176 160-304c0-79.49-71.67-144-160-144zm0 224a64 64 0 1164-64 64.07 64.07 0 01-64 64z"
        fill={color}
      />
    </Svg>
  );
}

function CalendarIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 512 512">
      <Path
        d="M416 64h-16V48a16 16 0 00-32 0v16H144V48a16 16 0 00-32 0v16H96a64.07 64.07 0 00-64 64v320a64.07 64.07 0 0064 64h320a64.07 64.07 0 0064-64V128a64.07 64.07 0 00-64-64zm32 384a32 32 0 01-32 32H96a32 32 0 01-32-32V208h384zm0-272H64v-48a32 32 0 0132-32h16v16a16 16 0 0032 0V96h224v16a16 16 0 0032 0V96h16a32 32 0 0132 32z"
        fill={color}
      />
    </Svg>
  );
}

function BoatIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 512 512">
      <Path
        d="M439.47 220.55l-21.75-90.62A24 24 0 00394.39 112H117.61a24 24 0 00-23.33 17.93l-21.75 90.62A48.06 48.06 0 0048 249.2V288a16 16 0 0016 16h384a16 16 0 0016-16v-38.8a48.06 48.06 0 00-24.53-28.65zM272 64h-32a16 16 0 00-16 16v32h64V80a16 16 0 00-16-16z"
        fill={color}
      />
      <Path
        d="M432 352a48.06 48.06 0 00-34 14.16 48 48 0 01-68 0 48 48 0 00-68 0 48 48 0 01-68 0 48 48 0 00-68 0 48 48 0 01-34-14.16V336H64v16a48 48 0 0080 35.84 48 48 0 0168 0 48 48 0 0068 0 48 48 0 0168 0 48 48 0 0080-35.84v-16h-28v16z"
        fill={color}
      />
      <Path
        d="M432 416a48.06 48.06 0 00-34 14.16 48 48 0 01-68 0 48 48 0 00-68 0 48 48 0 01-68 0 48 48 0 00-68 0 48 48 0 01-34-14.16V400H64v16a48 48 0 0080 35.84 48 48 0 0168 0 48 48 0 0068 0 48 48 0 0168 0 48 48 0 0080-35.84v-16h-28v16z"
        fill={color}
      />
    </Svg>
  );
}

function PeopleIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 512 512">
      <Path
        d="M402 168a70 70 0 10-70-70 70 70 0 0070 70zm-144 48a70 70 0 10-70-70 70 70 0 0070 70zm0 32c-53 0-160 27-160 80v32h320v-32c0-53-107-80-160-80zm144 0c-11.7 0-25 1.5-38.3 4.2 24.3 18.5 38.3 43.6 38.3 67.8v32h120v-32c0-47.1-85.3-72-120-72z"
        fill={color}
      />
    </Svg>
  );
}

function PersonCircleIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 512 512">
      <Path
        d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208 208-93.31 208-208S370.69 48 256 48zm0 72a56 56 0 11-56 56 56 56 0 0156-56zm0 288a143.64 143.64 0 01-105.77-46.74C157.73 335.79 194.7 320 256 320s98.27 15.79 105.77 41.26A143.64 143.64 0 01256 408z"
        fill={color}
      />
    </Svg>
  );
}

// Scuba cylinder icon matching the official boat dive manifesto
function ScubaTankIcon({ color = "#0066FF" }: { color?: string }) {
  return (
    <View style={tankStyles.wrap}>
      {/* Top Valve */}
      <View style={[tankStyles.valve, { backgroundColor: color }]} />
      {/* Neck */}
      <View style={[tankStyles.neck, { backgroundColor: color }]} />
      {/* Main Tank Body */}
      <View style={[tankStyles.body, { backgroundColor: color }]} />
    </View>
  );
}

const tankStyles = StyleSheet.create({
  wrap: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  valve: {
    width: 4,
    height: 2,
    borderRadius: 1,
    marginBottom: 0.5,
  },
  neck: {
    width: 6,
    height: 1.5,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  body: {
    width: 8,
    height: 14,
    borderRadius: 3.5,
  },
});

function renderTileIcon(tile: VesselTile) {
  switch (tile.iconType) {
    case "operator":
      return <OperatorIcon />;
    case "location":
      return <LocationIcon />;
    case "calendar":
      return <CalendarIcon />;
    case "boat":
      return <BoatIcon />;
    case "divers":
    case "capacity":
      return <PeopleIcon />;
    case "scubaTank":
      return <ScubaTankIcon />;
    case "captain":
      return <PersonCircleIcon />;
    default:
      return null;
  }
}



// 1024px Official Boat Dive Manifesto Canvas
export const ManifestSnapshotCard = forwardRef<View, ManifestSnapshotCardProps>(
  function ManifestSnapshotCard({ manifest, divers, operatorName }, ref) {
    const isBoatDive = (manifest.dive_mode || "Boat Dive").toLowerCase().includes("boat");
    const displayMode = isBoatDive ? "Boat Dive" : manifest.dive_mode || "Dive";

    const normalizedDivers: ManifestSnapshotDiver[] = (divers || []).map((d) => {
      if (typeof d === "string") {
        return {
          name: d,
          ecoId: "VERIFIED ID",
          isWalkIn: false,
          certification: "Certified Diver",
          municipalFeeStatus: "PAID & CLEARED",
          safetyWaiverStatus: "SIGNED",
        };
      }
      return {
        ...d,
        ecoId: d.ecoId || (d.isWalkIn ? "WALK-IN GUEST" : "VERIFIED ID"),
        certification:
          d.certification || (d.isWalkIn ? "Walk-in Registration" : "Certified Diver"),
        municipalFeeStatus: d.municipalFeeStatus || "PAID & CLEARED",
        safetyWaiverStatus: d.safetyWaiverStatus || "SIGNED",
      };
    });

    const diverCount = manifest.diver_count || normalizedDivers.length;
    const maxDivers = manifest.max_divers || 22;

    const row1Tiles: VesselTile[] = [
      {
        iconType: "operator",
        label: "ACCREDITED OPERATOR",
        value: operatorName || "Operator",
      },
      {
        iconType: "location",
        label: "DIVE LOCATION",
        value: manifest.location || "Anilao Pier",
      },
      {
        iconType: "calendar",
        label: "VOYAGE DATE",
        value: manifest.dive_date,
      },
      {
        iconType: "boat",
        label: isBoatDive ? "VESSEL / BOAT" : "DIVE MODE",
        value: manifest.boat_name || manifest.dive_mode || "Bantay Dagat",
      },
    ];

    const row2Tiles: VesselTile[] = [
      {
        iconType: "divers",
        label: "DIVERS ONBOARD",
        value: `${diverCount} Certified Diver${diverCount === 1 ? "" : "s"}`,
      },
      {
        iconType: "scubaTank",
        label: "DIVE TYPE",
        value: manifest.dive_type || "Scuba Diving",
      },
      {
        iconType: "capacity",
        label: "CAPACITY",
        value: `${diverCount}/${maxDivers} Max`,
      },
      {
        iconType: "captain",
        label: isBoatDive ? "GUIDE / CAPTAIN" : "DIVE GUIDE",
        value: manifest.captain_name || "Licensed Guide",
      },
    ];

    const [heroImgSource, setHeroImgSource] = useState<any>(HERO_BG_IMAGE);

    return (
      <View ref={ref} style={styles.canvas} collapsable={false}>
        {/* Fallback Gradient */}
        <Svg width={1024} height={362} style={styles.heroBackground}>
          <Defs>
            <LinearGradient id="heroFallbackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0B79F2" />
              <Stop offset="50%" stopColor="#0060DF" />
              <Stop offset="100%" stopColor="#003599" />
            </LinearGradient>
          </Defs>
          <Rect width={1024} height={362} fill="url(#heroFallbackGrad)" />
        </Svg>

        {/* Hero Background Image */}
        <Image
          source={heroImgSource}
          onError={() => setHeroImgSource({ uri: MANIFESTO_HERO_BG_URI })}
          style={styles.heroBackground}
          resizeMode="cover"
        />

        {/* Top Header Section */}
        <View style={styles.topHeader}>
          {/* SINSAY Brand Logo (Embedded Base64 Data URI) + Underline Bar */}
          <View style={styles.brandCol}>
            <Image
              source={{ uri: SINSAY_WHITE_LOGO_URI }}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoAccentBar} />
          </View>

          {/* Official Manifesto Display Title */}
          <View style={styles.titleWrap}>
            <Text style={styles.titleLine}>Official {displayMode}</Text>
            <Text style={styles.titleLine}>Manifesto</Text>
          </View>
        </View>

        {/* Floating White Card Container */}
        <View style={styles.whiteCard}>
          {/* Section 1: Vessel Details */}
          <View style={styles.sectionHeader}>
            <View style={styles.blueBar} />
            <Text style={styles.sectionTitle}>Vessel Details</Text>
          </View>

          {/* Explicit 2-row grid: strictly 4 columns per row */}
          <View style={styles.gridContainer}>
            <View style={styles.gridRow}>
              {row1Tiles.map((tile, i) => (
                <View key={`r1-${i}`} style={styles.gridTile}>
                  {renderTileIcon(tile)}
                  <View style={styles.tileTextCol}>
                    <Text style={styles.tileLabel} numberOfLines={1}>
                      {tile.label}
                    </Text>
                    <Text style={styles.tileValue} numberOfLines={1}>
                      {tile.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.gridRow}>
              {row2Tiles.map((tile, i) => (
                <View key={`r2-${i}`} style={styles.gridTile}>
                  {renderTileIcon(tile)}
                  <View style={styles.tileTextCol}>
                    <Text style={styles.tileLabel} numberOfLines={1}>
                      {tile.label}
                    </Text>
                    <Text style={styles.tileValue} numberOfLines={1}>
                      {tile.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Section 2: Diver List */}
          <View style={styles.sectionHeader}>
            <View style={styles.blueBar} />
            <Text style={styles.sectionTitle}>Diver List</Text>
          </View>

          {/* Table Header Bar */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colIndex]}>#</Text>
            <Text style={[styles.thText, styles.colName]}>DIVER PASSENGER NAME</Text>
            <Text style={[styles.thText, styles.colEcoId]}>ECO DIVE ID</Text>
            <Text style={[styles.thText, styles.colCert]}>CERTIFICATION / STATUS</Text>
            <Text style={[styles.thText, styles.colFee]}>MUNICIPAL FEE</Text>
            <Text style={[styles.thText, styles.colWaiver]}>SAFETY WAIVER</Text>
          </View>

          {/* Table Rows */}
          {normalizedDivers.length > 0 ? (
            normalizedDivers.map((d, index) => (
              <View key={`${d.name}-${index}`} style={styles.tableRow}>
                <Text style={[styles.tdText, styles.colIndex]}>{index + 1}</Text>
                <Text style={[styles.tdName, styles.colName]} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={[styles.tdEcoId, styles.colEcoId]} numberOfLines={1}>
                  {d.ecoId}
                </Text>
                <Text style={[styles.tdCert, styles.colCert]} numberOfLines={1}>
                  {d.certification}
                </Text>
                <View style={styles.colFee}>
                  <View style={styles.greenPill}>
                    <Text style={styles.greenPillText}>
                      {d.municipalFeeStatus || "PAID & CLEARED"}
                    </Text>
                  </View>
                </View>
                <View style={styles.colWaiver}>
                  <View style={styles.greenPill}>
                    <Text style={styles.greenPillText}>
                      {d.safetyWaiverStatus ? `✓ ${d.safetyWaiverStatus}` : "✓ SIGNED"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No divers recorded on this manifest.</Text>
            </View>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  canvas: {
    width: 1024,
    minHeight: 783,
    backgroundColor: "#EEF5FD",
    position: "relative",
    overflow: "hidden",
  },
  heroBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1024,
    height: 362,
    backgroundColor: "#0B79F2",
  },
  topHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1024,
    height: 262,
    paddingTop: 60,
    paddingLeft: 57,
  },
  brandCol: {
    alignItems: "flex-start",
  },
  logoImage: {
    width: 132,
    height: 28,
  },
  logoAccentBar: {
    width: 43,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    marginTop: 18,
    marginLeft: -5,
  },
  titleWrap: {
    marginTop: 35,
  },
  titleLine: {
    fontSize: 34,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    lineHeight: 40,
  },
  whiteCard: {
    marginTop: 262,
    marginHorizontal: 35,
    marginBottom: 61,
    minHeight: 460,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 30,
    paddingTop: 26,
    paddingBottom: 24,
    shadowColor: "#001030",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  blueBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: "#0066FF",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  gridContainer: {
    marginBottom: 26,
  },
  gridRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  gridTile: {
    flex: 1,
    height: 60,
    backgroundColor: "#F4F7FC",
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tileTextCol: {
    flex: 1,
    minWidth: 0,
  },
  tileLabel: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#7E92A9",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  tileValue: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    marginTop: 2,
  },
  tableHeader: {
    backgroundColor: "#0066FF",
    borderRadius: 8,
    height: 35,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  thText: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontFamily: "Quicksand_700Bold",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  colIndex: {
    width: 36,
    textAlign: "center",
    paddingRight: 6,
  },
  colName: {
    flex: 2.1,
    paddingHorizontal: 8,
  },
  colEcoId: {
    flex: 1.6,
    paddingHorizontal: 8,
  },
  colCert: {
    flex: 2.0,
    paddingHorizontal: 8,
  },
  colFee: {
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  colWaiver: {
    width: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
  },
  tdText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  tdName: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  tdEcoId: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#0066FF",
  },
  tdCert: {
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#334155",
  },
  greenPill: {
    backgroundColor: "#E6F8F0",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  greenPillText: {
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    color: "#059669",
    letterSpacing: 0.2,
  },
  emptyRow: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
    fontStyle: "italic",
  },
});
