import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../constants/colors";
import { Button, StatusBadge, ContentContainer, EmptyState } from "../../components";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

type StatusDerived = "active" | "done";

function deriveStatus(diveDate: string): StatusDerived {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dd = new Date(diveDate);
  dd.setHours(0, 0, 0, 0);
  return dd < today ? "done" : "active";
}

interface ManifestItem {
  id: string;
  boat_name: string;
  location: string;
  dive_date: string;
  diver_count: number;
}

export default function ManifestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [manifests, setManifests] = useState<ManifestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadManifests();
  }, [user]);

  const loadManifests = async () => {
    setLoading(true);
    try {
      const { data: mfData } = await supabase
        .from("dive_manifests")
        .select("id, boat_name, location, dive_date")
        .eq("operator_id", user!.id)
        .order("created_at", { ascending: false });

      if (mfData) {
        const withCounts = await Promise.all(
          mfData.map(async (m) => {
            const { count } = await supabase
              .from("manifest_divers")
              .select("id", { count: "exact", head: true })
              .eq("manifest_id", m.id);
            return { ...m, diver_count: count || 0 };
          })
        );
        setManifests(withCounts);
      }
    } catch (e) {
      console.warn("Manifests load error", e);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <View style={styles.headerRow}>
          <Text style={styles.title}>Manifests</Text>
          <Button
            title="+ New"
            onPress={() => router.push("/establishment/create-manifest/step1")}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
        ) : manifests.length === 0 ? (
          <EmptyState icon="boat-outline" message="No manifests yet." />
        ) : (
          <View style={styles.list}>
            {manifests.map((m) => {
              const status = deriveStatus(m.dive_date);
              return (
                <TouchableOpacity key={m.id} style={styles.row} activeOpacity={0.7}>
                  <View style={styles.icon}>
                    <Ionicons name="boat" size={20} color={colors.primaryBlue} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.rowTitle}>{m.boat_name}</Text>
                    <Text style={styles.rowMeta}>
                      {new Date(m.dive_date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })} · {m.diver_count} divers · {m.location}
                    </Text>
                  </View>
                  <StatusBadge
                    label={status === "active" ? "Active" : "Done"}
                    variant={status}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

          </ContentContainer>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: colors.darkText },
  list: { gap: 8 },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    borderRadius: 14, padding: 14, gap: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EBF2FF", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: colors.darkText },
  rowMeta: { fontSize: 11, color: colors.gray, marginTop: 2 },
});
