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

const todayLocal = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const isValidCalendarDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
};

// Annual validity: exactly 1 year from the dive date, formatted back to
// YYYY-MM-DD in local parts (avoids UTC day-shift).
const addOneYear = (s: string) => {
  const [y, mo, d] = s.split("-").map(Number);
  return `${y + 1}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

let diverIdCounter = 1000;
function createNextDiverId(): string {
  diverIdCounter += 1;
  return `diver-${Date.now()}-${diverIdCounter}`;
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

  // Divers list — starts empty. (Demo prefills were removed: they shipped
  // as real manifest rows with fabricated eco-IDs.)
  const [divers, setDivers] = useState<Diver[]>(() => {
    if (Array.isArray(initialDraft.divers) && initialDraft.divers.length > 0) {
      return initialDraft.divers as Diver[];
    }
    return [];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");
  const [remainingPasses, setRemainingPasses] = useState(0);
  const [annualSlots, setAnnualSlots] = useState(0);
  const [passesLoading, setPassesLoading] = useState(true);
  const [passesError, setPassesError] = useState(false);
  // touristIds covered by a valid annual pass for the current dive date.
  const [annualCovered, setAnnualCovered] = useState<Set<string>>(new Set());
  // touristIds the operator chose to cover with an annual slot on submit.
  const [annualAssigned, setAnnualAssigned] = useState<string[]>([]);
  const [searchError, setSearchError] = useState(false);

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
    setPassesLoading(true);
    setPassesError(false);
    try {
      const { data, error: ledgerError } = await supabase
        .from("operator_pass_ledger")
        // select("*"): annual_* columns arrive with 027; pre-027 the view
        // lacks them and ?? 0 degrades gracefully instead of erroring.
        .select("*")
        .eq("operator_id", user.id)
        .maybeSingle();
      if (ledgerError) throw ledgerError;
      // New operators have no ledger row yet — treat as 0, not an error.
      setRemainingPasses(data?.remaining_passes ?? 0);
      setAnnualSlots(Math.max(0, data?.annual_remaining ?? 0));
    } catch (e) {
      console.warn("Failed to load pass ledger:", e);
      setPassesError(true);
    } finally {
      setPassesLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle diver added via router param (add-diver screen echo)
  useEffect(() => {
    if (params.addDiver) {
      try {
        const d = JSON.parse(params.addDiver);
        if (d && d.name) {
          setDivers((prev) => {
            // Dedupe: re-delivery of the same param must not re-append.
            const name = String(d.name).trim();
            if (d.touristId && prev.some((x) => x.touristId === d.touristId)) return prev;
            if (
              !d.touristId &&
              prev.some((x) => x.isWalkIn && x.name.trim().toLowerCase() === name.toLowerCase())
            )
              return prev;
            return [
              ...prev,
              {
                id: createNextDiverId(),
                name,
                ecoId: d.ecoId || undefined,
                touristId: d.touristId,
                isWalkIn: !!d.isWalkIn,
                meta: d.isWalkIn ? "Walk-in" : d.ecoId ? `${d.ecoId} · Verified diver` : undefined,
              },
            ];
          });
        }
      } catch (err) {
        console.warn("Could not parse addDiver param:", err);
      }
    }
  }, [params.addDiver]);

  // Annual coverage: registered divers holding a valid annual pass for the
  // dive date don't consume one-day passes (ledger excludes them server-side
  // in 027). Pre-027 the table is missing → catch → all uncovered, and the
  // one-day logic below behaves exactly as before.
  useEffect(() => {
    const ids = [...new Set(divers.filter((d) => d.touristId).map((d) => d.touristId as string))];
    setAnnualAssigned((prev) => prev.filter((id) => ids.includes(id)));
    if (ids.length === 0 || !isValidCalendarDate(diveDate)) {
      setAnnualCovered(new Set());
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("annual_pass_holders")
          .select("tourist_id, valid_from, valid_until")
          .in("tourist_id", ids);
        if (error) throw error;
        const covered = new Set<string>();
        for (const h of data || []) {
          if (h.valid_from <= diveDate && diveDate <= h.valid_until) {
            covered.add(h.tourist_id);
          }
        }
        setAnnualCovered(covered);
      } catch (e) {
        console.warn("Annual coverage check failed:", e);
        setAnnualCovered(new Set());
      }
    })();
  }, [divers, diveDate]);

  const isCovered = (d: Diver) => !!d.touristId && annualCovered.has(d.touristId);
  const isAssigned = (d: Diver) => !!d.touristId && annualAssigned.includes(d.touristId as string);
  const canAssignMore = annualAssigned.length < annualSlots;

  const toggleAnnual = (d: Diver) => {
    if (!d.touristId || isCovered(d)) return;
    setAnnualAssigned((prev) =>
      prev.includes(d.touristId as string)
        ? prev.filter((id) => id !== d.touristId)
        : canAssignMore
          ? [...prev, d.touristId as string]
          : prev
    );
  };

  // Divers that actually consume one-day passes: registered, neither covered
  // by an annual nor assigned one now. Walk-ins never consume (ledger counts
  // is_walk_in = false only — preserved behavior).
  const passesNeeded = divers.filter(
    (d) => !d.isWalkIn && d.touristId && !isCovered(d) && !isAssigned(d)
  ).length;
  const hasEnoughPasses = !passesLoading && !passesError && remainingPasses >= passesNeeded;
  const dateValid = isValidCalendarDate(diveDate);
  const maxDiversNum = Number(maxDivers);
  const maxDiversValid = Number.isInteger(maxDiversNum) && maxDiversNum > 0;
  const canSubmit =
    divers.length > 0 &&
    boatName.trim() &&
    captainName.trim() &&
    maxDiversValid &&
    divers.length <= maxDiversNum &&
    hasEnoughPasses &&
    dateValid &&
    !saving;

  // Search tourists in Supabase
  const searchTourists = async (text: string) => {
    setSearchQuery(text);
    setSearchError(false);
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
      if (err) throw err;
      setSearchResults(data || []);
    } catch (e) {
      console.warn("Diver search failed:", e);
      setSearchResults([]);
      setSearchError(true);
    }
    setSearching(false);
  };

  const handleSelectSearchResult = async (tourist: { id: string; full_name: string }) => {
    // Never fabricate an eco-ID: look up the real one (may be none).
    let ecoId: string | undefined;
    try {
      const { data } = await supabase
        .from("eco_dive_ids")
        .select("eco_id_number")
        .eq("tourist_id", tourist.id)
        .limit(1)
        .maybeSingle();
      ecoId = data?.eco_id_number ?? undefined;
    } catch (e) {
      console.warn("Eco-ID lookup failed:", e);
    }
    const newDiver: Diver = {
      id: createNextDiverId(),
      name: tourist.full_name,
      ecoId,
      touristId: tourist.id,
      isWalkIn: false,
      meta: ecoId ? `${ecoId} · Verified diver` : "No Eco-Dive ID on file",
    };
    setDivers((prev) =>
      prev.some((d) => d.touristId === tourist.id) ? prev : [...prev, newDiver]
    );
    setShowAddModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAddModalDiver = () => {
    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
    if (!fullName) return;

    const newDiver: Diver = {
      id: createNextDiverId(),
      name: fullName,
      ecoId: undefined,
      isWalkIn: true,
      meta: `Walk-in · ${newDiveLevel} · ${newNationality}`,
    };

    setDivers((prev) =>
      prev.some(
        (d) => d.isWalkIn && d.name.trim().toLowerCase() === fullName.toLowerCase()
      )
        ? prev
        : [...prev, newDiver]
    );
    setShowAddModal(false);
    setNewFirstName("");
    setNewLastName("");
  };

  const handleRemoveDiver = (id: string) => {
    setDivers((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!dateValid) {
      setDateError("Enter a valid dive date (YYYY-MM-DD).");
      return;
    }
    if (!canSubmit) {
      setError("Please complete all required fields and add at least one diver.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      // Insert manifest (boat_contact / crew_count / instructor_name land
      // via 028 — the new UI collects them and they must not be dropped).
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
          boat_contact: boatContact.trim() || null,
          crew_count: crewCount.trim() ? Number(crewCount) : null,
          instructor_name: instructorName.trim() || null,
          max_divers: maxDiversNum,
          duty_of_care: true,
          dive_date: diveDate,
          status: "active",
        })
        .select("id")
        .single();

      if (mfError || !manifest) {
        setError(mfError ? `Failed to create manifest: ${mfError.message}` : "Failed to create manifest. Please try again.");
        setSaving(false);
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

      const { error: dvError } = await supabase
        .from("manifest_divers")
        .insert(diverInserts);

      if (dvError) {
        // manifest_divers cascades on manifest delete, so removing the
        // manifest rolls back the whole partial write.
        await supabase.from("dive_manifests").delete().eq("id", manifest.id);
        setError(`Failed to add divers: ${dvError.message}`);
        setSaving(false);
        return;
      }

      // Assign annual slots: holder rows anchored on the dive date with
      // 1-year validity (matches the 027 ledger exclusion).
      if (annualAssigned.length > 0) {
        const until = addOneYear(diveDate);
        const { error: holderError } = await supabase
          .from("annual_pass_holders")
          .insert(
            annualAssigned.map((touristId) => ({
              operator_id: user.id,
              tourist_id: touristId,
              valid_from: diveDate,
              valid_until: until,
            }))
          );
        if (holderError) {
          await supabase.from("dive_manifests").delete().eq("id", manifest.id);
          setError(`Failed to assign annual passes: ${holderError.message}`);
          setSaving(false);
          return;
        }
      }

      router.replace({
        pathname: "/establishment/create-manifest/confirmed",
        params: {
          manifestId: manifest.id,
          location,
          diverCount: divers.length,
          boatName: boatName.trim(),
          captainName: captainName.trim(),
          remainingBalance: Math.max(0, remainingPasses - passesNeeded),
        },
      });
    } catch (e) {
      console.error("Manifest submit failed:", e);
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
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
              label="Dive Date"
              placeholder="YYYY-MM-DD"
              value={diveDate}
              onChangeText={(v) => {
                setDiveDate(v);
                if (dateError) setDateError("");
              }}
              error={dateError || undefined}
            />
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
            {divers.length === 0 && (
              <Text style={styles.noDiversText}>
                No divers added yet. Tap + Add Diver to search registered tourists or encode a walk-in.
              </Text>
            )}
            {divers.map((d) => {
              const covered = isCovered(d);
              const assigned = isAssigned(d);
              const assignable = !!d.touristId && !d.isWalkIn && !covered;
              return (
                <View key={d.id} style={styles.diverCard}>
                  <View style={styles.diverAvatar}>
                    <Text style={styles.diverAvatarText}>{getInitials(d.name)}</Text>
                  </View>
                  <View style={styles.diverContent}>
                    <Text style={styles.diverCardName}>{d.name}</Text>
                    <Text style={styles.diverCardMeta}>
                      {d.meta || (d.ecoId ? `${d.ecoId} · Verified diver` : d.isWalkIn ? "Walk-in" : "No Eco-Dive ID on file")}
                    </Text>
                    <View style={styles.diverBadges}>
                      {covered && (
                        <View style={styles.annualBadge}>
                          <Text style={styles.annualText}>Annual ✓</Text>
                        </View>
                      )}
                      {assignable && (
                        <TouchableOpacity
                          style={[styles.assignBadge, assigned && styles.assignBadgeActive]}
                          onPress={() => toggleAnnual(d)}
                          disabled={!assigned && !canAssignMore}
                          activeOpacity={0.7}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: assigned, disabled: !assigned && !canAssignMore }}
                          accessibilityLabel={`Use annual pass for ${d.name}`}
                        >
                          <Text style={[styles.assignText, assigned && styles.assignTextActive]}>
                            {assigned ? "Annual ✓" : "Use annual"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>ACTIVE</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveDiver(d.id)}
                    style={{ padding: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${d.name}`}
                  >
                    <Ionicons name="close-circle" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Duty of Care Section */}
          <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
            <Text style={styles.sectionHeading}>Duty of Care</Text>
          </View>
          <TextInput
            placeholder="Instructor Name"
            value={instructorName}
            onChangeText={setInstructorName}
          />

          {/* Pass Deduction Alert Banner */}
          <View style={styles.deductionBanner}>
            <Text style={styles.deductionText}>
              {passesLoading
                ? "Checking your dive passes…"
                : `${passesNeeded} dive pass${passesNeeded === 1 ? "" : "es"} will be deducted. Remaining after submission: ${Math.max(0, remainingPasses - passesNeeded)} passes`}
            </Text>
            {annualSlots > 0 && !passesLoading && (
              <Text style={styles.deductionSub}>
                {annualSlots} annual slot{annualSlots === 1 ? "" : "s"} available
              </Text>
            )}
          </View>
          {passesError && (
            <View style={styles.passesErrorRow}>
              <Text style={styles.errorText}>Couldn&apos;t load your dive passes.</Text>
              <TouchableOpacity onPress={loadLedger} hitSlop={8}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {divers.length > 0 && !passesLoading && !passesError && !hasEnoughPasses && (
            <Text style={styles.insufficientText}>
              Not enough dive passes remaining ({remainingPasses}). You need {passesNeeded - remainingPasses} more.
            </Text>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.blueSubmitBtn, !canSubmit && styles.blueSubmitBtnDisabled]}
            activeOpacity={0.88}
            onPress={handleSubmit}
            disabled={!canSubmit}
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
            {searchError && (
              <Text style={styles.searchErrorText}>
                Search failed. Check your connection and try again.
              </Text>
            )}
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
  noDiversText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
    paddingVertical: 12,
  },
  diverBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  annualBadge: {
    borderRadius: 100,
    backgroundColor: "#DCFCE7",
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  annualText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  assignBadge: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  assignBadgeActive: {
    backgroundColor: colors.primaryBlue,
  },
  assignText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  assignTextActive: {
    color: colors.white,
  },
  deductionSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "#15803D",
    textAlign: "center",
    marginTop: 4,
  },
  passesErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  insufficientText: {
    fontSize: 13,
    color: colors.red,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
  },
  searchErrorText: {
    fontSize: 12,
    color: colors.red,
    marginTop: 8,
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
  blueSubmitBtnDisabled: {
    opacity: 0.5,
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
