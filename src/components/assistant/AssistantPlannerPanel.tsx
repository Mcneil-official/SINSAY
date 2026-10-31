import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { toLocalDateString } from "../../lib/diveDate";
import { generateDivePlan } from "../../lib/gemini";
import { supabase } from "../../lib/supabase";
import { Button } from "../Button";
import { Card } from "../Card";
import { Dropdown } from "../Dropdown";
import { MarkdownText } from "../MarkdownText";
import { TextInput } from "../TextInput";

const DEFAULT_DESTINATION = "Anilao, Mabini";

const EXPERIENCE_OPTIONS = [
  { label: "Beginner", value: "Beginner" },
  { label: "Open Water", value: "Open Water" },
  { label: "Advanced", value: "Advanced" },
  { label: "Professional", value: "Professional" },
];

const DURATION_OPTIONS = [
  { label: "Day trip", value: "day-trip", days: 1 },
  { label: "2–3 days", value: "2-3-days", days: 3 },
  { label: "4–5 days", value: "4-5-days", days: 5 },
  { label: "6+ days", value: "6-plus-days", days: 7 },
];

const stripMarkdown = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[•\-\*]\s+/gm, "  • ");

function parseItinerary(text: string): string[] {
  const days = text.split(/\*\*Day \d+\*\*|\nDay \d+/).filter(Boolean);
  return days.map((day) => day.trim());
}

