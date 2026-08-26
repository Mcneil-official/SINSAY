import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { Button, TextInput, Card } from "../../../components";
import { supabase } from "../../../lib/supabase";

interface SearchResult {
  name: string;
  ecoId: string;
  verified: boolean;
  touristId: string;
}

export default function AddDiverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInContact, setWalkInContact] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data: tourists } = await supabase
        .from("tourists")
        .select("id, full_name")
        .ilike("full_name", `%${q}%`)
        .limit(10);

      const { data: ecoIds } = await supabase
        .from("eco_dive_ids")
        .select("tourist_id, eco_id_number, status")
        .ilike("eco_id_number", `%${q}%`)
        .limit(10);

      const merged: SearchResult[] = [];
      const added = new Set<string>();

      for (const t of tourists || []) {
        merged.push({ name: t.full_name, ecoId: "", verified: false, touristId: t.id });
        added.add(t.id);
      }

      for (const e of ecoIds || []) {
        if (added.has(e.tourist_id)) {
          const existing = merged.find((r) => r.touristId === e.tourist_id);
          if (existing) {
            existing.ecoId = e.eco_id_number;
            existing.verified = e.status === "complete";
          }
        } else {
          const { data: tData } = await supabase
            .from("tourists")
            .select("full_name")
            .eq("id", e.tourist_id)
            .single();
          merged.push({
            name: tData?.full_name || "Unknown",
            ecoId: e.eco_id_number,
            verified: e.status === "complete",
            touristId: e.tourist_id,
          });
        }
      }
      setResults(merged);
    } catch (e) {
      setResults([]);
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  const handleSelectDiver = (diver: SearchResult) => {
    router.push({
      pathname: "/establishment/create-manifest/step1",
      params: {
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
    router.push({
      pathname: "/establishment/create-manifest/step1",
      params: {
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
        {results.length === 0 && searchQuery.length >= 2 && !searching && (
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
              <Button title="Cancel" variant="outline" onPress={() => setShowWalkInForm(false)} />
              <View style={{ width: 10 }} />
              <Button title="Add Diver" onPress={handleAddWalkIn} disabled={!walkInName.trim()} />
            </View>
          </Card>
        )}

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
  instructions: { fontSize: 13, color: colors.gray, lineHeight: 18, marginBottom: 16 },
  sectionLabel: { marginTop: 16 },
  sectionLabelText: { fontSize: 13, fontWeight: "600", color: colors.gray, textTransform: "uppercase", letterSpacing: 0.5 },
  noResultsText: { fontSize: 13, color: colors.gray, textAlign: "center", marginTop: 16 },
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
