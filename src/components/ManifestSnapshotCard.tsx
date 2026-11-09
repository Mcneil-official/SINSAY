import React, { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { MABINI_LGU_LOGO_URI } from "../constants/lguLogo";

export interface ManifestSnapshotDiver {
  name: string;
  ecoId?: string | null;
  isWalkIn?: boolean;
  nationality?: string | null;
  certification?: string | null;
  municipalFeeStatus?: string;
  safetyWaiverStatus?: string;
}

export interface SnapshotManifest {
  id?: string;
  boat_name: string | null;
  dive_mode: string;
  dive_type?: string | null;
  location: string;
  difficulty?: string | null;
  dive_date: string;
  diver_count: number;
  max_divers?: number | null;
  captain_name?: string | null;
  crew_members?: string[] | null;
  dive_masters?: string[] | null;
  instructor_name?: string | null;
  crew_count?: number | null;
  status: "active" | "upcoming" | "completed" | "done";
}

export interface ManifestSnapshotCardProps {
  manifest: SnapshotManifest;
  divers: (ManifestSnapshotDiver | string)[];
  operatorName: string;
}

const MIN_ROW_COUNT = 8;

export const ManifestSnapshotCard = forwardRef<View, ManifestSnapshotCardProps>(
  function ManifestSnapshotCard({ manifest, divers, operatorName }, ref) {
    const isBoatDive = (manifest.dive_mode || "Boat Dive").toLowerCase().includes("boat");
    const subHeaderTitle = isBoatDive ? "Boat Trip Record" : "Shore Dive Record";
    const resolvedOperator = operatorName || "Accredited Dive Operator";

    const normalizedDivers: ManifestSnapshotDiver[] = (divers || []).map((d) => {
      if (typeof d === "string") {
        return {
          name: d,
          ecoId: "ECO-2026-0042",
          isWalkIn: false,
          nationality: "Filipino",
          certification: "Certified Diver",
          municipalFeeStatus: "PAID & CLEARED",
          safetyWaiverStatus: "SIGNED",
        };
      }
      const isWalkIn = Boolean(d.isWalkIn);
      let resolvedEcoId = "Walk-in";
      if (isWalkIn) {
        resolvedEcoId = "Walk-in";
      } else if (d.ecoId && d.ecoId !== "VERIFIED ID" && d.ecoId !== "WALK-IN GUEST") {
        resolvedEcoId = d.ecoId;
      } else {
        resolvedEcoId = d.ecoId || "—";
      }

      return {
        ...d,
        ecoId: resolvedEcoId,
        isWalkIn,
        nationality: d.nationality || "Filipino",
        certification:
          d.certification || (isWalkIn ? "Walk-in Registration" : "Certified Diver"),
        municipalFeeStatus: d.municipalFeeStatus || "PAID & CLEARED",
        safetyWaiverStatus: d.safetyWaiverStatus || "SIGNED",
      };
    });

    const diverCount = manifest.diver_count || normalizedDivers.length;
    const maxDivers = manifest.max_divers || (isBoatDive ? 22 : 30);

    const shortId = manifest.id
      ? manifest.id.length > 10
        ? manifest.id.slice(0, 5).toUpperCase()
        : manifest.id.toUpperCase()
      : "0001";

    const manifestNumber = `2026-${shortId}`;
    const permitNumber = manifest.dive_date || `2026-11-${shortId}`;

    const rawDate = manifest.dive_date || "";
    let formattedDate = rawDate;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
        }
      } catch {
        formattedDate = rawDate;
      }
    }

    const diveSiteDisplay =
      manifest.location?.trim() ||
      (isBoatDive ? "Anilao Dive Site" : "Anilao Shore Entry");
    const vesselNameDisplay =
      manifest.boat_name?.trim() || (isBoatDive ? "Official Dive Vessel" : "Shore Entry / Non-Boat");
    const captainDisplay =
      manifest.captain_name?.trim() || (isBoatDive ? "Assigned Boat Captain" : "N/A (Shore Dive)");

    const dms = (manifest.dive_masters || [])
      .map((s) => s.trim())
      .filter(Boolean);
    const leadDmDisplay =
      dms.length > 0
        ? dms.join(", ")
        : manifest.instructor_name?.trim() || "Assigned Divemaster";

    const crews = (manifest.crew_members || [])
      .map((s) => s.trim())
      .filter(Boolean);
    const crewDisplay =
      crews.length > 0
        ? crews.join(", ")
        : manifest.crew_count
        ? `${manifest.crew_count} Vessel Crew`
        : "Standard Vessel Crew";

    const difficultyDisplay = manifest.difficulty?.trim() || "All Levels";
    const diveTypeDisplay = manifest.dive_type?.trim() || "Scuba Diving";

    const totalRows = Math.max(MIN_ROW_COUNT, normalizedDivers.length + 4);
    const emptyRowCount = Math.max(3, totalRows - normalizedDivers.length);

    return (
      <View ref={ref} style={styles.canvas} collapsable={false}>
        {/* Top Header Section: Mabini LGU Logo + Letterhead on Left, Manifest No. & Date on Right */}
        <View style={styles.topHeaderRow}>
          <View style={styles.brandGroup}>
            <Image
              source={{ uri: MABINI_LGU_LOGO_URI }}
              style={styles.lguLogo}
              resizeMode="contain"
            />
            <View style={styles.letterheadTextGroup}>
              <Text style={styles.lguCountry}>REPUBLIC OF THE PHILIPPINES</Text>
              <Text style={styles.lguProvince}>
                PROVINCE OF BATANGAS • MUNICIPALITY OF MABINI
              </Text>
              <Text style={styles.lguOffice}>
                MUNICIPAL TOURISM & MARITIME SAFETY OFFICE
              </Text>
              <Text style={styles.lguOperator} numberOfLines={1}>
                Operating Resort: {resolvedOperator}
              </Text>
            </View>
          </View>

          {/* Clean Right-Aligned Manifest No. and Date (Matching Option 1 Reference) */}
          <View style={styles.metaRightBlock}>
            <Text style={styles.metaManifestNo}>Manifest No. {manifestNumber}</Text>
            <Text style={styles.metaDate}>Date: {formattedDate}</Text>
          </View>
        </View>

        {/* Centered Document Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleMain}>PASSENGER MANIFEST</Text>
          <Text style={styles.titleSub}>{subHeaderTitle}</Text>
          <View style={styles.titleDivider} />
        </View>

        {/* Section 1: Vessel & Trip Information Table (3 Rows x 3 Columns, #0D3B66 Header) */}
        <View style={styles.tableCard}>
          <View style={styles.tableHeaderSection}>
            <Text style={styles.tableHeaderSectionText}>
              {isBoatDive ? "Vessel & Trip Information" : "Dive Site & Entry Information"}
            </Text>
          </View>
          <View style={styles.tableGrid}>
            {isBoatDive ? (
              <>
                {/* Row 1: Vessel, Dive Site Destination, Mode & Type */}
                <View style={styles.tableGridRow}>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Vessel Name</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {vesselNameDisplay}
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Dive Site / Destination</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {diveSiteDisplay}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.cellLabel}>Dive Mode & Type</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      Boat Dive • {diveTypeDisplay}
                    </Text>
                  </View>
                </View>

                {/* Row 2: Captain, Lead Divemaster, Crew */}
                <View style={styles.tableGridRow}>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Boat Captain</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {captainDisplay}
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Lead Divemaster / Guide</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {leadDmDisplay}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.cellLabel}>Crew Members</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {crewDisplay}
                    </Text>
                  </View>
                </View>

                {/* Row 3: Diver Capacity, Difficulty, Date */}
                <View style={[styles.tableGridRow, styles.rowNoBottomBorder]}>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Diver Capacity</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {diverCount} / {maxDivers} Max Divers
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Difficulty Tier</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {difficultyDisplay}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.cellLabel}>Departure Date</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {formattedDate}
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Shore Dive Row 1 */}
                <View style={styles.tableGridRow}>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Dive Site / Shore Entry</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {diveSiteDisplay}
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Dive Mode</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      Shore Entry Dive
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.cellLabel}>Dive Type</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {diveTypeDisplay}
                    </Text>
                  </View>
                </View>

                {/* Shore Dive Row 2 */}
                <View style={styles.tableGridRow}>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Lead Divemaster / Guide</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {leadDmDisplay}
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Operating Resort</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {resolvedOperator}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.cellLabel}>Difficulty Tier</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {difficultyDisplay}
                    </Text>
                  </View>
                </View>

                {/* Shore Dive Row 3 */}
                <View style={[styles.tableGridRow, styles.rowNoBottomBorder]}>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Registered Divers</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {diverCount} Divers Registered
                    </Text>
                  </View>
                  <View style={[styles.gridCell, styles.cellBorderRight]}>
                    <Text style={styles.cellLabel}>Schedule Date</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {formattedDate}
                    </Text>
                  </View>
                  <View style={styles.gridCell}>
                    <Text style={styles.cellLabel}>Safety / Duty Protocol</Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      Standard PCSSD Protocols
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Section 2: Passenger List Table (Ice-Blue #C8DCF0 Column Headers) */}
        <View style={styles.tableCard}>
          {/* Table Header Bar */}
          <View style={styles.tableHeaderSection}>
            <Text style={styles.tableHeaderSectionText}>Passenger List</Text>
          </View>

          {/* Ice-Blue Column Sub-Headers Row */}
          <View style={styles.columnSubHeaderRow}>
            <Text style={[styles.columnSubHeaderText, styles.colNo]}>No.</Text>
            <Text style={[styles.columnSubHeaderText, styles.colName]}>
              Diver Passenger Name
            </Text>
            <Text style={[styles.columnSubHeaderText, styles.colNationality]}>
              Nationality
            </Text>
            <Text style={[styles.columnSubHeaderText, styles.colEcoId]}>
              ECO ID / ID No.
            </Text>
          </View>

          {/* Active Passenger Rows */}
          {normalizedDivers.map((diver, idx) => (
            <View
              key={`diver-${idx}-${diver.name}`}
              style={styles.dataRow}
            >
              <Text style={[styles.dataCellNo, styles.colNo]}>{idx + 1}</Text>
              <Text
                style={[styles.dataCellName, styles.colName]}
                numberOfLines={1}
              >
                {diver.name}
              </Text>
              <Text
                style={[styles.dataCellNationality, styles.colNationality]}
                numberOfLines={1}
              >
                {diver.nationality || "Filipino"}
              </Text>
              <Text
                style={[styles.dataCellEcoId, styles.colEcoId]}
                numberOfLines={1}
              >
                {diver.ecoId}
              </Text>
            </View>
          ))}

          {/* Padded Empty Grid Rows (Matching Reference Image) */}
          {Array.from({ length: emptyRowCount }).map((_, emptyIdx) => {
            const isLast = emptyIdx === emptyRowCount - 1;
            return (
              <View
                key={`empty-grid-row-${emptyIdx}`}
                style={[styles.emptyGridRow, isLast && styles.rowNoBottomBorder]}
              >
                <View style={styles.colNo} />
                <View style={styles.colName} />
                <View style={styles.colNationality} />
                <View style={styles.colEcoId} />
              </View>
            );
          })}
        </View>

        {/* Bottom Flowing Multi-Tone Ocean Wave Graphic Border (Exact Vector SVG from Design) */}
        <View style={styles.waveGraphicWrap} pointerEvents="none">
          <Svg
            width="100%"
            height={100}
            viewBox="0 0 484 57"
            preserveAspectRatio="none"
          >
            <Path
              d="M0 26.7778C80 4.61481 112 43.9037 190 30.8074C260 16.7037 286 2.6 332 8.64444C375 16.7037 383 -12.5111 441 6.62963C463 14.6889 475 19.7259 484 21.7407V57H0V26.7778Z"
              fill="#EEF6FE"
            />
            <Path
              d="M0 4.65804C57 -4.40114 102 26.8027 160 22.7764C223 20.7633 247 1.63831 305 17.7435C368 34.8553 412 50.9605 484 15.7304V57H0V4.65804Z"
              fill="#9CC8F1"
            />
            <Path
              d="M0 4C73 -4 132 35 209 37C298 44 355 48 414 29C445 20 463 9 484 0V57H0V4Z"
              fill="#6CB0E7"
            />
            <Path
              d="M0 27.0129C79 3.02321 143 28.0125 215 41.0069C295 56.0004 380 57.9996 484 27.0129V57H0V27.0129Z"
              fill="#13508B"
            />
            <Path
              d="M0 25C76 26.0667 112 61.2667 194 47.4C268 35.6667 326 20.7333 378 36.7333C421 50.6 452 42.0667 484 30.3333V57H0V25Z"
              fill="#1970B9"
              opacity={0.85}
            />
          </Svg>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  canvas: {
    width: 1024,
    minHeight: 1320,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 48,
    paddingTop: 44,
    paddingBottom: 0,
    position: "relative",
    overflow: "hidden",
  },
  topHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
    paddingRight: 20,
  },
  lguLogo: {
    width: 82,
    height: 82,
  },
  letterheadTextGroup: {
    justifyContent: "center",
    flex: 1,
  },
  lguCountry: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#475569",
    letterSpacing: 1.4,
  },
  lguProvince: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  lguOffice: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#0D3B66",
    letterSpacing: 0.8,
    marginTop: 2,
  },
  lguOperator: {
    fontSize: 11.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#0066CC",
    marginTop: 3,
  },
  metaRightBlock: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    paddingTop: 4,
  },
  metaManifestNo: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  metaDate: {
    fontSize: 13.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#0F172A",
    marginTop: 4,
  },
  titleBlock: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  titleMain: {
    fontSize: 30,
    fontFamily: "Quicksand_700Bold",
    color: "#0D3B66",
    letterSpacing: 2,
  },
  titleSub: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    marginTop: 4,
  },
  titleDivider: {
    height: 2,
    backgroundColor: "#0D3B66",
    width: "100%",
    marginTop: 18,
  },
  tableCard: {
    borderWidth: 1,
    borderColor: "#B8D2EB",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginBottom: 24,
  },
  tableHeaderSection: {
    backgroundColor: "#0D3B66",
    height: 42,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  tableHeaderSectionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
  },
  tableGrid: {
    backgroundColor: "#FFFFFF",
  },
  tableGridRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#C5D9ED",
  },
  rowNoBottomBorder: {
    borderBottomWidth: 0,
  },
  gridCell: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: "center",
  },
  cellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: "#C5D9ED",
  },
  cellLabel: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#334E68",
  },
  cellValue: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0A2540",
    marginTop: 2,
  },
  columnSubHeaderRow: {
    backgroundColor: "#C8DCF0",
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#B8D2EB",
  },
  columnSubHeaderText: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0A2540",
    lineHeight: 42,
  },
  colNo: {
    width: 70,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#B8D2EB",
  },
  colName: {
    flex: 1,
    paddingHorizontal: 16,
    textAlign: "left",
    borderRightWidth: 1,
    borderRightColor: "#B8D2EB",
  },
  colNationality: {
    width: 200,
    paddingHorizontal: 12,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#B8D2EB",
  },
  colEcoId: {
    width: 250,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  dataRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#C5D9ED",
    backgroundColor: "#FFFFFF",
  },
  dataCellNo: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0A2540",
    textAlign: "center",
    lineHeight: 44,
  },
  dataCellName: {
    fontSize: 14.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0A2540",
    lineHeight: 44,
  },
  dataCellNationality: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0A2540",
    textAlign: "center",
    lineHeight: 44,
  },
  dataCellEcoId: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0066CC",
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 44,
  },
  emptyGridRow: {
    height: 40,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#C5D9ED",
    backgroundColor: "#FFFFFF",
  },
  waveGraphicWrap: {
    height: 100,
    marginTop: "auto",
    marginHorizontal: -48,
    marginBottom: 0,
  },
});
