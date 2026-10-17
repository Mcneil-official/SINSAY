import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { push } from "expo-router/build/global-state/router";
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
import {
  Button,
  Card,
  ContentContainer,
  DateField,
  Dropdown,
  MarkdownText,
  TextInput,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { shareText } from "../../../lib/snapshot";
import { toLocalDateString } from "../../../lib/diveDate";
import { generateDivePlan } from "../../../lib/gemini";
import { supabase } from "../../../lib/supabase";

const diveTypeOptions = [
  { label: "Fun Dive (Relaxed)", value: "fun-dive" },
  { label: "Introductory Dive", value: "intro" },
  { label: "Certified Dive", value: "certified" },
  { label: "Night Dive", value: "night" },
  { label: "Deep Dive", value: "deep" },
];

// Strict YYYY-MM-DD calendar check (matches lib/diveDate + step1): rejects
// locale-ambiguous "13/40/2026"-style input that new Date() would silently
// mangle or pass through as Invalid Date.
const isValidDate = (s: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mo - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d
  );
};

const stripMarkdown = (s: string) =>
  s
    .replace(/\*\*/g, "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[•\-\*]\s+/gm, "  • ");

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
  const [planError, setPlanError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharedNote, setSharedNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    // Past dates are unplannable: trips start today at the earliest. The
    // calendar also greys them out via min= (web), this is the backstop for
    // typed entry (and native, where DateField is a text field).
    const todayStr = toLocalDateString(new Date());
    if (!startDate.trim()) errs.startDate = "Use YYYY-MM-DD";
    else if (!isValidDate(startDate))
      errs.startDate = "Enter a real date (YYYY-MM-DD)";
    else if (startDate.trim() < todayStr)
      errs.startDate = "Start date can't be in the past";
    if (!endDate.trim()) errs.endDate = "Use YYYY-MM-DD";
    else if (!isValidDate(endDate))
      errs.endDate = "Enter a real date (YYYY-MM-DD)";
    else if (endDate.trim() < todayStr)
      errs.endDate = "End date can't be in the past";
    if (
      isValidDate(startDate) &&
      isValidDate(endDate) &&
      endDate.trim() <= startDate.trim()
    ) {
      errs.endDate = "End date must be after start date";
    }
    if (!divers.trim() || !/^\d+$/.test(divers.trim()) || Number(divers) < 1) {
      errs.divers = "Whole number, at least 1";
    }
    if (!diveType) errs.diveType = "Required";
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) < 1) {
      errs.budget = "Enter a valid budget";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const runGenerate = async () => {
    setLoading(true);
    setPlan(null);
    setPlanError(false);
    setCopied(false);

    const [sy, sm, sd] = startDate.trim().split("-").map(Number);
    const [ey, em, ed] = endDate.trim().split("-").map(Number);
    const nights = Math.round(
      (new Date(ey, em - 1, ed).getTime() -
        new Date(sy, sm - 1, sd).getTime()) /
        86400000,
    );
    const lengthOfStay = `${nights} day${nights === 1 ? "" : "s"}`;
    const diveLabel =
      diveTypeOptions.find((o) => o.value === diveType)?.label || diveType;

    const geminiPromise = generateDivePlan({
      destination: destination.trim(),
      startDate: startDate.trim(),
      endDate: endDate.trim(),
      divers: divers.trim(),
      diveType: diveLabel,
      interests: interests.trim(),
      budget: budget.trim(),
    });

    const dbPromise = user
      ? supabase.from("dive_plan_inputs").insert({
          tourist_id: user.id,
          budget: budget.trim() || null,
          group_size: Number(divers) || null,
          preferred_activities: diveLabel,
          length_of_stay: lengthOfStay,
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

  const handleGenerate = async () => {
    if (!validate()) return;
    await runGenerate();
  };

  const handleCopy = async () => {
    if (!plan || planError) return;
    await Clipboard.setStringAsync(stripMarkdown(plan));
    setCopied(true);
    setSharedNote("");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!plan || planError) return;
    const result = await shareText(
      `Dive plan: ${destination.trim()}`,
      stripMarkdown(plan)
    );
    setCopied(false);
    setSharedNote(
      result === "shared"
        ? "Plan shared."
        : result === "copied"
          ? "Sharing unavailable — copied to clipboard ✓"
          : "Sharing unavailable on this device."
    );
  };

  const handleStartOver = () => {
    setDestination("");
    setStartDate("");
    setEndDate("");
    setDivers("");
    setDiveType("");
    setBudget("");
    setInterests("");
    setPlan(null);
    setPlanError(false);
    setErrors({});
  };

  const days = plan && !planError ? parseItinerary(plan) : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => push("/dive-assistant")}
          style={styles.headerBack}
        >
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
                <DateField
                  label="Start Date"
                  value={startDate}
                  onChangeText={setStartDate}
                  error={errors.startDate}
                  min={toLocalDateString(new Date())}
                />
              </View>
              <View style={styles.half}>
                <DateField
                  label="End Date"
                  value={endDate}
                  onChangeText={setEndDate}
                  error={errors.endDate}
                  min={
                    isValidDate(startDate)
                      ? startDate.trim()
                      : toLocalDateString(new Date())
                  }
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
              title={
                loading
                  ? "Generating your dive plan…"
                  : plan && !planError
                    ? "Regenerate Plan"
                    : "Generate Trip Plan"
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

          {/* Error state — never dressed as a successful plan */}
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
              >
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Results — app card language (white surface, blue accents);
              the old mint-green panel was the only off-palette surface. */}
          {plan && !planError && days.length > 0 && (
            <Card style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.green}
                />
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
                    onPress={handleShare}
                    accessibilityRole="button"
                    accessibilityLabel="Share plan"
                  >
                    <Ionicons
                      name="share-outline"
                      size={16}
                      color={colors.primaryBlue}
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
              {sharedNote ? (
                <Text style={styles.copiedNote}>{sharedNote}</Text>
              ) : null}
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
              <TouchableOpacity
                onPress={handleStartOver}
                style={styles.startOver}
                activeOpacity={0.8}
              >
                <Text style={styles.startOverText}>
                  Start over with new details
                </Text>
              </TouchableOpacity>
            </Card>
          )}
          {plan && !planError && days.length === 0 && (
            <Card style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.green}
                />
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
                    onPress={handleShare}
                    accessibilityRole="button"
                    accessibilityLabel="Share plan"
                  >
                    <Ionicons
                      name="share-outline"
                      size={16}
                      color={colors.primaryBlue}
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
              {sharedNote ? (
                <Text style={styles.copiedNote}>{sharedNote}</Text>
              ) : null}
              <MarkdownText text={plan} color={colors.darkText} fontSize={13} />
              <TouchableOpacity
                onPress={handleStartOver}
                style={styles.startOver}
                activeOpacity={0.8}
              >
                <Text style={styles.startOverText}>
                  Start over with new details
                </Text>
              </TouchableOpacity>
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
  errorCard: {
    marginTop: 20,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 16,
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
    marginTop: 20,
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
