import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  Button,
  Card,
  ContentContainer,
  DateField,
  Dropdown,
  TextInput,
  resolveSiteImage,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { shareText } from "../../../lib/snapshot";
import { toLocalDateString } from "../../../lib/diveDate";
import { generateDivePlan } from "../../../lib/gemini";
import { supabase } from "../../../lib/supabase";
import { resolvePlannerSites, PlannerSite } from "../../../lib/plannerSites";

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

type PlanActivity = {
  period: "Morning" | "Afternoon" | "Evening";
  time: string;
  title: string;
  details: string;
};

type PlanDay = {
  day: number;
  title: string;
  activities: PlanActivity[];
};

type StructuredPlan = {
  summary: {
    experienceLevel: string;
    duration: string;
    interest: string;
    overview: string;
  };
  days: PlanDay[];
  sites: PlannerSite[];
  ecoAlerts: string[];
  budgetBreakdown: { label: string; amount: number }[];
  budgetTotal: number;
};

function parsePlan(text: string, inputs: {
  startDate: string;
  endDate: string;
  budget: string;
  interests: string;
  diveType: string;
}): StructuredPlan | null {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
  try {
    const raw = JSON.parse(cleaned) as Partial<StructuredPlan>;
    if (!Array.isArray(raw.days) || !Array.isArray(raw.sites)) return null;
    return {
      summary: {
        experienceLevel: raw.summary?.experienceLevel || inputs.diveType,
        duration: raw.summary?.duration || `${inputs.startDate} – ${inputs.endDate}`,
        interest: raw.summary?.interest || inputs.interests || "Reef exploration",
        overview: raw.summary?.overview || "A practical dive plan built around your preferences.",
      },
      days: raw.days.map((day, index) => ({
        day: Number(day.day) || index + 1,
        title: day.title || `Dive day ${index + 1}`,
        activities: (day.activities || []).map((activity) => ({
          period: activity.period || "Morning",
          time: activity.time || "Flexible",
          title: activity.title || "Dive activity",
          details: activity.details || "Confirm conditions with your dive operator.",
        })),
      })),
      sites: raw.sites.map((site) => ({
        id: "",
        name: site.name || "Local reef site",
        depth: site.depth || "Depth varies",
        difficulty: site.difficulty || "Intermediate",
        description: site.description || "Ask your operator about current conditions.",
        imageUrl: null,
        photoUrl: null,
        location: null,
      })),
      ecoAlerts: raw.ecoAlerts?.length ? raw.ecoAlerts : ["Follow your operator's brief and avoid touching marine life."],
      budgetBreakdown: raw.budgetBreakdown || [],
      budgetTotal: Number(raw.budgetTotal) || Number(inputs.budget) || 0,
    };
  } catch {
    return null;
  }
}