export function AssistantPlannerPanel() {
  const { user } = useAuth();
  const [experienceLevel, setExperienceLevel] = useState("");
  const [tripDuration, setTripDuration] = useState("");
  const [activities, setActivities] = useState("");
  const [budget, setBudget] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [planError, setPlanError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!experienceLevel) errs.experienceLevel = "Required";
    if (!tripDuration) errs.tripDuration = "Required";
    if (!activities.trim()) errs.activities = "Enter preferred activities";
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
    setPlanError(false);
    setCopied(false);

    const durationEntry = DURATION_OPTIONS.find((d) => d.value === tripDuration);
    const offsetDays = durationEntry?.days ?? 2;
    const durationLabel = durationEntry?.label || tripDuration;

    const today = new Date();
    const endDt = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + offsetDays,
    );
    const startDate = toLocalDateString(today);
    const endDate = toLocalDateString(endDt);

    const geminiPromise = generateDivePlan({
      destination: DEFAULT_DESTINATION,
      startDate,
      endDate,
      divers: "1",
      diveType: `${experienceLevel} (${durationLabel})`,
      interests: activities.trim(),
      budget: budget.trim(),
    });

    const dbPromise = user
      ? supabase.from("dive_plan_inputs").insert({
          tourist_id: user.id,
          budget: budget.trim() || null,
          group_size: 1,
          preferred_activities: `${experienceLevel} - ${activities.trim()}`,
          length_of_stay: durationLabel,
        })
      : Promise.resolve();

    try {
      const [result] = await Promise.all([geminiPromise, dbPromise]);
      setPlan(result);
      setPlanError(false);
    } catch (e) {
      setPlan(
        e instanceof Error
          ? e.message
          : "Couldn't generate your dive plan. Check your connection and try again.",
      );
      setPlanError(true);
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (!plan || planError) return;
    await Clipboard.setStringAsync(stripMarkdown(plan));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartOver = () => {
    setExperienceLevel("");
    setTripDuration("");
    setActivities("");
    setBudget("");
    setPlan(null);
    setPlanError(false);
    setErrors({});
  };

  const days = plan && !planError ? parseItinerary(plan) : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.plannerCard}>
        <Text style={styles.plannerTitle}>QUICK TRIP PLANNER</Text>
        <Text style={styles.plannerSubtitle}>
          Destination: {DEFAULT_DESTINATION}
        </Text>

        <Dropdown
          label="Experience Level"
          placeholder="Select experience level"
          value={experienceLevel}
          options={EXPERIENCE_OPTIONS}
          onSelect={setExperienceLevel}
          error={errors.experienceLevel}
        />

        <Dropdown
          label="Trip Duration"
          placeholder="Select duration"
          value={tripDuration}
          options={DURATION_OPTIONS}
          onSelect={setTripDuration}
          error={errors.tripDuration}
        />

        <TextInput
          label="Preferred Activities"
          placeholder="e.g. Macro photography, reef dive, turtles"
          value={activities}
          onChangeText={setActivities}
          error={errors.activities}
        />

        <TextInput
          label="Budget (PHP)"
          placeholder="e.g. 5000"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          error={errors.budget}
        />
      </Card>

      <View style={styles.generateWrap}>
        <Button
          title={
            loading
              ? "Generating your dive plan…"
              : plan && !planError
                ? "Regenerate Plan"
                : "Generate Dive Plan"
          }
          onPress={handleGenerate}
          loading={loading}
          icon={<Ionicons name="map" size={18} color={colors.white} />}
        />
        {loading && (
          <Text style={styles.generatingHint}>
            AI is building your itinerary, this may take a few seconds.
          </Text>
        )}
      </View>

      {plan && planError && (
        <View style={styles.errorCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="alert-circle" size={20} color={colors.red} />
            <Text style={styles.resultTitle}>Something went wrong</Text>
          </View>
          <Text style={styles.resultText}>{plan}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleGenerate}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Retry generating dive plan"
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {plan && !planError && (
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.resultTitle}>Your Dive Plan</Text>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleCopy}
                accessibilityRole="button"
                accessibilityLabel={copied ? "Plan copied" : "Copy plan"}
              >
                <Ionicons
                  name={copied ? "checkmark" : "copy-outline"}
                  size={16}
                  color={copied ? colors.green : colors.primaryBlue}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleGenerate}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Regenerate plan"
              >
                <Ionicons
                  name="refresh"
                  size={16}
                  color={colors.primaryBlue}
                />
              </TouchableOpacity>
            </View>
          </View>
          {copied && (
            <Text style={styles.copiedNote}>Copied to clipboard ✓</Text>
          )}
          {days.length > 0 ? (
            <View style={styles.timeline}>
              {days.map((day, i) => (
                <View key={i} style={styles.timelineRow}>
                  <View style={styles.rail}>
                    <View style={styles.railDot}>
                      <Text style={styles.railDotText}>{i + 1}</Text>
                    </View>
                    {i < days.length - 1 && <View style={styles.railLine} />}
                  </View>
                  <View style={styles.dayCard}>
                    <MarkdownText
                      text={day}
                      color={colors.darkText}
                      fontSize={13}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <MarkdownText text={plan} color={colors.darkText} fontSize={13} />
          )}
          <TouchableOpacity
            onPress={handleStartOver}
            style={styles.startOver}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Start over with new details"
          >
            <Text style={styles.startOverText}>
              Start over with new details
            </Text>
          </TouchableOpacity>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 20,
  },
  plannerCard: {
    gap: 12,
  },
  plannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.darkText,
    letterSpacing: 0.5,
  },
  plannerSubtitle: {
    fontSize: 12,
    color: colors.gray,
    marginTop: -6,
  },
  generateWrap: {
    marginTop: 14,
  },
  generatingHint: {
    fontSize: 12,
    color: colors.gray,
    textAlign: "center",
    marginTop: 8,
  },
  errorCard: {
    marginTop: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 14,
  },
  retryBtn: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.red,
    paddingVertical: 10,
    alignItems: "center",
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.red,
  },
  resultCard: {
    marginTop: 16,
    padding: 14,
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
    flex: 1,
  },
  resultActions: {
    flexDirection: "row",
    gap: 4,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  copiedNote: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.green,
    marginBottom: 8,
  },
  resultText: {
    fontSize: 13,
    color: colors.darkText,
    lineHeight: 20,
  },
  dayCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
  },
  rail: {
    alignItems: "center",
    width: 28,
    paddingBottom: 8,
  },
  railDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  railDotText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.cardBorder,
    marginTop: 4,
    borderRadius: 1,
  },
  startOver: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  startOverText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryBlue,
  },
});
