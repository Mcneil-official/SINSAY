import React, { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { formatDiveDate } from "../lib/diveDate";

export interface SnapshotManifest {
  id: string;
  boat_name: string;
  location: string;
  dive_date: string;
  diver_count: number;
  status: "active" | "done";
}

// Dedicated share card (NOT a screen capture): a fixed-width summary rendered
// off-screen in a modal and captured to PNG via `lib/snapshot`. Keeps the
// image identical on every device regardless of screen size or scroll.
export const ManifestSnapshotCard = forwardRef<
  View,
  { manifest: SnapshotManifest; divers: string[]; operatorName: string }
>(function ManifestSnapshotCard({ manifest, divers, operatorName }, ref) {
  const shortId =
    manifest.id.length > 12
      ? `MFT-${manifest.id.slice(0, 5).toUpperCase()}`
      : manifest.id;
  return (
    <View ref={ref} style={styles.card} collapsable={false}>
      <View style={styles.header}>
        <Text style={styles.brand}>SINSAY · Mabini Eco-Dive</Text>
        <Text style={styles.headerId}>{shortId}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.boat}>{manifest.boat_name || "Dive Group"}</Text>
          <View
            style={[
              styles.pill,
              manifest.status === "active" ? styles.pillActive : styles.pillDone,
            ]}
          >
            <Text
              style={[
                styles.pillText,
                manifest.status === "active" ? styles.pillActiveText : styles.pillDoneText,
              ]}
            >
              {manifest.status === "active" ? "Upcoming" : "Completed"}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {formatDiveDate(manifest.dive_date)} · {manifest.location}
        </Text>
        <Text style={styles.meta}>
          {manifest.diver_count} diver{manifest.diver_count === 1 ? "" : "s"} · {operatorName}
        </Text>
        <View style={styles.divider} />
        {divers.length > 0 ? (
          divers
            .slice(0, 12)
            .map((name, i) => (
              <Text key={`${name}-${i}`} style={styles.diver}>
                {i + 1}. {name}
              </Text>
            ))
        ) : (
          <Text style={styles.diverMuted}>Diver list unavailable offline</Text>
        )}
        {divers.length > 12 && (
          <Text style={styles.diverMuted}>+{divers.length - 12} more</Text>
        )}
      </View>
      <Text style={styles.footer}>Verified via SINSAY Tourism Office</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: colors.white,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  header: {
    backgroundColor: "#0B2545",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 13, fontWeight: "800", color: colors.white, letterSpacing: 0.4 },
  headerId: { fontSize: 12, fontWeight: "700", color: "#93C5FD" },
  body: { paddingHorizontal: 18, paddingVertical: 14 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  boat: { fontSize: 17, fontWeight: "800", color: "#0F172A", flex: 1 },
  pill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  pillActive: { backgroundColor: "#DCFCE7" },
  pillDone: { backgroundColor: "#EEF2FF" },
  pillText: { fontSize: 11, fontWeight: "800" },
  pillActiveText: { color: "#16A34A" },
  pillDoneText: { color: "#4F46E5" },
  meta: { fontSize: 12.5, color: "#64748B", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 10 },
  diver: { fontSize: 13, color: "#0F172A", paddingVertical: 2 },
  diverMuted: { fontSize: 12, color: "#94A3B8", fontStyle: "italic" },
  footer: {
    fontSize: 10.5,
    color: "#94A3B8",
    textAlign: "center",
    paddingBottom: 12,
  },
});
