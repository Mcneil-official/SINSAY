import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import {
  ACTIVITY_OPTIONS,
  LENGTH_OF_STAY_OPTIONS,
  generateDivePlan,
} from "../../lib/gemini";
import { resolvePlannerSites, PlannerSite } from "../../lib/plannerSites";
import { supabase } from "../../lib/supabase";
import { Button } from "../Button";
import { Card } from "../Card";
import { DidYouKnowLoader } from "../DidYouKnowLoader";
import { Dropdown } from "../Dropdown";
import { TextInput } from "../TextInput";
import { resolveSiteImage } from "../DiveSiteCard";

const DEFAULT_DESTINATION = "Anilao, Mabini";
const stripMarkdown = (s: string) =>
  s.replace(/\*\*/g, "").replace(/^#{1,3}\s+/gm, "").replace(/^[•\-\*]\s+/gm, "  • ");

type PlanActivity = {
  period: "Morning" | "Afternoon" | "Evening";
  time: string;
  title: string;
  details: string;
};

type StructuredPlan = {
  summary: {
    experienceLevel: string;
    duration: string;
    interest: string;
    overview: string;
  };
  days: { day: number; title: string; activities: PlanActivity[] }[];
  sites: PlannerSite[];
  ecoAlerts: string[];
  budgetBreakdown: { label: string; amount: number }[];
  budgetTotal: number;
};

function parsePlan(
  text: string,
  inputs: {
    budget: string;
    groupSize: string;
    activity: string;
    lengthOfStay: string;
  }
): StructuredPlan | null {
  try {
    const raw = JSON.parse(
      text.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim()
    ) as Partial<StructuredPlan>;
    if (!Array.isArray(raw.days) || !Array.isArray(raw.sites)) return null;
    return {
      summary: {
        experienceLevel: raw.summary?.experienceLevel || inputs.activity,
        duration: raw.summary?.duration || inputs.lengthOfStay,
        interest: raw.summary?.interest || inputs.activity,
        overview:
          raw.summary?.overview ||
          "A practical itinerary built around your preferences.",
      },
      days: raw.days.map((day, index) => ({
        day: Number(day.day) || index + 1,
        title: day.title || `Dive day ${index + 1}`,
        activities: (day.activities || []).map((activity) => ({
          period: activity.period || "Morning",
          time: activity.time || "Flexible",
          title: activity.title || "Dive activity",
          details:
            activity.details || "Confirm conditions with your dive operator.",
        })),
      })),
      sites: raw.sites.map((site) => ({
        id: "",
        name: site.name || "Local reef site",
        depth: site.depth || "Depth varies",
        difficulty: site.difficulty || "Intermediate",
        description:
          site.description || "Ask your operator about current conditions.",
        imageUrl: null,
        photoUrl: null,
        location: null,
      })),
      ecoAlerts: raw.ecoAlerts?.length
        ? raw.ecoAlerts
        : ["Keep buoyancy neutral and never touch marine life."],
      budgetBreakdown: raw.budgetBreakdown || [],
      budgetTotal: Number(raw.budgetTotal) || Number(inputs.budget) || 0,
    };
  } catch {
    return null;
  }
}

function fallbackPlan(inputs: {
  budget: string;
  groupSize: string;
  activity: string;
  lengthOfStay: string;
}): StructuredPlan {
  const total = Number(inputs.budget) || 0;
  const stayDays =
    LENGTH_OF_STAY_OPTIONS.find(
      (o) => o.value === inputs.lengthOfStay || o.label === inputs.lengthOfStay
    )?.days || 1;

  const days: { day: number; title: string; activities: PlanActivity[] }[] = [];
  for (let d = 1; d <= Math.min(stayDays, 3); d++) {
    days.push({
      day: d,
      title: d === 1 ? "Orientation and reef discovery" : `Day ${d} Guided dive & exploration`,
      activities: [
        {
          period: "Morning",
          time: "08:00",
          title: d === 1 ? "Briefing and first dive" : "Morning boat dive",
          details: "Review conditions and buddy checks with your operator.",
        },
        {
          period: "Afternoon",
          time: "13:00",
          title: "Surface interval and reef visit",
          details: "Rest, hydrate, then explore a shallow site suited to your group.",
        },
        {
          period: "Evening",
          time: "18:00",
          title: "Logbook and recovery",
          details: "Review sightings and keep the evening free for rest.",
        },
      ],
    });
  }

  return {
    summary: {
      experienceLevel: inputs.activity,
      duration: inputs.lengthOfStay,
      interest: inputs.activity,
      overview:
        "A flexible Mabini itinerary with guided dives, recovery time, and conservation-minded exploration.",
    },
    days,
    sites: [],
    ecoAlerts: [
      "Keep buoyancy neutral, never touch coral, and take all waste back to shore.",
    ],
    budgetBreakdown: [
      { label: "Guide and boat estimate", amount: Math.round(total * 0.7) },
      { label: "Fees and surface costs", amount: Math.round(total * 0.3) },
    ],
    budgetTotal: total,
  };
}

export function AssistantPlannerPanel() {
  const router = useRouter();
  const { user } = useAuth();
  const [budget, setBudget] = useState("");
  const [groupSize, setGroupSize] = useState("");
  const [activity, setActivity] = useState("");
  const [lengthOfStay, setLengthOfStay] = useState("");

  const [plan, setPlan] = useState<string | null>(null);
  const [structuredPlan, setStructuredPlan] = useState<StructuredPlan | null>(
    null
  );
  const [planError, setPlanError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!budget.trim() || isNaN(Number(budget)) || Number(budget) < 1) {
      errs.budget = "Enter a valid budget";
    }
    if (!groupSize.trim() || !/^\d+$/.test(groupSize.trim()) || Number(groupSize) < 1) {
      errs.groupSize = "Whole number, at least 1";
    }
    if (!activity) {
      errs.activity = "Select an activity";
    }
    if (!lengthOfStay) {
      errs.lengthOfStay = "Select length of stay";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    setLoading(true);
    setPlan(null);
    setStructuredPlan(null);
    setPlanError(false);
    setCopied(false);

    const activityLabel =
      ACTIVITY_OPTIONS.find((o) => o.value === activity)?.label || activity;
    const lengthLabel =
      LENGTH_OF_STAY_OPTIONS.find((o) => o.value === lengthOfStay)?.label ||
      lengthOfStay;

    const geminiPromise = generateDivePlan({
      destination: DEFAULT_DESTINATION,
      budget: budget.trim(),
      groupSize: groupSize.trim(),
      activities: activityLabel,
      lengthOfStay: lengthLabel,
    });

    const dbPromise = user
      ? supabase.from("dive_plan_inputs").insert({
          tourist_id: user.id,
          budget: budget.trim() || null,
          group_size: Number(groupSize) || null,
          preferred_activities: activityLabel,
          length_of_stay: lengthLabel,
        })
      : Promise.resolve();
    const sitesPromise = supabase
      .from("dive_sites")
      .select("*")
      .order("created_at", { ascending: false });

    try {
      const [result, , sitesResult] = await Promise.all([
        geminiPromise,
        dbPromise,
        sitesPromise,
      ]);
      if (sitesResult.error)
        throw new Error(
          "We couldn't load dive sites right now. Please try again."
        );
      setPlan(result);
      const parsed =
        parsePlan(result, {
          budget: budget.trim(),
          groupSize: groupSize.trim(),
          activity: activityLabel,
          lengthOfStay: lengthLabel,
        }) ||
        fallbackPlan({
          budget: budget.trim(),
          groupSize: groupSize.trim(),
          activity: activityLabel,
          lengthOfStay: lengthLabel,
        });
      parsed.sites = resolvePlannerSites(
        parsed.sites,
        (sitesResult.data || []).filter((site) => site.status !== "Restricted")
      );
      setStructuredPlan(parsed);
      setPlanError(false);
    } catch (e) {
      setPlan(
        e instanceof Error
          ? e.message
          : "Couldn't generate your dive plan. Check your connection and try again."
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
    setBudget("");
    setGroupSize("");
    setActivity("");
    setLengthOfStay("");
    setPlan(null);
    setStructuredPlan(null);
    setPlanError(false);
    setErrors({});
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {(!plan || planError) && (
        <Card style={styles.plannerCard}>
          <Text style={styles.plannerTitle}>QUICK TRIP PLANNER</Text>
          <Text style={styles.plannerSubtitle}>
            Destination: {DEFAULT_DESTINATION}
          </Text>

          <TextInput
            label="Budget (PHP)"
            placeholder="e.g. 5000"
            value={budget}
            onChangeText={setBudget}
            keyboardType="numeric"
            error={errors.budget}
          />

          <TextInput
            label="Group Size"
            placeholder="e.g. 2"
            value={groupSize}
            onChangeText={setGroupSize}
            keyboardType="numeric"
            error={errors.groupSize}
          />

          <Dropdown
            label="Activities"
            placeholder="Select an activity"
            value={activity}
            options={ACTIVITY_OPTIONS}
            onSelect={setActivity}
            error={errors.activity}
          />

          <Dropdown
            label="Length of Stay"
            placeholder="Select length of stay"
            value={lengthOfStay}
            options={LENGTH_OF_STAY_OPTIONS}
            onSelect={setLengthOfStay}
            error={errors.lengthOfStay}
          />
        </Card>
      )}

      {(!plan || planError) && (
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
            <View style={{ marginTop: 14 }}>
              <DidYouKnowLoader compact />
            </View>
          )}
        </View>
      )}

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

      {plan && !planError && structuredPlan && (
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
          <View style={styles.contextPill}>
            <Text style={styles.contextPillText}>
              ₱{Number(budget).toLocaleString()} Budget ·{" "}
              {structuredPlan.summary.duration} ·{" "}
              {structuredPlan.summary.interest}
            </Text>
            <TouchableOpacity
              onPress={handleStartOver}
              accessibilityRole="button"
            >
              <Text style={styles.editInputsText}>Edit inputs</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.overviewText}>
            {structuredPlan.summary.overview}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {[
              `₱${Number(budget).toLocaleString()} PHP`,
              `Group: ${groupSize} diver${Number(groupSize) === 1 ? "" : "s"}`,
              structuredPlan.summary.duration,
              structuredPlan.summary.interest,
            ].map((chip) => (
              <View key={chip} style={styles.specChip}>
                <Text style={styles.specChipText}>{chip}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.timeline}>
            {structuredPlan.days.map((day, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.rail}>
                  <View style={styles.railDot}>
                    <Text style={styles.railDotText}>{day.day}</Text>
                  </View>
                  {i < structuredPlan.days.length - 1 && (
                    <View style={styles.railLine} />
                  )}
                </View>
                <View style={styles.dayCard}>
                  <Text style={styles.dayTitle}>{day.title}</Text>
                  {day.activities.map((act, index) => (
                    <View
                      key={`${act.period}-${index}`}
                      style={styles.activityRow}
                    >
                      <Ionicons
                        name={
                          act.period === "Morning"
                            ? "sunny-outline"
                            : act.period === "Evening"
                            ? "moon-outline"
                            : "partly-sunny-outline"
                        }
                        size={14}
                        color={colors.primaryBlue}
                      />
                      <View style={styles.activityCopy}>
                        <Text style={styles.activityMeta}>
                          {act.period} · {act.time}
                        </Text>
                        <Text style={styles.activityTitle}>{act.title}</Text>
                        <Text style={styles.activityDetails}>
                          {act.details}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
          <Text style={styles.sectionHeading}>Suggested dive sites</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.siteRow}
          >
            {structuredPlan.sites.map((site) => (
              <View key={site.name} style={styles.siteCard}>
                <Image
                  source={resolveSiteImage(site.imageUrl, site.photoUrl, 0)}
                  style={styles.siteImage}
                />
                <Text style={styles.siteName}>{site.name}</Text>
                <Text style={styles.siteDepth}>{site.depth}</Text>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{site.difficulty}</Text>
                </View>
                <Text style={styles.siteDescription}>{site.description}</Text>
                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/map",
                      params: { site: site.name },
                    })
                  }
                >
                  <Ionicons
                    name="map-outline"
                    size={14}
                    color={colors.primaryBlue}
                  />
                  <Text style={styles.mapButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.ecoCard}>
            <Ionicons name="leaf-outline" size={21} color="#059669" />
            <View style={styles.calloutCopy}>
              <Text style={styles.calloutTitle}>Eco reminder</Text>
              {structuredPlan.ecoAlerts.map((alert) => (
                <Text key={alert} style={styles.calloutText}>
                  {alert}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.budgetCard}>
            <Ionicons name="wallet-outline" size={21} color="#0284C7" />
            <View style={styles.calloutCopy}>
              <Text style={styles.calloutTitle}>Budget summary</Text>
              {structuredPlan.budgetBreakdown.map((item) => (
                <View key={item.label} style={styles.budgetRow}>
                  <Text style={styles.calloutText}>{item.label}</Text>
                  <Text style={styles.budgetAmount}>
                    ₱{Number(item.amount).toLocaleString()}
                  </Text>
                </View>
              ))}
              <Text style={styles.budgetCeiling}>
                Ceiling: ₱{Number(structuredPlan.budgetTotal).toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => Clipboard.setStringAsync(JSON.stringify(structuredPlan))}
            >
              <Ionicons
                name="bookmark-outline"
                size={17}
                color={colors.white}
              />
              <Text style={styles.saveButtonText}>
                Save Itinerary on Device
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleCopy}
            >
              <Ionicons
                name="share-outline"
                size={17}
                color={colors.primaryBlue}
              />
              <Text style={styles.shareButtonText}>
                Share / Export Recap Card
              </Text>
            </TouchableOpacity>
          </View>
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
  contextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EBF3FF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  contextPillText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  editInputsText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  overviewText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.darkText,
    marginBottom: 10,
  },
  chipsRow: {
    gap: 7,
    paddingBottom: 14,
  },
  specChip: {
    borderRadius: 999,
    backgroundColor: "#F0F7FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  specChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 6,
  },
  activityCopy: { flex: 1 },
  activityMeta: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.darkText,
    marginTop: 1,
  },
  activityDetails: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.gray,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
    marginTop: 8,
    marginBottom: 8,
  },
  siteRow: { gap: 10, paddingBottom: 14 },
  siteCard: {
    width: 185,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    backgroundColor: colors.white,
    padding: 9,
  },
  siteImage: {
    width: "100%",
    height: 76,
    borderRadius: 9,
    marginBottom: 7,
  },
  siteName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.darkText,
  },
  siteDepth: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },
  difficultyBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginTop: 5,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
  },
  siteDescription: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.gray,
    marginTop: 6,
    minHeight: 28,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  mapButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryBlue,
  },
  ecoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 12,
    padding: 11,
    marginBottom: 10,
  },
  budgetCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 12,
    padding: 11,
  },
  calloutCopy: { flex: 1 },
  calloutTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 3,
  },
  calloutText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: colors.gray,
  },
  budgetRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  budgetAmount: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284C7",
  },
  budgetCeiling: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
    marginTop: 5,
  },
  footerActions: {
    gap: 8,
    marginTop: 12,
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: colors.primaryBlue,
    paddingVertical: 11,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
  },
  shareButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    paddingVertical: 10,
  },
  shareButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryBlue,
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
