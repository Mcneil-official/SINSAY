import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, TextInput, Dropdown, Card, ContentContainer } from "../../../components";
import { generateDivePlan } from "../../../lib/gemini";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

const diveTypeOptions = [
  { label: "Fun Dive (Relaxed)", value: "fun-dive" },
  { label: "Introductory Dive", value: "intro" },
  { label: "Certified Dive", value: "certified" },
  { label: "Night Dive", value: "night" },
  { label: "Deep Dive", value: "deep" },
];

function parseItinerary(text: string): string[] {
  const days = text.split(/\*\*Day \d+\*\*|\nDay \d+/).filter(Boolean);
  return days.map((day) => day.trim());
}

export default function PlannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [divers, setDivers] = useState("");
  const [diveType, setDiveType] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!destination.trim()) errs.destination = "Required";
    if (!startDate.trim()) errs.startDate = "Required";
    if (!endDate.trim()) errs.endDate = "Required";
    if (startDate.trim() && endDate.trim()) {
      if (new Date(endDate) <= new Date(startDate)) {
        errs.endDate = "End date must be after start date";
      }
    }
    if (!divers.trim() || isNaN(Number(divers)) || Number(divers) < 1) {
      errs.divers = "Must be a positive number";
    }
    if (!diveType) errs.diveType = "Required";
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) < 1) {
      errs.budget = "Enter a valid budget";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setLoading(true);
    setPlan(null);

    const lengthOfStay = startDate.trim() && endDate.trim()
      ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
      : null;

    const geminiPromise = generateDivePlan({
      destination: destination.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      divers: divers.trim(),
      diveType: diveTypeOptions.find((o) => o.value === diveType)?.label || diveType,
      interests: interests.trim(),
    });

    const dbPromise = user
      ? supabase.from("dive_plan_inputs").insert({
          tourist_id: user.id,
          budget: budget.trim() || null,
          group_size: Number(divers) || null,
          preferred_activities: diveTypeOptions.find((o) => o.value === diveType)?.label || diveType,
          length_of_stay: lengthOfStay,
        })
      : Promise.resolve();

    try {
      const [result] = await Promise.all([geminiPromise, dbPromise]);
      setPlan(result);
    } catch {
      setPlan("An error occurred while generating your dive plan. Please try again.");
    }
    setLoading(false);
  };

  const days = plan ? parseItinerary(plan) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SINSAY AI</Text>
          <Text style={styles.headerSubtitle}>Dive Assistant</Text>
        </View>
        <TouchableOpacity
          style={styles.askPill}
          onPress={() => router.push("/dive-assistant/chat")}
        >
          <Text style={styles.askPillText}>Ask Questions</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer maxWidth={720}>
          {/* Trip Planner Card */}
          <Card style={styles.plannerCard}>
          <Text style={styles.plannerTitle}>DIVE TRIP PLANNER</Text>

          <TextInput
            label="Destination / Dive Site"
            placeholder="e.g. Anilao, Mainit, Sombrero"
            value={destination}
            onChangeText={setDestination}
            error={errors.destination}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <TextInput
                label="Start Date"
                placeholder="mm/dd/yyyy"
                value={startDate}
                onChangeText={setStartDate}
                error={errors.startDate}
                rightIcon={<Ionicons name="calendar-outline" size={16} color={colors.gray} />}
              />
            </View>
            <View style={styles.half}>
              <TextInput
                label="End Date"
                placeholder="mm/dd/yyyy"
                value={endDate}
                onChangeText={setEndDate}
                error={errors.endDate}
                rightIcon={<Ionicons name="calendar-outline" size={16} color={colors.gray} />}
              />
            </View>
          </View>

          <TextInput
            label="Number of Divers"
            placeholder="e.g. 2"
            value={divers}
            onChangeText={setDivers}
            keyboardType="numeric"
            error={errors.divers}
          />

          <Dropdown
            label="Preferred Dive Type"
            placeholder="Select"
            value={diveType}
            options={diveTypeOptions}
            onSelect={setDiveType}
            error={errors.diveType}
          />

          <TextInput
            label="Budget (PHP)"
            placeholder="e.g. 5000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            error={errors.budget}
          />

          <TextInput
            label="Special Interests (optional)"
            placeholder="e.g. Macro photography, Wrecks, Marine life"
            value={interests}
            onChangeText={setInterests}
          />
        </Card>

        {/* Generate Button */}
        <View style={styles.generateWrap}>
          <Button
            title={loading ? "Generating your dive plan…" : "Generate Trip Plan"}
            onPress={handleGenerate}
            loading={loading}
            icon={<Ionicons name="map" size={18} color={colors.white} />}
          />
          {loading && (
            <Text style={styles.generatingHint}>AI is building your itinerary, this may take a few seconds.</Text>
          )}
        </View>

        {/* Results */}
        {plan && days.length > 0 && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={styles.resultTitle}>Your Dive Plan</Text>
            </View>
            {days.map((day, i) => (
              <View key={i} style={styles.dayCard}>
                <Text style={styles.dayTitle}>Day {i + 1}</Text>
                <Text style={styles.dayText}>{day}</Text>
              </View>
            ))}
          </Card>
        )}
        {plan && days.length === 0 && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={styles.resultTitle}>Your Dive Plan</Text>
            </View>
            <Text style={styles.resultText}>{plan}</Text>
          </Card>
        )}

        <View style={{ height: 120 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.darkText,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.gray,
  },
  askPill: {
    borderRadius: 100,
    backgroundColor: colors.primaryBlue,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  askPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.white,
  },
  plannerCard: {
    marginTop: 12,
    gap: 16,
  },
  plannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.darkText,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  half: {
    flex: 1,
  },
  generateWrap: {
    marginTop: 20,
  },
  generatingHint: {
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  resultCard: {
    marginTop: 20,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    padding: 16,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.darkText,
  },
  resultText: {
    fontSize: 13,
    color: colors.darkText,
    lineHeight: 20,
  },
  dayCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 6,
  },
  dayText: {
    fontSize: 13,
    color: colors.darkText,
    lineHeight: 20,
  },
});
