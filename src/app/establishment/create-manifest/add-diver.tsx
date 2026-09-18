import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
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
import { Button, TextInput, Card, ContentContainer } from "../../../components";
import { supabase } from "../../../lib/supabase";

interface SearchResult {
  name: string;
  ecoId: string;
  verified: boolean;
  touristId: string;
}

export default function AddDiverScreen() {
  const router = useRouter();
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInContact, setWalkInContact] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError(false);
    try {
      const { data: tourists, error: tErr } = await supabase
        .from("tourists")
        .select("id, full_name")
        .ilike("full_name", `%${q}%`)
        .limit(10);
      if (tErr) throw tErr;

      const { data: ecoIds, error: eErr } = await supabase
        .from("eco_dive_ids")
        .select("tourist_id, eco_id_number, status")
        .ilike("eco_id_number", `%${q}%`)
        .limit(10);
      if (eErr) throw eErr;

      const merged: SearchResult[] = [];
      const added = new Set<string>();

      for (const t of tourists || []) {
        merged.push({ name: t.full_name, ecoId: "", verified: false, touristId: t.id });
        added.add(t.id);
      }

      // Batch-fetch names for eco-ID hits not already matched, instead of
      // one query per row (each of which could silently render "Unknown").
      const unmatched = (ecoIds || []).filter((e) => !added.has(e.tourist_id));
      const nameById = new Map<string, string>();
      if (unmatched.length > 0) {
        const { data: names, error: nErr } = await supabase
          .from("tourists")
          .select("id, full_name")
          .in("id", unmatched.map((e) => e.tourist_id));
        if (nErr) throw nErr;
        for (const n of names || []) nameById.set(n.id, n.full_name);
      }

      for (const e of ecoIds || []) {
        if (added.has(e.tourist_id)) {
          const existing = merged.find((r) => r.touristId === e.tourist_id);
          if (existing) {
            existing.ecoId = e.eco_id_number;
            existing.verified = e.status === "complete";
          }
        } else {
          merged.push({
            name: nameById.get(e.tourist_id) || "Unknown",
            ecoId: e.eco_id_number,
            verified: e.status === "complete",
            touristId: e.tourist_id,
          });
        }
      }
      setResults(merged);
    } catch (e) {
      console.warn("Diver search failed:", e);
      setResults([]);
      setSearchError(true);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  const handleSelectDiver = (diver: SearchResult) => {
    // Replace (not push): avoids stacking Step1 → AddDiver → Step1 …
    // The draft is echoed back so the in-progress form is preserved.
    router.replace({
      pathname: "/establishment/create-manifest/step1",
      params: {
        ...(draft ? { draft } : {}),
        addDiver: JSON.stringify({
          name: diver.name,
          ecoId: diver.ecoId,
          touristId: diver.touristId,
          isWalkIn: false,
        }),
      },
    });
  };

  const handleAddWalkIn = () => {
    if (!walkInName.trim()) return;
    router.replace({
      pathname: "/establishment/create-manifest/step1",
      params: {
        ...(draft ? { draft } : {}),
        addDiver: JSON.stringify({
          name: walkInName.trim(),
          ecoId: "",
          touristId: "",
          isWalkIn: true,
        }),
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Add Diver</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <Text style={styles.instructions}>
            Search for a registered diver by name or Eco-Diver ID, or add a walk-in diver.
          </Text>

        {/* Search */}
        <TextInput
          label="Search Diver"
          placeholder="Name or Eco-Diver ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Ionicons name="search" size={18} color={colors.gray} />}
        />

        {/* Search results */}
        {searching && <ActivityIndicator size="small" color={colors.primaryBlue} style={{ marginTop: 12 }} />}
        {results.length > 0 && (
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionLabelText}>Registered Divers</Text>
          </View>
        )}
        {searchError && searchQuery.length >= 2 && !searching && (
          <Text style={styles.searchErrorText}>Search failed. Check your connection and try again.</Text>
        )}
        {results.length === 0 && searchQuery.length >= 2 && !searching && !searchError && (
          <Text style={styles.noResultsText}>No results for '{searchQuery}'. Try a different name or add a walk-in.</Text>
        )}
        <View style={{ gap: 6, marginTop: 4 }}>
          {results.map((d, i) => (
            <TouchableOpacity key={i} style={styles.diverRow} onPress={() => handleSelectDiver(d)} activeOpacity={0.7}>
              <Ionicons name="person-circle-outline" size={28} color={colors.primaryBlue} />
              <View style={styles.diverInfo}>
                <View style={styles.diverNameRow}>
                  <Text style={styles.diverName}>{d.name}</Text>
                  {d.verified && <Ionicons name="checkmark-circle" size={14} color="#16A34A" />}
                </View>
                {d.ecoId ? <Text style={styles.diverEcoId}>{d.ecoId}</Text> : <Text style={styles.diverEcoId}>No Eco-Dive ID</Text>}
              </View>
              <Ionicons name="add-circle" size={22} color={colors.primaryBlue} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Walk-in toggle */}
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            style={styles.walkInToggle}
            onPress={() => setShowWalkInForm(!showWalkInForm)}
            activeOpacity={0.7}
          >
            <View style={styles.walkInToggleLeft}>
              <Ionicons name="person-add-outline" size={20} color={colors.primaryBlue} />
              <Text style={styles.walkInToggleText}>Add Walk-in Diver</Text>
            </View>
            <Ionicons name={showWalkInForm ? "chevron-up" : "chevron-down"} size={18} color={colors.gray} />
          </TouchableOpacity>
        </View>

        {showWalkInForm && (
          <Card style={styles.walkInForm}>
            <TextInput
              label="Full Name"
              placeholder="Enter full name"
              value={walkInName}
              onChangeText={setWalkInName}
            />
            <View style={{ height: 12 }} />
            <TextInput
              label="Contact Number"
              placeholder="+63 9XX XXX XXXX"
              value={walkInContact}
              onChangeText={setWalkInContact}
              keyboardType="phone-pad"
            />
            <View style={styles.walkInActions}>
              <View style={{ flex: 1 }}>
                <Button title="Cancel" variant="outline" onPress={() => setShowWalkInForm(false)} />
              </View>
              <View style={{ width: 10 }} />
              <View style={{ flex: 1 }}>
                <Button title="Add Diver" onPress={handleAddWalkIn} disabled={!walkInName.trim()} />
              </View>
            </View>
          </Card>
        )}

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
  instructions: { fontSize: 13, color: colors.gray, lineHeight: 18, marginBottom: 16 },
  sectionLabel: { marginTop: 16 },
  sectionLabelText: { fontSize: 13, fontWeight: "600", color: colors.gray, textTransform: "uppercase", letterSpacing: 0.5 },
  noResultsText: { fontSize: 13, color: colors.gray, textAlign: "center", marginTop: 16 },
  searchErrorText: { fontSize: 13, color: colors.red, textAlign: "center", marginTop: 16 },
  diverRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white,
    borderRadius: 12, padding: 12, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  diverInfo: { flex: 1 },
  diverNameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  diverName: { fontSize: 14, fontWeight: "600", color: colors.darkText },
  diverEcoId: { fontSize: 11, color: colors.gray, marginTop: 2 },
  walkInToggle: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16,
    backgroundColor: "#EBF2FF", borderRadius: 12,
  },
  walkInToggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  walkInToggleText: { fontSize: 14, fontWeight: "600", color: colors.primaryBlue },
  walkInForm: { padding: 16, marginTop: 12, gap: 0 },
  walkInActions: { flexDirection: "row", marginTop: 20 },
});
