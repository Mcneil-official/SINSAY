import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput as NativeInput,
} from "react-native";
import { colors } from "../../../constants/colors";
import { ContentContainer, TextInput, Dropdown } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";
import { supabase } from "../../../lib/supabase";

// Standalone add-diver route (deep-linkable). The primary entry remains the
// + Add Diver modal in step1.tsx; this screen reuses the same search +
// walk-in encode and returns via router.back() so step1 dedupes by
// touristId / walk-in name. Exists so AGENTS.md and any .../add-diver link
// never 404.
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

export default function AddDiverScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationality, setNationality] = useState("Filipino");
  const [diveLevel, setDiveLevel] = useState("Fun Dive");
  const [notice, setNotice] = useState("");

  if (!authLoading && !user) {
    router.replace("/loginpage");
  }

  const searchTourists = async (text: string) => {
    setSearchQuery(text);
    setSearchError(false);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Name contains-match + exact Eco-Dive ID match (parity with step1).
      const trimmed = text.trim();
      const [nameRes, ecoRes] = await Promise.all([
        supabase
          .from("tourists")
          .select("id, full_name")
          .ilike("full_name", `%${trimmed}%`)
          .limit(5),
        trimmed.length >= 6
          ? supabase
              .from("eco_dive_ids")
              .select("tourist_id, eco_id_number")
              .ilike("eco_id_number", trimmed)
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);
      if (nameRes.error) throw nameRes.error;
      if (ecoRes.error) throw ecoRes.error;
      const rows = [...(nameRes.data || [])] as { id: string; full_name: string; _ecoMatch?: boolean }[];
      const eco = (ecoRes as { data?: { tourist_id: string } | null }).data;
      if (eco && !rows.some((r) => r.id === eco.tourist_id)) {
        const { data: holder, error: holderErr } = await supabase
          .from("tourists")
          .select("id, full_name")
          .eq("id", eco.tourist_id)
          .maybeSingle();
        if (holderErr) throw holderErr;
        if (holder) rows.unshift({ ...holder, _ecoMatch: true });
      }
      setSearchResults(rows);
    } catch {
      setSearchResults([]);
      setSearchError(true);
    }
    setSearching(false);
  };

  const pickTourist = async (tourist: { id: string; full_name: string }) => {
    let ecoId: string | undefined;
    try {
      const { data } = await supabase
        .from("eco_dive_ids")
        .select("eco_id_number")
        .eq("tourist_id", tourist.id)
        .limit(1)
        .maybeSingle();
      ecoId = data?.eco_id_number ?? undefined;
    } catch {
      ecoId = undefined;
    }
    setNotice(
      ecoId
        ? `${tourist.full_name} (${ecoId}) selected — go back to add them to the manifest.`
        : `${tourist.full_name} selected — no Eco-Dive ID on file. Go back to add them.`,
    );
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Add Diver</Text>
          <Text style={styles.sub}>Search existing tourist or encode walk-in</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <ContentContainer maxWidth={540}>
          <Text style={styles.fieldTitle}>Search Tourist (Name or exact Eco-Dive ID)</Text>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <NativeInput
              style={styles.searchInput}
              placeholder="Name or full Eco-Dive ID (e.g. ECO-2026-…)"
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={searchTourists}
              autoCapitalize="characters"
            />
            {searching && <ActivityIndicator size="small" color={colors.primaryBlue} />}
          </View>
          {searchError && <Text style={styles.err}>Search failed. Check your connection and try again.</Text>}
          {searchResults.map((item: { id: string; full_name: string; _ecoMatch?: boolean }) => (
            <TouchableOpacity key={item.id} style={styles.result} onPress={() => pickTourist(item)}>
              <Ionicons name="person" size={16} color={colors.primaryBlue} />
              <Text style={styles.resultName}>{item.full_name}</Text>
              {item._ecoMatch && <Text style={styles.ecoBadge}>Eco-ID ✓</Text>}
            </TouchableOpacity>
          ))}
          <Text style={styles.orLabel}>No result? Encode a walk-in below, then go back.</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput label="First Name" placeholder="Juan" value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput label="Last Name" placeholder="Dela Cruz" value={lastName} onChangeText={setLastName} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Dropdown label="Nationality" value={nationality} options={nationalities} onSelect={setNationality} />
            </View>
            <View style={{ flex: 1 }}>
              <Dropdown label="Dive Level" value={diveLevel} options={diveLevels} onSelect={setDiveLevel} />
            </View>
          </View>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
          <TouchableOpacity style={styles.backCta} onPress={() => router.back()} activeOpacity={0.88}>
            <Text style={styles.backCtaText}>Back to Manifest</Text>
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFC" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  backBtn: { paddingRight: 8 },
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  sub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  body: { paddingTop: 12, paddingBottom: 24, paddingHorizontal: 16 },
  fieldTitle: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 },
  searchWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 10, paddingHorizontal: 12, height: 44, backgroundColor: colors.white, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#0F172A" },
  err: { fontSize: 12, color: colors.red, marginTop: 8 },
  result: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 10, backgroundColor: colors.white, marginTop: 6 },
  resultName: { fontSize: 13, fontWeight: "600", color: "#0F172A" },
  ecoBadge: { fontSize: 10, fontWeight: "700", color: "#15803D", backgroundColor: "#DCFCE7", borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, marginLeft: "auto" },
  orLabel: { fontSize: 12, color: "#64748B", marginVertical: 10 },
  row: { flexDirection: "row", gap: 12, marginBottom: 4 },
  notice: { fontSize: 13, color: "#15803D", marginTop: 10, lineHeight: 18 },
  backCta: { marginTop: 18, backgroundColor: colors.primaryBlue, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center" },
  backCtaText: { fontSize: 15, fontWeight: "700", color: colors.white },
});
