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
import { Button, TextInput, Dropdown, Card, ContentContainer } from "../../../components";
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

// Local (not UTC) YYYY-MM-DD — toISOString() is UTC and shows the wrong day
// in Asia/Manila between 00:00 and 08:00.
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

export default function CreateManifestStep1() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ addDiver?: string; draft?: string }>();
  // Draft echoed back from add-diver so the in-progress form survives the
  // add-diver loop (each return mounts a fresh step1 instance).
  const [initialDraft] = useState(() => {
    try {
      return params.draft ? (JSON.parse(params.draft) as Partial<Record<string, any>>) : {};
    } catch {
      return {};
    }
  });
  const [diveType, setDiveType] = useState((initialDraft.diveType as string) ?? "");
  const [diveMode, setDiveMode] = useState((initialDraft.diveMode as string) ?? "");
  const [location, setLocation] = useState((initialDraft.location as string) ?? "");
  const [difficulty, setDifficulty] = useState((initialDraft.difficulty as string) ?? "");
  const [boatName, setBoatName] = useState((initialDraft.boatName as string) ?? "");
  const [captainName, setCaptainName] = useState((initialDraft.captainName as string) ?? "");
  const [maxDivers, setMaxDivers] = useState((initialDraft.maxDivers as string) ?? "16");
  const [dutyOfCare, setDutyOfCare] = useState((initialDraft.dutyOfCare as boolean) ?? false);
  const [diveDate, setDiveDate] = useState(
    (initialDraft.diveDate as string) ?? todayLocal()
  );
  const [divers, setDivers] = useState<Diver[]>(() =>
    Array.isArray(initialDraft.divers) ? (initialDraft.divers as Diver[]) : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dateError, setDateError] = useState("");
  const [remainingPasses, setRemainingPasses] = useState(0);
  const [annualSlots, setAnnualSlots] = useState(0);
  // touristIds covered by a valid annual pass for the current dive date.
  const [annualCovered, setAnnualCovered] = useState<Set<string>>(new Set());
  // touristIds the operator chose to cover with an annual slot on submit.
  const [annualAssigned, setAnnualAssigned] = useState<string[]>([]);
  const [passesLoading, setPassesLoading] = useState(true);
  const [passesError, setPassesError] = useState(false);

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
        // simply lacks them and ?? 0 degrades gracefully instead of erroring.
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

  useEffect(() => {
    if (params.addDiver) {
      try {
        const diver = JSON.parse(params.addDiver);
        setDivers((prev) => {
          // Dedupe: back/forward navigation over the same route object must
          // not re-append, and the same tourist can't be added twice.
          const name = (diver.name || "").trim();
          if (!name) return prev;
          if (diver.touristId && prev.some((d) => d.touristId === diver.touristId)) return prev;
          if (
            !diver.touristId &&
            prev.some((d) => d.isWalkIn && d.name.trim().toLowerCase() === name.toLowerCase())
          )
            return prev;
          diverCounter += 1;
          return [
            ...prev,
            {
              id: `diver-${Date.now()}-${diverCounter}`,
              name,
              ecoId: diver.ecoId || undefined,
              touristId: diver.touristId || undefined,
              isWalkIn: diver.isWalkIn || false,
            },
          ];
        });
      } catch (e) {
        // ignore invalid JSON
      }
    }
  }, [params.addDiver]);

  // Annual coverage: registered divers holding a valid annual pass for the
  // dive date don't consume one-day passes (ledger excludes them server-side
  // in 027). Pre-027 the table is missing → catch → all uncovered, and the
  // one-day logic below behaves exactly as before.
  useEffect(() => {
    const ids = [...new Set(divers.filter((d) => d.touristId).map((d) => d.touristId as string))];
    // Drop assignments for divers no longer listed or newly covered.
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
  const canSubmit =
    diveType && diveMode && location && difficulty && boatName && captainName.trim() && divers.length > 0
    && divers.length <= Number(maxDivers) && hasEnoughPasses && dutyOfCare && dateValid && !saving;

  // Serialized draft echoed through add-diver and back, so the form
  // survives the add-diver loop (each return mounts a fresh instance).
  const draftParams = JSON.stringify({
    diveType,
    diveMode,
    location,
    difficulty,
    boatName,
    captainName,
    maxDivers,
    dutyOfCare,
    diveDate,
    divers,
  });

  const handleSubmit = async () => {
    if (!dateValid) {
      setDateError("Enter a valid date (YYYY-MM-DD).");
      return;
    }
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
        // Roll back the orphan manifest so a partial write doesn't pollute
        // the dashboard / recent lists.
        await supabase.from("dive_manifests").delete().eq("id", manifest.id);
        setError("Failed to add divers. Please try again.");
        setSaving(false);
        return;
      }

      // 3. Assign annual slots chosen on this screen: holder rows anchored on
      // the dive date with 1-year validity (matches the 027 ledger exclusion).
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
          // Roll back the whole manifest: divers + manifest.
          await supabase.from("manifest_divers").delete().eq("manifest_id", manifest.id);
          await supabase.from("dive_manifests").delete().eq("id", manifest.id);
          setError(`Failed to assign annual passes: ${holderError.message}`);
          setSaving(false);
          return;
        }
      }

      // 4. Navigate to confirmed with data
      router.replace({
        pathname: "/establishment/create-manifest/confirmed",
        params: {
          manifestId: manifest.id,
          location,
          diverCount: divers.length,
          boatName: boatName.trim(),
          captainName: captainName.trim(),
          remainingBalance: remainingPasses - passesNeeded,
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
        <ContentContainer maxWidth={720}>
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
            onChangeText={(v) => {
              setDiveDate(v);
              if (dateError) setDateError("");
            }}
            error={dateError || undefined}
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
            onPress={() =>
              router.push({
                pathname: "/establishment/create-manifest/add-diver",
                params: { draft: draftParams },
              })
            }
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
            {divers.map((d) => {
              const covered = isCovered(d);
              const assigned = isAssigned(d);
              const assignable = !!d.touristId && !d.isWalkIn && !covered;
              return (
                <View key={d.id} style={styles.diverRow}>
                  <Ionicons name="person-circle" size={24} color={colors.primaryBlue} />
                  <Text style={styles.diverName}>{d.name}</Text>
                  {d.isWalkIn && (
                    <View style={styles.walkInBadge}>
                      <Text style={styles.walkInText}>Walk-in</Text>
                    </View>
                  )}
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
              );
            })}
          </View>
        )}

        {/* Diver count + pass check */}
        <View style={styles.diverCountRow}>
          <Text style={divers.length > Number(maxDivers) ? styles.errorText : styles.diverCountText}>
            {divers.length} / {maxDivers || "?"} divers
          </Text>
          <Text style={styles.passCountText}>
            {passesLoading
              ? "Checking passes…"
              : `Passes: ${remainingPasses} remaining${annualSlots > 0 ? ` · ${annualSlots} annual slot${annualSlots === 1 ? "" : "s"}` : ""}`}
          </Text>
        </View>
        {passesError && (
          <View style={styles.passesErrorRow}>
            <Text style={styles.errorText}>Couldn&apos;t load your dive passes.</Text>
            <TouchableOpacity onPress={loadLedger} hitSlop={8}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {divers.length > 0 && !hasEnoughPasses && (
          <Text style={styles.insufficientText}>
            Not enough dive passes remaining ({remainingPasses}). You need {passesNeeded - remainingPasses} more.
          </Text>
        )}

        {/* Duty of Care */}
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setDutyOfCare(!dutyOfCare)} activeOpacity={0.7}>
          <Ionicons name={dutyOfCare ? "checkbox" : "square-outline"} size={20} color={dutyOfCare ? colors.primaryBlue : colors.gray} />
          <Text style={styles.checkboxLabel}>
            I confirm that all divers listed have signed the Duty of Care waiver and are fit to dive.
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title={saving ? "Submitting..." : "Submit Manifest"} onPress={handleSubmit} disabled={!canSubmit} />

        <View style={{ height: 60 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
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
  annualBadge: { borderRadius: 100, backgroundColor: "#DCFCE7", paddingVertical: 2, paddingHorizontal: 8 },
  annualText: { fontSize: 10, fontWeight: "600", color: "#15803D" },
  assignBadge: { borderRadius: 100, borderWidth: 1, borderColor: colors.primaryBlue, paddingVertical: 2, paddingHorizontal: 8 },
  assignBadgeActive: { backgroundColor: colors.primaryBlue },
  assignText: { fontSize: 10, fontWeight: "600", color: colors.primaryBlue },
  assignTextActive: { color: colors.white },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 8, marginBottom: 24 },
  checkboxLabel: { flex: 1, fontSize: 12, color: colors.gray, lineHeight: 18 },
  diverCountRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginTop: 8, marginBottom: 4,
  },
  diverCountText: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  passCountText: { fontSize: 12, color: colors.gray },
  passesErrorRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 },
  retryText: { fontSize: 13, fontWeight: "600", color: colors.primaryBlue },
  insufficientText: {
    fontSize: 13, color: colors.red, textAlign: "center", marginBottom: 12, lineHeight: 18,
  },
  errorText: { fontSize: 13, color: colors.red, textAlign: "center", marginBottom: 12 },
});