function fallbackPlan(inputs: {
  startDate: string;
  endDate: string;
  budget: string;
  interests: string;
  diveType: string;
}): StructuredPlan {
  return {
    summary: {
      experienceLevel: inputs.diveType,
      duration: `${inputs.startDate} – ${inputs.endDate}`,
      interest: inputs.interests || "Reef exploration",
      overview: "A flexible Mabini itinerary with time for guided dives, recovery, and conservation-minded exploration.",
    },
    days: [{
      day: 1,
      title: "Orientation and reef discovery",
      activities: [
        { period: "Morning", time: "08:00", title: "Briefing and first dive", details: "Review conditions, buddy checks, and entry points with your operator." },
        { period: "Afternoon", time: "13:00", title: "Surface interval and reef visit", details: "Rest, hydrate, then explore a shallow site suited to your group." },
        { period: "Evening", time: "18:00", title: "Logbook and recovery", details: "Review your sightings and keep the evening free for rest." },
      ],
    }],
    sites: [],
    ecoAlerts: ["Keep buoyancy neutral, never touch coral, and take all waste back to shore."],
    budgetBreakdown: [
      { label: "Guide and boat estimate", amount: Math.round(Number(inputs.budget || 0) * 0.7) },
      { label: "Fees and surface costs", amount: Math.round(Number(inputs.budget || 0) * 0.3) },
    ],
    budgetTotal: Number(inputs.budget) || 0,
  };
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
  const [structuredPlan, setStructuredPlan] = useState<StructuredPlan | null>(null);

  React.useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
      if (sitesResult.error) throw new Error("We couldn't load dive sites right now. Please try again.");
      setPlan(result);
      const parsed = parsePlan(result, {
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        budget: budget.trim(),
        interests: interests.trim(),
        diveType: diveLabel,
      }) || fallbackPlan({
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        budget: budget.trim(),
        interests: interests.trim(),
        diveType: diveLabel,
      });
      parsed.sites = resolvePlannerSites(
        parsed.sites,
        (sitesResult.data || []).filter((site) => site.status !== "Restricted"),
      );
      setStructuredPlan(parsed);
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDestination("");
    setStartDate("");
    setEndDate("");
    setDivers("");
    setDiveType("");
    setBudget("");
    setInterests("");
    setPlan(null);
    setStructuredPlan(null);
    setPlanError(false);
    setErrors({});
  };

  const hasResult = Boolean(plan && !planError && structuredPlan);
  const handleSave = async () => {
    if (!structuredPlan) return;
    try {
      await AsyncStorage.setItem(
        "sinsay.saved-dive-itinerary",
        JSON.stringify({
          destination,
          startDate,
          endDate,
          divers,
          diveType,
          budget,
          interests,
          plan: structuredPlan,
          savedAt: new Date().toISOString(),
        }),
      );
      setSharedNote("Itinerary saved on this device.");
    } catch {
      setSharedNote("Could not save this itinerary. Please try again.");
    }
  };
  const handleEditInputs = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPlan(null);
    setStructuredPlan(null);
    setCopied(false);
    setSharedNote("");
  };

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
          {!hasResult && <>{/* Trip Planner Card */}
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
          </View></>}

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
          {hasResult && structuredPlan && (
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
              <View style={styles.contextPill}>
                <Text style={styles.contextPillText}>
                  ₱{Number(budget).toLocaleString()} Budget · {structuredPlan.summary.duration} · {structuredPlan.summary.interest}
                </Text>
                <TouchableOpacity onPress={handleEditInputs} accessibilityRole="button">
                  <Text style={styles.editInputsText}>Edit inputs</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.overviewText}>{structuredPlan.summary.overview}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                {[
                  `₱${Number(budget).toLocaleString()} PHP`,
                  structuredPlan.summary.experienceLevel,
                  structuredPlan.summary.duration,
                  structuredPlan.summary.interest,
                ].map((chip) => <View key={chip} style={styles.specChip}><Text style={styles.specChipText}>{chip}</Text></View>)}
              </ScrollView>
              <View style={styles.timeline}>
                {structuredPlan.days.map((day, i) => (
                  <View key={i} style={styles.timelineRow}>
                    <View style={styles.rail}>
                      <View style={styles.railDot}>
                        <Text style={styles.railDotText}>{day.day}</Text>
                      </View>
                      {i < structuredPlan.days.length - 1 && <View style={styles.railLine} />}
                    </View>
                    <View style={styles.dayCard}>
                      <Text style={styles.dayTitle}>{day.title}</Text>
                      {day.activities.map((activity, index) => (
                        <View key={`${activity.period}-${index}`} style={styles.activityRow}>
                          <View style={styles.activityIcon}><Ionicons name={activity.period === "Morning" ? "sunny-outline" : activity.period === "Evening" ? "moon-outline" : "partly-sunny-outline"} size={14} color={colors.primaryBlue} /></View>
                          <View style={styles.activityCopy}><Text style={styles.activityMeta}>{activity.period} · {activity.time}</Text><Text style={styles.activityTitle}>{activity.title}</Text><Text style={styles.activityDetails}>{activity.details}</Text></View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionHeading}>Suggested dive sites</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.siteRow}>
                {structuredPlan.sites.map((site) => (
                  <View key={site.name} style={styles.siteCard}>
                    <Image source={resolveSiteImage(site.imageUrl, site.photoUrl, 0)} style={styles.siteImage} />
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.siteDepth}>{site.depth}</Text>
                    <View style={styles.difficultyBadge}><Text style={styles.difficultyText}>{site.difficulty}</Text></View>
                    <Text style={styles.siteDescription}>{site.description}</Text>
                    <TouchableOpacity style={styles.mapButton} onPress={() => router.push({ pathname: "/(tabs)/map", params: { site: site.name } })}><Ionicons name="map-outline" size={14} color={colors.primaryBlue} /><Text style={styles.mapButtonText}>View on Map</Text></TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
              <View style={styles.ecoCard}><Ionicons name="leaf-outline" size={21} color="#059669" /><View style={styles.calloutCopy}><Text style={styles.calloutTitle}>Eco reminder</Text>{structuredPlan.ecoAlerts.map((alert) => <Text key={alert} style={styles.calloutText}>{alert}</Text>)}</View></View>
              <View style={styles.budgetCard}><Ionicons name="wallet-outline" size={21} color="#0284C7" /><View style={styles.calloutCopy}><Text style={styles.calloutTitle}>Budget summary</Text>{structuredPlan.budgetBreakdown.map((item) => <View key={item.label} style={styles.budgetRow}><Text style={styles.calloutText}>{item.label}</Text><Text style={styles.budgetAmount}>₱{Number(item.amount).toLocaleString()}</Text></View>)}<Text style={styles.budgetCeiling}>Ceiling: ₱{Number(structuredPlan.budgetTotal).toLocaleString()}</Text></View></View>
              <View style={styles.footerActions}><TouchableOpacity style={styles.saveButton} onPress={handleSave}><Ionicons name="bookmark-outline" size={17} color={colors.white} /><Text style={styles.saveButtonText}>Save Itinerary on Device</Text></TouchableOpacity><TouchableOpacity style={styles.shareButton} onPress={handleShare}><Ionicons name="share-outline" size={17} color={colors.primaryBlue} /><Text style={styles.shareButtonText}>Share / Export Recap Card</Text></TouchableOpacity></View>
              {sharedNote ? <Text style={styles.copiedNote}>{sharedNote}</Text> : null}
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
          <View style={{ height: 24 }} />
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
  contextPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 12,
  },
  contextPillText: { flex: 1, color: "#315B92", fontSize: 11, fontWeight: "700" },
  editInputsText: { color: colors.primaryBlue, fontSize: 11, fontWeight: "800" },
  overviewText: { color: "#526C8D", fontSize: 13, lineHeight: 20, marginBottom: 10 },
  chipsRow: { gap: 8, paddingVertical: 2, paddingRight: 8, marginBottom: 14 },
  specChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  specChipText: { color: "#475569", fontSize: 11, fontWeight: "700" },
  dayTitle: { color: colors.navy, fontSize: 14, fontWeight: "800", marginBottom: 8 },
  activityRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  activityIcon: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#EAF4FF", alignItems: "center", justifyContent: "center" },
  activityCopy: { flex: 1 },
  activityMeta: { color: colors.primaryBlue, fontSize: 10, fontWeight: "800" },
  activityTitle: { color: colors.darkText, fontSize: 12, fontWeight: "800", marginTop: 1 },
  activityDetails: { color: "#64748B", fontSize: 11, lineHeight: 16, marginTop: 2 },
  sectionHeading: { color: colors.navy, fontSize: 14, fontWeight: "800", marginTop: 16, marginBottom: 8 },
  siteRow: { gap: 10, paddingRight: 8 },
  siteCard: { width: 190, borderRadius: 14, borderWidth: 1, borderColor: "#DCE8F4", backgroundColor: colors.white, overflow: "hidden", paddingBottom: 10 },
  siteImage: { width: "100%", height: 82, resizeMode: "cover" },
  siteName: { color: colors.navy, fontSize: 13, fontWeight: "800", marginHorizontal: 10, marginTop: 9 },
  siteDepth: { color: "#64748B", fontSize: 11, marginHorizontal: 10, marginTop: 2 },
  difficultyBadge: { alignSelf: "flex-start", marginHorizontal: 10, marginTop: 6, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: "#E0F2FE" },
  difficultyText: { color: "#0369A1", fontSize: 9, fontWeight: "800" },
  siteDescription: { color: "#64748B", fontSize: 10, lineHeight: 14, marginHorizontal: 10, marginTop: 6, minHeight: 28 },
  mapButton: { flexDirection: "row", alignItems: "center", gap: 4, marginHorizontal: 10, marginTop: 8 },
  mapButtonText: { color: colors.primaryBlue, fontSize: 10, fontWeight: "800" },
  ecoCard: { flexDirection: "row", gap: 10, marginTop: 16, padding: 13, borderRadius: 14, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  budgetCard: { flexDirection: "row", gap: 10, marginTop: 10, padding: 13, borderRadius: 14, backgroundColor: "#F0F9FF", borderWidth: 1, borderColor: "#BAE6FD" },
  calloutCopy: { flex: 1 },
  calloutTitle: { color: colors.navy, fontSize: 13, fontWeight: "800", marginBottom: 4 },
  calloutText: { color: "#526C8D", fontSize: 11, lineHeight: 17 },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  budgetAmount: { color: "#0369A1", fontSize: 11, fontWeight: "800" },
  budgetCeiling: { color: "#0284C7", fontSize: 10, fontWeight: "800", marginTop: 6 },
  footerActions: { gap: 9, marginTop: 16 },
  saveButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 44, borderRadius: 13, backgroundColor: "#0EA5E9" },
  saveButtonText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  shareButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.primaryBlue },
  shareButtonText: { color: colors.primaryBlue, fontSize: 12, fontWeight: "800" },
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
