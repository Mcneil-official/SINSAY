import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
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
import { colors } from "../../../constants/colors";
import { Button, TextInput, Dropdown, Card } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

const diveTypes = ["Recreational", "Technical", "Free Diving", "Snorkeling"].map((v) => ({ label: v, value: v }));
const diveModes = ["Shore Entry", "Boat Dive", "Night Dive", "Drift Dive"].map((v) => ({ label: v, value: v }));
const locations = [
  "Anilao Cove", "Sombrero Island", "Sepoc Beach", "Mainit", "Tingloy",
  "Arthurs Rock", "Koala", "Secret Bay", "Basura", "Mapating Rock",
].map((v) => ({ label: v, value: v }));
const difficulties = ["Beginner", "Intermediate", "Advanced", "All Levels"].map((v) => ({ label: v, value: v }));

interface Diver {
  id: string;
  name: string;
  ecoId?: string;
  touristId?: string;
  isWalkIn: boolean;
}

let diverCounter = 0;

export default function CreateManifestStep1() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ addDiver?: string }>();
  const [diveType, setDiveType] = useState("");
  const [diveMode, setDiveMode] = useState("");
  const [location, setLocation] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [boatName, setBoatName] = useState("");
  const [captainName, setCaptainName] = useState("");
  const [maxDivers, setMaxDivers] = useState("16");
  const [dutyOfCare, setDutyOfCare] = useState(false);
  const [diveDate, setDiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [divers, setDivers] = useState<Diver[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [remainingPasses, setRemainingPasses] = useState(0);

  useEffect(() => {
    if (!user) {
      router.replace("/loginpage");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("operator_pass_ledger")
      .select("remaining_passes")
      .eq("operator_id", user.id)
      .single()
      .then(({ data }) => {
        setRemainingPasses(data?.remaining_passes ?? 0);
      });
  }, [user]);

  useEffect(() => {
    if (params.addDiver) {
      try {
        const diver = JSON.parse(params.addDiver);
        diverCounter += 1;
        setDivers((prev) => [
          ...prev,
          {
            id: `diver-${diverCounter}`,
            name: diver.name,
            ecoId: diver.ecoId || undefined,
            touristId: diver.touristId || undefined,
            isWalkIn: diver.isWalkIn || false,
          },
        ]);
      } catch (e) {
        // ignore invalid JSON
      }
    }
  }, [params.addDiver]);

  const hasEnoughPasses = remainingPasses >= divers.length;
  const canSubmit =
    diveType && diveMode && location && difficulty && boatName && captainName.trim() && divers.length > 0
    && divers.length <= Number(maxDivers) && hasEnoughPasses && dutyOfCare && !saving;

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSaving(true);
    setError("");

    try {
      // 1. Create dive manifest
      const { data: manifest, error: mfError } = await supabase
        .from("dive_manifests")
        .insert({
          operator_id: user.id,
          dive_type: diveType,
          dive_mode: diveMode,
          location,
          difficulty,
          boat_name: boatName.trim(),
          captain_name: captainName.trim() || null,
          max_divers: Number(maxDivers) || divers.length,
          duty_of_care: dutyOfCare,
          dive_date: diveDate,
          status: "active",
        })
        .select("id")
        .single();

      if (mfError || !manifest) {
        setError("Failed to create manifest. Please try again.");
        setSaving(false);
        return;
      }

      // 2. Insert each diver
      const diverInserts = divers.map((d) => ({
        manifest_id: manifest.id,
        name: d.name,
        eco_id: d.ecoId || null,
        tourist_id: d.touristId || null,
        is_walk_in: d.isWalkIn,
      }));

      const { error: dvError } = await supabase
        .from("manifest_divers")
        .insert(diverInserts);

      if (dvError) {
        setError("Failed to add divers. Please try again.");
        setSaving(false);
        return;
      }

      // 3. Navigate to confirmed with data
      router.replace({
        pathname: "/establishment/create-manifest/confirmed",
        params: {
          manifestId: manifest.id,
          location,
          diverCount: divers.length,
          boatName: boatName.trim(),
          captainName: captainName.trim(),
          remainingBalance: remainingPasses - divers.length,
        },
      });
    } catch (e) {
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Create Manifest</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Dive Info */}
        <Text style={styles.sectionTitle}>Dive Information</Text>
        <View style={{ gap: 12, marginBottom: 16 }}>
          <Dropdown label="Dive Type" placeholder="Select dive type" value={diveType} options={diveTypes} onSelect={setDiveType} />
          <Dropdown label="Dive Mode" placeholder="Select dive mode" value={diveMode} options={diveModes} onSelect={setDiveMode} />
          <Dropdown label="Dive Site / Location" placeholder="Select location" value={location} options={locations} onSelect={setLocation} />
          <Dropdown label="Difficulty Level" placeholder="Select difficulty" value={difficulty} options={difficulties} onSelect={setDifficulty} />
          <TextInput
            label="Dive Date"
            placeholder="YYYY-MM-DD"
            value={diveDate}
            onChangeText={setDiveDate}
          />
        </View>

        {/* Boat Details */}
        <Text style={styles.sectionTitle}>Boat Details</Text>
        <View style={{ gap: 12, marginBottom: 16 }}>
          <TextInput label="Boat Name" placeholder="Enter boat name or ID" value={boatName} onChangeText={setBoatName} />
          <TextInput
            label="Captain Name"
            placeholder="e.g. Captain Juan"
            value={captainName}
            onChangeText={setCaptainName}
          />
          <TextInput
            label="Max Divers Capacity"
            placeholder="Enter max divers"
            value={maxDivers}
            onChangeText={setMaxDivers}
            keyboardType="numeric"
          />
        </View>

        {/* Divers List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Divers</Text>
          <TouchableOpacity
            style={styles.addDiverBtn}
            onPress={() => router.push("/establishment/create-manifest/add-diver")}
          >
            <Ionicons name="add-circle" size={18} color={colors.primaryBlue} />
            <Text style={styles.addDiverText}>Add Diver</Text>
          </TouchableOpacity>
        </View>

        {divers.length === 0 ? (
          <Card style={styles.emptyDiverCard}>
            <Ionicons name="people-outline" size={28} color={colors.grayLight} />
            <Text style={styles.emptyDiverText}>No divers added yet.</Text>
            <Text style={styles.emptyDiverSub}>
              Each diver must have a valid{"\n"}Eco-Diver ID or registered walk-in.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: 6, marginBottom: 16 }}>
            {divers.map((d) => (
              <View key={d.id} style={styles.diverRow}>
                <Ionicons name="person-circle" size={24} color={colors.primaryBlue} />
                <Text style={styles.diverName}>{d.name}</Text>
                {d.isWalkIn && (
                  <View style={styles.walkInBadge}>
                    <Text style={styles.walkInText}>Walk-in</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Diver count + pass check */}
        <View style={styles.diverCountRow}>
          <Text style={divers.length > Number(maxDivers) ? styles.errorText : styles.diverCountText}>
            {divers.length} / {maxDivers || "?"} divers
          </Text>
          <Text style={styles.passCountText}>
            Passes: {remainingPasses} remaining
          </Text>
        </View>
        {divers.length > 0 && !hasEnoughPasses && (
          <Text style={styles.insufficientText}>
            Not enough dive passes remaining ({remainingPasses}). You need {divers.length - remainingPasses} more.
          </Text>
        )}

        {/* Duty of Care */}
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setDutyOfCare(!dutyOfCare)} activeOpacity={0.7}>
          <Ionicons name={dutyOfCare ? "checkbox" : "square-outline"} size={20} color={dutyOfCare ? colors.primaryBlue : colors.gray} />
          <Text style={styles.checkboxLabel}>
            I confirm that all divers listed have signed the Duty of Care waiver and are fit to dive.
          </Text>
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button title={saving ? "Submitting..." : "Submit Manifest"} onPress={handleSubmit} disabled={!canSubmit} />

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, paddingHorizontal: 20 },
  scrollContent: { paddingTop: 8, paddingBottom: 20 },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.darkText, marginBottom: 8 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  addDiverBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addDiverText: { fontSize: 13, fontWeight: "500", color: colors.primaryBlue },
  emptyDiverCard: { alignItems: "center", justifyContent: "center", paddingVertical: 30, marginBottom: 16 },
  emptyDiverText: { fontSize: 14, fontWeight: "600", color: colors.gray, marginTop: 8 },
  emptyDiverSub: { fontSize: 12, color: colors.grayLight, textAlign: "center", marginTop: 4, lineHeight: 18 },
  diverRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    borderRadius: 12, padding: 12, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  diverName: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.darkText },
  walkInBadge: { borderRadius: 100, backgroundColor: "#FEF3C7", paddingVertical: 2, paddingHorizontal: 8 },
  walkInText: { fontSize: 10, fontWeight: "600", color: "#92400E" },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8, marginBottom: 24 },
  checkboxLabel: { flex: 1, fontSize: 12, color: colors.gray, lineHeight: 18 },
  diverCountRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 8, marginBottom: 4,
  },
  diverCountText: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  passCountText: { fontSize: 12, color: colors.gray },
  insufficientText: {
    fontSize: 13, color: colors.red, textAlign: "center", marginBottom: 12, lineHeight: 18,
  },
  errorText: { fontSize: 13, color: colors.red, textAlign: "center", marginBottom: 12 },
});
