import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    TextInput as NativeInput,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { ContentContainer, DateField as SharedDateField, Dropdown as SharedDropdown, TextInput as SharedTextInput } from "../../../components";
import { colors } from "../../../constants/colors";
import { useAuth } from "../../../hooks/useAuth";
import { toLocalPhDigits, toDbPhPhone } from "../../../lib/phone";
import { deleteDraft, saveDraft } from "../../../lib/manifestDrafts";
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

const FORM_FONT = "Quicksand_500Medium";
const TextInput = (props: React.ComponentProps<typeof SharedTextInput>) =>
  <SharedTextInput {...props} fontFamily={FORM_FONT} />;
const Dropdown = (props: React.ComponentProps<typeof SharedDropdown>) =>
  <SharedDropdown {...props} fontFamily={FORM_FONT} />;
const DateField = (props: React.ComponentProps<typeof SharedDateField>) =>
  <SharedDateField {...props} fontFamily={FORM_FONT} />;

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
  // Manifest display attributes (manifest_divers has no such columns — these
  // never reach the DB). Registered divers auto-fill from the tourist
  // profile with per-diver override; walk-ins are entered manually.
  nationality?: string;
  diveLevel?: string;
}

// Tourist certification_level (step2 vocabulary) → manifest dive-level list.
const certToDiveLevel = (cert: string | null | undefined): string => {
  const c = (cert || "").toLowerCase();
  if (c.includes("rescue")) return "Rescue Diver";
  if (c.includes("advanced")) return "Advanced Adventurer";
  if (c.includes("open")) return "Open Water";
  if (c.includes("divemaster")) return "Divemaster";
  return "Fun Dive";
};

const buildDiverMeta = (d: Pick<Diver, "ecoId" | "isWalkIn" | "nationality" | "diveLevel">): string => {
  const nat = d.nationality || "Unknown";
  const lvl = d.diveLevel || "Fun Dive";
  if (d.isWalkIn) return `Walk-in · ${lvl} · ${nat}`;
  const idPart = d.ecoId || "No Eco-Dive ID on file";
  return `${idPart} · ${nat} · ${lvl}`;
};

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
// YYYY-MM-DD in local parts (avoids UTC day-shift). Clamps Feb-29 → Feb-28
// so leap-day dives don't produce an invalid date that fails the insert.
const addOneYear = (s: string) => {
  const [y, mo, d] = s.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setFullYear(dt.getFullYear() + 1);
  if (dt.getMonth() !== mo - 1) dt.setDate(0);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

let diverIdCounter = 1000;
function createNextDiverId(): string {
  diverIdCounter += 1;
  return `diver-${Date.now()}-${diverIdCounter}`;
}

export default function CreateManifestStep1() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ draft?: string; draftId?: string }>();

  const [initialDraft] = useState(() => {
    try {
      return params.draft ? (JSON.parse(params.draft) as Partial<Record<string, any>>) : {};
    } catch {
      return {};
    }
  });
  // Resumed local draft id (Drafts tab): autosave updates it, successful
  // submit deletes it. New forms get an id on first autosave.
  const [draftId, setDraftId] = useState<string | null>(
    typeof params.draftId === "string" ? params.draftId : null
  );
  const [draftSavedTick, setDraftSavedTick] = useState(0);

  const [diveType, setDiveType] = useState((initialDraft.diveType as string) ?? "Scuba Diving");
  const [diveMode, setDiveMode] = useState((initialDraft.diveMode as string) ?? "Boat Dive");
  const [location, setLocation] = useState((initialDraft.location as string) ?? "");
  const [isManualSite, setIsManualSite] = useState<boolean>(false);
  const [diveSiteOptions, setDiveSiteOptions] = useState<{ label: string; value: string }[]>([]);
  const [diveSitesLoading, setDiveSitesLoading] = useState(true);
  const [diveSitesError, setDiveSitesError] = useState(false);
  const [diveSitesReloadKey, setDiveSitesReloadKey] = useState(0);
  const [difficulty, setDifficulty] = useState((initialDraft.difficulty as string) ?? "Beginner");

  // Boat details
  const [boatName, setBoatName] = useState((initialDraft.boatName as string) ?? "");
  const [captainName, setCaptainName] = useState((initialDraft.captainName as string) ?? "");
  const [crewMembers, setCrewMembers] = useState<string[]>(() => {
    if (Array.isArray(initialDraft.crewMembers) && initialDraft.crewMembers.length > 0) {
      return initialDraft.crewMembers as string[];
    }
    return [""];
  });
  const [maxDivers, setMaxDivers] = useState((initialDraft.maxDivers as string) ?? "22");
  const [boatContact, setBoatContact] = useState((initialDraft.boatContact as string) ?? "");

  // Instructor / Duty of Care
  const [instructorName, setInstructorName] = useState((initialDraft.instructorName as string) ?? "Instructor Marco Valerio");
  const [diveMasters, setDiveMasters] = useState<string[]>(() => {
    if (Array.isArray(initialDraft.diveMasters) && initialDraft.diveMasters.length > 0) {
      return initialDraft.diveMasters as string[];
    }
    const legacy = (initialDraft.instructorName as string) || "Instructor Marco Valerio";
    return legacy ? [legacy] : [""];
  });
  const [dutyNotes, setDutyNotes] = useState((initialDraft.dutyNotes as string) ?? "");
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
  // Full holder ranges for overlap preview (B1): assigning [diveDate, +1yr]
  // must not overlap any existing holder range for the same tourist.
  const [annualHolders, setAnnualHolders] = useState<
    { tourist_id: string; valid_from: string; valid_until: string }[]
  >([]);
  // touristIds the operator chose to cover with an annual slot on submit.
  const [annualAssigned, setAnnualAssigned] = useState<string[]>([]);
  const [searchError, setSearchError] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isBoatDive = diveMode === "Boat Dive";
  const wizardSteps = isBoatDive
    ? ["Dive Details", "Boat & Crew", "Divers", "Safety & Review"]
    : ["Dive Details", "Divers", "Safety & Review"];
  const stepDescriptions = isBoatDive
    ? ["Set the date, dive type, and site", "Add the vessel and crew", "Build the diver roster", "Review safety and pass use"]
    : ["Set the date, dive type, and site", "Build the diver roster", "Review safety and pass use"];
  const diverStepIndex = isBoatDive ? 2 : 1;
  const reviewStepIndex = wizardSteps.length - 1;

  // Modal State for Select Dive Master
  const [showDmModal, setShowDmModal] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState("");
  const [dmSearchResults, setDmSearchResults] = useState<any[]>([]);
  const [dmSearching, setDmSearching] = useState(false);
  const [dmSearchError, setDmSearchError] = useState(false);

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

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setDiveSitesLoading(true);
      setDiveSitesError(false);
      (async () => {
        try {
          const { data, error: sitesError } = await supabase
            .from("dive_sites")
            .select("id, name, barangay, status")
            .order("name", { ascending: true });
          if (sitesError) throw sitesError;
          if (!active) return;
          const options = (data ?? [])
            .filter((site) => !site.status || site.status.toLowerCase() !== "restricted")
            .map((site) => ({
              label: site.barangay ? `${site.name} · ${site.barangay}` : site.name,
              value: site.name,
            }));
          setDiveSiteOptions(options);
          setDiveSitesLoading(false);
        } catch (sitesError) {
          console.warn("Failed to load dive sites:", sitesError);
          if (!active) return;
          setDiveSitesError(true);
          setDiveSitesLoading(false);
        }
      })();
    });
    return () => { active = false; };
  }, [diveSitesReloadKey]);

  // Retain a saved location from an older local draft even if that site is no
  // longer listed. New selections always come from the current database list.
  const locationOptions = location && !diveSiteOptions.some((site) => site.value === location)
    ? [...diveSiteOptions, { label: `${location} (saved draft)`, value: location }]
    : diveSiteOptions;

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
    queueMicrotask(() => loadLedger());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Annual coverage: registered divers holding a valid annual pass for the
  // dive date don't consume one-day passes (ledger excludes them server-side
  // in 027). Pre-027 the table is missing → catch → all uncovered, and the
  // one-day logic below behaves exactly as before.
  useEffect(() => {
    queueMicrotask(() => {
      const ids = [...new Set(divers.filter((d) => d.touristId).map((d) => d.touristId as string))];
      setAnnualAssigned((prev) => prev.filter((id) => ids.includes(id)));
      if (ids.length === 0 || !isValidCalendarDate(diveDate)) {
        setAnnualCovered(new Set());
        setAnnualHolders([]);
        return;
      }
      (async () => {
        try {
          const { data, error } = await supabase
            .from("annual_pass_holders")
            .select("tourist_id, valid_from, valid_until")
            .in("tourist_id", ids);
          if (error) throw error;
          const rows = data || [];
          setAnnualHolders(rows);
          const covered = new Set<string>();
          for (const h of rows) {
            if (h.valid_from <= diveDate && diveDate <= h.valid_until) {
              covered.add(h.tourist_id);
            }
          }
          setAnnualCovered(covered);
        } catch (e) {
          console.warn("Annual coverage check failed:", e);
          setAnnualCovered(new Set());
          setAnnualHolders([]);
        }
      })();
    });
  }, [divers, diveDate]);

  const isCovered = (d: Diver) => !!d.touristId && annualCovered.has(d.touristId);
  const isAssigned = (d: Diver) => !!d.touristId && annualAssigned.includes(d.touristId as string);
  const canAssignMore = annualAssigned.length < annualSlots;

  // New assignment range always anchors on the dive date (exact 1-yr, 041).
  const rangesOverlap = (aFrom: string, aUntil: string, bFrom: string, bUntil: string) =>
    aFrom <= bUntil && bFrom <= aUntil;

  const toggleAnnual = (d: Diver) => {
    if (!d.touristId || isCovered(d)) return;
    const tid = d.touristId as string;
    if (annualAssigned.includes(tid)) {
      setAnnualAssigned((prev) => prev.filter((id) => id !== tid));
      return;
    }
    if (!canAssignMore) return;
    // Pre-flight: the new [diveDate, +1yr] range must not overlap any
    // existing holder range for this tourist (server trigger is the backstop).
    if (isValidCalendarDate(diveDate)) {
      const newUntil = addOneYear(diveDate);
      const clash = annualHolders.some(
        (h) => h.tourist_id === tid && rangesOverlap(diveDate, newUntil, h.valid_from, h.valid_until)
      );
      if (clash) {
        setError(`${d.name} already holds an annual pass overlapping this dive year — slot not assigned.`);
        return;
      }
    }
    setError("");
    setAnnualAssigned((prev) => [...prev, tid]);
  };

  // Pass consumption (A6: walk-ins consume): every walk-in needs 1 pass,
  // plus every registered diver neither covered by an annual nor assigned
  // one now. Matches the 040 ledger (counts all rows except covered).
  const walkInCount = divers.filter((d) => d.isWalkIn).length;
  const registeredNeeded = divers.filter(
    (d) => !d.isWalkIn && !isCovered(d) && !isAssigned(d)
  ).length;
  const passesNeeded = walkInCount + registeredNeeded;
  const hasEnoughPasses = !passesLoading && !passesError && remainingPasses >= passesNeeded;
  const dateValid =
    isValidCalendarDate(diveDate) && diveDate >= todayLocal();
  const locationValid = location.trim().length > 0;
  const maxDiversNum = Number(maxDivers);
  const maxDiversValid = Number.isInteger(maxDiversNum) && maxDiversNum > 0;
  const capacityPercent = maxDiversValid ? Math.min(100, (divers.length / maxDiversNum) * 100) : 0;
  const maxDiversDisplay = maxDiversValid ? String(maxDiversNum) : "—";
  const validCrewMembers = crewMembers.filter((m) => m.trim().length > 0);
  const crewCountNum = validCrewMembers.length;
  const boatDetailsValid =
    !isBoatDive ||
    Boolean(
      boatName.trim() &&
      captainName.trim() &&
      boatContact.trim() &&
      validCrewMembers.length > 0,
    );
  const canSubmit = Boolean(
    divers.length > 0 &&
    locationValid &&
    boatDetailsValid &&
    maxDiversValid &&
    divers.length <= maxDiversNum &&
    hasEnoughPasses &&
    dateValid &&
    !saving
  );

  const searchDiveMasters = async (text: string) => {
    setDmSearchQuery(text);
    setDmSearchError(false);
    setDmSearching(true);
    try {
      const trimmed = text.trim();
      let query = supabase
        .from("tourists")
        .select("id, full_name, certification_level, pcssd_accreditation_no, pcssd_url, permit_to_operate_no, permit_to_operate_url");

      if (trimmed.length > 0) {
        query = query.ilike("full_name", `%${trimmed}%`);
      } else {
        query = query.or("certification_level.in.(dive-master,instructor),pcssd_accreditation_no.not.is.null,pcssd_url.not.is.null");
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      setDmSearchResults(data || []);
    } catch (e) {
      console.warn("Dive master search failed:", e);
      setDmSearchResults([]);
      setDmSearchError(true);
    }
    setDmSearching(false);
  };

  const handleSelectDiveMaster = (dm: {
    id: string;
    full_name: string;
    certification_level?: string | null;
    pcssd_accreditation_no?: string | null;
    pcssd_url?: string | null;
    permit_to_operate_no?: string | null;
    permit_to_operate_url?: string | null;
  }) => {
    const credentials: string[] = [];
    if (dm.pcssd_accreditation_no) {
      credentials.push(`PCSSD #${dm.pcssd_accreditation_no}`);
    } else if (dm.pcssd_url) {
      credentials.push("PCSSD Verified");
    }

    if (dm.permit_to_operate_no) {
      credentials.push(`Permit #${dm.permit_to_operate_no}`);
    } else if (dm.permit_to_operate_url) {
      credentials.push("Permit Verified");
    }

    const formattedName = credentials.length > 0
      ? `${dm.full_name} (${credentials.join(" • ")})`
      : dm.full_name;

    const currentList = diveMasters.filter((d) => d.trim().length > 0);
    if (!currentList.includes(formattedName)) {
      const updated = [...currentList, formattedName];
      setDiveMasters(updated);
      if (updated.length === 1) {
        setInstructorName(dm.full_name);
      }
    }
    setShowDmModal(false);
  };

  // Search tourists in Supabase: name contains-match + exact Eco-Dive ID
  // match (Eco IDs look like ECO-2026-…, so only attempt the ID lookup for
  // inputs long enough to be an ID — avoids a wasted query per keystroke).
  const searchTourists = async (text: string) => {
    setSearchQuery(text);
    setSearchError(false);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
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
      const eco = (ecoRes as { data?: { tourist_id: string; eco_id_number: string } | null }).data;
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
    } catch (e) {
      console.warn("Diver search failed:", e);
      setSearchResults([]);
      setSearchError(true);
    }
    setSearching(false);
  };

  const handleSelectSearchResult = async (tourist: { id: string; full_name: string }) => {
    // Never fabricate an eco-ID: look up the real one (may be none).
    // Auto-fill display attributes from the tourist profile (overrideable
    // per diver below).
    let ecoId: string | undefined;
    let nationality = "Filipino";
    let diveLevel = "Fun Dive";
    try {
      const [{ data: eco }, { data: prof }] = await Promise.all([
        supabase
          .from("eco_dive_ids")
          .select("eco_id_number")
          .eq("tourist_id", tourist.id)
          .limit(1)
          .maybeSingle(),
        supabase
          .from("tourists")
          .select("nationality, certification_level")
          .eq("id", tourist.id)
          .maybeSingle(),
      ]);
      ecoId = eco?.eco_id_number ?? undefined;
      if (prof?.nationality) nationality = prof.nationality;
      diveLevel = certToDiveLevel(
        (prof as { certification_level?: string } | null)?.certification_level
      );
    } catch (e) {
      console.warn("Eco-ID/profile lookup failed:", e);
    }
    const newDiver: Diver = {
      id: createNextDiverId(),
      name: tourist.full_name,
      ecoId,
      touristId: tourist.id,
      isWalkIn: false,
      nationality,
      diveLevel,
      meta: buildDiverMeta({ ecoId, isWalkIn: false, nationality, diveLevel }),
    };
    setDivers((prev) =>
      prev.some((d) => d.touristId === tourist.id) ? prev : [...prev, newDiver]
    );
    setShowAddModal(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Per-diver attribute override (registered divers): keeps profile values
  // as the base, operator adjusts nationality/dive level for this manifest.
  const [editingDiverId, setEditingDiverId] = useState<string | null>(null);
  const updateDiverAttrs = (id: string, patch: Partial<Pick<Diver, "nationality" | "diveLevel">>) => {
    setDivers((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...patch };
        return { ...next, meta: buildDiverMeta(next) };
      })
    );
  };

  const handleAddModalDiver = () => {
    const fullName = `${newFirstName.trim()} ${newLastName.trim()}`.trim();
    if (!fullName) return;

    const newDiver: Diver = {
      id: createNextDiverId(),
      name: fullName,
      ecoId: undefined,
      isWalkIn: true,
      nationality: newNationality,
      diveLevel: newDiveLevel,
      meta: buildDiverMeta({ isWalkIn: true, nationality: newNationality, diveLevel: newDiveLevel }),
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

  // Local draft autosave (never touches the DB): a draft with at least one
  // diver is worth keeping. Debounced 1.5s so typing doesn't spam storage.
  const collectDraftForm = () => ({
    diveType, diveMode, location, difficulty, boatName, captainName,
    crewCount: String(crewCountNum),
    maxDivers, boatContact, instructorName, dutyNotes, diveDate, divers,
    crewMembers, diveMasters,
  });
  useEffect(() => {
    if (!user || divers.length === 0) return;
    const t = setTimeout(async () => {
      try {
        const saved = await saveDraft(user.id, collectDraftForm() as Record<string, unknown>, draftId ?? undefined);
        if (!draftId) setDraftId(saved.id);
        setDraftSavedTick(Date.now());
      } catch {
        // Draft persistence is best-effort; the form itself is unaffected.
      }
    }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, divers, diveType, diveMode, location, difficulty, boatName, captainName, crewMembers, maxDivers, boatContact, instructorName, dutyNotes, diveDate]);

  const handleSaveDraft = async () => {
    if (!user) return;
    try {
      const saved = await saveDraft(user.id, collectDraftForm() as Record<string, unknown>, draftId ?? undefined);
      setDraftId(saved.id);
      setDraftSavedTick(Date.now());
      setError("");
    } catch {
      setError("Couldn't save the draft on this device. Try again.");
    }
  };

  const goToPreviousStep = () => {
    setError("");
    setDateError("");
    setCurrentStep((step) => Math.max(0, step - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const goToNextStep = () => {
    setError("");
    if (currentStep === 0) {
      if (!location || !location.trim()) {
        setError("Please enter or select a dive location.");
        return;
      }
      if (!isManualSite && (diveSitesLoading || diveSitesError || diveSiteOptions.length === 0)) {
        setError(
          diveSitesLoading
            ? "Wait for dive sites to load before continuing, or enter manually."
            : "Dive sites are unavailable. You can enter the site manually."
        );
        return;
      }
      if (!isValidCalendarDate(diveDate)) {
        setDateError("Enter a valid dive date (YYYY-MM-DD).");
        setError("Check the dive date before continuing.");
        return;
      }
      if (diveDate < todayLocal()) {
        setDateError("Dive date cannot be in the past.");
        setError("Choose today or a future date to continue.");
        return;
      }
      setDateError("");
    }
    if (isBoatDive && currentStep === 1) {
      if (!boatName.trim() || !captainName.trim() || !boatContact.trim()) {
        setError("Enter the boat name, captain, and boat contact to continue.");
        return;
      }
      if (validCrewMembers.length === 0) {
        setError("Please enter the name of at least one boat crew member to continue.");
        return;
      }
    }
    if (currentStep === diverStepIndex) {
      if (divers.length === 0) {
        setError("Add at least one diver to continue.");
        return;
      }
      if (!maxDiversValid || divers.length > maxDiversNum) {
        setError("The diver roster exceeds the maximum group capacity. Update the capacity or roster.");
        return;
      }
    }
    setCurrentStep((step) => Math.min(wizardSteps.length - 1, step + 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!isValidCalendarDate(diveDate)) {
      setDateError("Enter a valid dive date (YYYY-MM-DD).");
      return;
    }
    if (diveDate < todayLocal()) {
      setDateError("Dive date cannot be in the past.");
      return;
    }
    if (!canSubmit) {
      if (isBoatDive && validCrewMembers.length === 0) {
        setError("Please enter the name of at least one boat crew member.");
        return;
      }
      if (isBoatDive && !boatDetailsValid) {
        setError("Complete the boat and crew details before submitting.");
        return;
      }
      setError("Please complete all required fields and add at least one diver.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      // Atomic manifest write via RPC (040, hardened 041): manifest + divers
      // + annual holders land together or not at all. Balance + capacity +
      // overlap enforced server-side too. 041 returns {manifest_id, remaining}
      // (040 returned a bare uuid) — accept both during the migration window.
      const diverPayload = divers.map((d) => ({
        name: d.name,
        eco_id: d.ecoId || null,
        tourist_id: d.touristId || null,
        is_walk_in: d.isWalkIn,
      }));
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "create_manifest_with_divers",
        {
          p_dive_type: diveType,
          p_dive_mode: diveMode,
          p_location: location,
          p_difficulty: difficulty,
          p_boat_name: isBoatDive ? boatName.trim() : null,
          p_captain_name: isBoatDive ? captainName.trim() : null,
          p_boat_contact: isBoatDive ? (toDbPhPhone(boatContact) || boatContact.trim()) : null,
          p_crew_count: isBoatDive ? crewCountNum : null,
          p_instructor_name: diveMasters.find((dm) => dm.trim().length > 0) || instructorName.trim() || null,
          p_max_divers: maxDiversNum,
          p_dive_date: diveDate,
          p_divers: diverPayload,
          p_annual_assign: annualAssigned,
          p_duty_notes: dutyNotes.trim() || null,
          p_crew_members: isBoatDive ? validCrewMembers : [],
          p_dive_masters: diveMasters.filter((dm) => dm.trim().length > 0),
        }
      );

      if (rpcError || !rpcData) {
        setError(rpcError ? `Failed to create manifest: ${rpcError.message}` : "Failed to create manifest. Please try again.");
        setSaving(false);
        return;
      }
      const result =
        typeof rpcData === "string"
          ? { manifest_id: rpcData, remaining: Math.max(0, remainingPasses - passesNeeded) }
          : (rpcData as { manifest_id: string; remaining: number });

      // Submitted — the resumed local draft (if any) is now obsolete.
      if (user && draftId) {
        try {
          await deleteDraft(user.id, draftId);
        } catch {
          // Best-effort; a stale draft row is harmless.
        }
      }

      router.replace({
        pathname: "/establishment/create-manifest/confirmed",
        params: {
          manifestId: String(result.manifest_id),
          location,
          diverCount: divers.length,
          boatName: isBoatDive ? boatName.trim() : "",
          captainName: isBoatDive ? captainName.trim() : "",
          remainingBalance: String(result.remaining),
          diveMasters: diveMasters.filter((dm) => dm.trim().length > 0).join(", "),
          crewMembers: validCrewMembers.join(", "),
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

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to manifests"
        >
          <Ionicons name="chevron-back" size={22} color="#12316c" />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerEyebrow}>OPERATOR · MANIFESTS</Text>
          <Text style={styles.headerTitle}>New dive manifest</Text>
          <Text style={styles.headerSubtitle}>A guided setup for your next trip</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.formBody}
        behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
      >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={480} paddingH={14}>
          <View style={styles.progressCard} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: wizardSteps.length, now: currentStep + 1 }}>
            <View style={styles.progressHeadingRow}>
              <View style={styles.progressTitleGroup}>
                <Text style={styles.progressEyebrow}>STEP {currentStep + 1} OF {wizardSteps.length}</Text>
                <Text style={styles.progressCurrent}>{wizardSteps[currentStep]}</Text>
              </View>
              <Text style={styles.progressDescription}>{stepDescriptions[currentStep]}</Text>
            </View>
            <View style={styles.progressSteps}>
              {wizardSteps.map((label, index) => {
                const active = index === currentStep;
                const complete = index < currentStep;
                return (
                  <View key={label} style={styles.progressStep}>
                    <View style={[styles.progressNode, active && styles.progressNodeActive, complete && styles.progressNodeComplete]}>
                      {complete ? <Ionicons name="checkmark" size={11} color="#FFFFFF" /> : <Text style={[styles.progressNodeText, active && styles.progressNodeTextActive]}>{index + 1}</Text>}
                    </View>
                    {index < wizardSteps.length - 1 && <View style={[styles.progressConnector, complete && styles.progressConnectorComplete]} />}
                    <Text numberOfLines={2} style={[styles.progressStepLabel, active && styles.progressStepLabelActive, complete && styles.progressStepLabelComplete]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Dive Details */}
          {currentStep === 0 && (
          <View style={styles.cardBox}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="water" size={17} color="#087bff" /></View>
              <View style={styles.sectionTitleCopy}>
                <Text style={styles.cardHeaderTitle}>Dive Details</Text>
                <Text style={styles.sectionHint}>Choose the trip type, date, and conditions</Text>
              </View>
            </View>
            <DateField
              label="Dive Date"
              value={diveDate}
              onChangeText={(v) => {
                setDiveDate(v);
                if (dateError) setDateError("");
              }}
              error={dateError || undefined}
              min={todayLocal()}
            />
            <Dropdown
              label="Dive Type"
              placeholder="Select dive type"
              value={diveType}
              options={diveTypes}
              onSelect={setDiveType}
            />
            <Dropdown
              label="Mode of Diving"
              placeholder="Select mode"
              value={diveMode}
              options={diveModes}
              onSelect={setDiveMode}
            />
            {isManualSite ? (
              <View style={styles.manualSiteWrap}>
                <TextInput
                  label="Dive Site / Location Name"
                  placeholder="e.g. Secret Garden Reef"
                  value={location}
                  onChangeText={setLocation}
                />
                <TouchableOpacity
                  style={styles.manualSiteToggle}
                  onPress={() => setIsManualSite(false)}
                  accessibilityRole="button"
                >
                  <Ionicons name="list-outline" size={14} color="#006bff" />
                  <Text style={styles.manualSiteToggleText}>Choose from registered dive sites list</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Dropdown
                  label="Dive Location"
                  placeholder={diveSitesLoading ? "Loading dive sites…" : diveSitesError ? "Dive sites unavailable" : "Select a dive site"}
                  value={location}
                  options={locationOptions}
                  onSelect={setLocation}
                />
                <TouchableOpacity
                  style={styles.manualSiteToggle}
                  onPress={() => {
                    setIsManualSite(true);
                    setLocation("");
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="create-outline" size={14} color="#006bff" />
                  <Text style={styles.manualSiteToggleText}>Can&apos;t find your dive site? Enter manually</Text>
                </TouchableOpacity>
              </View>
            )}
            {diveSitesError ? (
              <TouchableOpacity
                style={styles.siteRetryButton}
                onPress={() => setDiveSitesReloadKey((key) => key + 1)}
                accessibilityRole="button"
                accessibilityLabel="Reload dive sites"
              >
                <Ionicons name="refresh" size={14} color="#006bff" />
                <Text style={styles.siteRetryText}>Couldn&apos;t load dive sites · Tap to retry</Text>
              </TouchableOpacity>
            ) : !diveSitesLoading && diveSiteOptions.length === 0 ? (
              <Text style={styles.siteRetryText}>No dive sites are available right now.</Text>
            ) : null}
            <Dropdown
              label="Diving Difficulty"
              placeholder="Select difficulty"
              value={difficulty}
              options={difficulties}
              onSelect={setDifficulty}
            />
          </View>
          )}

          {/* Boat Details */}
          {isBoatDive && currentStep === 1 && (
          <View style={styles.cardBox}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="boat" size={17} color="#087bff" /></View>
              <View style={styles.sectionTitleCopy}>
                <Text style={styles.cardHeaderTitle}>Boat & Crew</Text>
                <Text style={styles.sectionHint}>Required for a boat dive</Text>
              </View>
            </View>
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
            {/* Crew Members (Exempt from Dive Pass Fee) */}
            <View style={styles.staffHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffHeaderTitle}>Boat Crew Members</Text>
                <Text style={styles.staffHeaderHint}>Add crew onboard (Exempt from dive pass fees)</Text>
              </View>
              <View style={styles.exemptTag}>
                <Text style={styles.exemptTagText}>Fee Exempt</Text>
              </View>
            </View>

            {crewMembers.map((member, idx) => (
              <View key={`crew-${idx}`} style={styles.staffInputRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label={`Crew Member #${idx + 1}`}
                    placeholder="e.g. Juan Dela Cruz"
                    value={member}
                    onChangeText={(val) => {
                      const updated = [...crewMembers];
                      updated[idx] = val;
                      setCrewMembers(updated);
                    }}
                  />
                </View>
                <TouchableOpacity
                  style={styles.staffDeleteBtn}
                  onPress={() => {
                    const updated = crewMembers.filter((_, i) => i !== idx);
                    setCrewMembers(updated);
                  }}
                  accessibilityLabel={`Remove crew member ${idx + 1}`}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addStaffBtn}
              onPress={() => setCrewMembers([...crewMembers, ""])}
            >
              <Ionicons name="add-circle-outline" size={16} color="#006bff" />
              <Text style={styles.addStaffBtnText}>+ Add Boat Crew Member</Text>
            </TouchableOpacity>
            <TextInput
              label="Boat Contact #"
              placeholder="9XXXXXXXXX"
              prefix="+63"
              maxLength={10}
              keyboardType="phone-pad"
              value={boatContact}
              onChangeText={(v) => setBoatContact(toLocalPhDigits(v))}
            />
          </View>
          )}

          {/* Diver List Section */}
          {currentStep === diverStepIndex && (
          <>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.diverSectionTitle}>
              <View style={styles.sectionIcon}><Ionicons name="people" size={17} color="#087bff" /></View>
              <View style={styles.sectionTitleCopy}>
                <Text style={styles.sectionHeading}>Divers</Text>
                <Text style={styles.sectionHint}>{divers.length} added · {maxDiversDisplay} maximum</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.orangeAddPill}
              activeOpacity={0.85}
              onPress={() => setShowAddModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Add diver"
            >
              <Ionicons name="add" size={17} color="#FFFFFF" />
              <Text style={styles.orangeAddPillText}>Add Diver</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.capacityCard}>
            <View style={styles.capacityTopRow}>
              <View style={styles.capacityCopy}>
                <Text style={styles.capacityTitle}>Group capacity</Text>
                <Text style={styles.capacityHint}>{divers.length} of {maxDiversDisplay} spots filled</Text>
              </View>
              <View style={styles.capacityInputWrap}>
                <NativeInput
                  value={maxDivers}
                  onChangeText={setMaxDivers}
                  keyboardType="number-pad"
                  style={styles.capacityInput}
                  accessibilityLabel="Maximum divers for this manifest"
                />
                <Text style={styles.capacityUnit}>max</Text>
              </View>
            </View>
            <View style={styles.capacityProgressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: maxDiversValid ? maxDiversNum : 0, now: divers.length }}>
              <View style={[styles.capacityProgressFill, { width: `${capacityPercent}%` }]} />
            </View>
          </View>

          <View style={styles.diverCardList}>
            {divers.length === 0 && (
              <View style={styles.noDiversCard}>
                <Ionicons name="person-add-outline" size={22} color="#1682ff" />
                <Text style={styles.noDiversText}>
                  No divers added yet. Search for a registered tourist or add a walk-in.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddButton}
                  onPress={() => setShowAddModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Add the first diver"
                >
                  <Text style={styles.emptyAddText}>Add the first diver</Text>
                </TouchableOpacity>
              </View>
            )}
            {divers.map((d) => {
              const covered = isCovered(d);
              const assigned = isAssigned(d);
              const assignable = !!d.touristId && !d.isWalkIn && !covered;
              const editing = editingDiverId === d.id;
              return (
                <View key={d.id} style={styles.diverCard}>
                  <View style={styles.diverAvatar}>
                    <Text style={styles.diverAvatarText}>{getInitials(d.name)}</Text>
                  </View>
                  <View style={styles.diverContent}>
                    <Text style={styles.diverCardName}>{d.name}</Text>
                    <Text style={styles.diverCardMeta}>
                      {d.meta || buildDiverMeta(d)}
                    </Text>
                    {!d.isWalkIn && d.touristId && (
                      <TouchableOpacity
                        onPress={() => setEditingDiverId(editing ? null : d.id)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={editing ? `Done editing ${d.name}` : `Edit nationality and dive level for ${d.name}`}
                      >
                        <Text style={styles.editAttrsLink}>
                          {editing ? "Done" : "Edit nationality · dive level"}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {editing && (
                      <View style={styles.attrEditRow}>
                        <View style={{ flex: 1 }}>
                          <Dropdown
                            label="Nationality"
                            value={
                              nationalities.some((n) => n.value === d.nationality)
                                ? (d.nationality as string)
                                : "Other"
                            }
                            options={nationalities}
                            onSelect={(v) => updateDiverAttrs(d.id, { nationality: v })}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Dropdown
                            label="Dive Level"
                            value={d.diveLevel || "Fun Dive"}
                            options={diveLevels}
                            onSelect={(v) => updateDiverAttrs(d.id, { diveLevel: v })}
                          />
                        </View>
                      </View>
                    )}
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
          </>
          )}

          {/* Duty of Care */}
          {currentStep === reviewStepIndex && (
          <>
          <View style={styles.cardBox}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="shield-checkmark" size={17} color="#087bff" /></View>
              <View style={styles.sectionTitleCopy}>
                <Text style={styles.cardHeaderTitle}>Duty of Care</Text>
                <Text style={styles.sectionHint}>Instructor and optional briefing notes</Text>
              </View>
            </View>
            {/* Dive Masters / Instructors (Exempt from Dive Pass Fee) */}
            <View style={styles.staffHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffHeaderTitle}>Dive Master(s) / Instructor(s)</Text>
                <Text style={styles.staffHeaderHint}>Dive professionals leading trip (Exempt from pass fees)</Text>
              </View>
              <View style={styles.exemptTag}>
                <Text style={styles.exemptTagText}>Fee Exempt</Text>
              </View>
            </View>

            {diveMasters.map((dm, idx) => (
              <View key={`dm-${idx}`} style={styles.staffInputRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label={`Dive Master / Instructor #${idx + 1}`}
                    placeholder="e.g. Instructor Marco Valerio"
                    value={dm}
                    onChangeText={(val) => {
                      const updated = [...diveMasters];
                      updated[idx] = val;
                      setDiveMasters(updated);
                      if (idx === 0) setInstructorName(val);
                    }}
                  />
                </View>
                {diveMasters.length > 1 && (
                  <TouchableOpacity
                    style={styles.staffDeleteBtn}
                    onPress={() => {
                      const updated = diveMasters.filter((_, i) => i !== idx);
                      setDiveMasters(updated);
                      if (updated[0]) setInstructorName(updated[0]);
                    }}
                    accessibilityLabel={`Remove dive master ${idx + 1}`}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <View style={styles.dmButtonsRow}>
              <TouchableOpacity
                style={styles.selectDmBtn}
                onPress={() => {
                  setShowDmModal(true);
                  searchDiveMasters("");
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.selectDmBtnText}>+ Select Dive Master / Instructor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addStaffBtn}
                onPress={() => setDiveMasters([...diveMasters, ""])}
              >
                <Ionicons name="add-circle-outline" size={16} color="#006bff" />
                <Text style={styles.addStaffBtnText}>+ Add Walk-in Dive Master / Instructor</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              label="Duty of Care Notes (optional)"
              placeholder="Briefing points or relevant safety notes"
              value={dutyNotes}
              onChangeText={setDutyNotes}
              multiline
            />
          </View>

          <View style={styles.cardBox}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="clipboard-outline" size={17} color="#087bff" /></View>
              <View style={styles.sectionTitleCopy}>
                <Text style={styles.cardHeaderTitle}>Review Manifest</Text>
                <Text style={styles.sectionHint}>Confirm the trip and diver details before submitting</Text>
              </View>
            </View>
            <View style={styles.reviewList}>
              {[
                ["Dive", `${diveDate} · ${diveType} · ${diveMode}`],
                ["Location", `${location} · ${difficulty}`],
                ...(isBoatDive ? [["Boat", `${boatName} · ${captainName}`]] : []),
                ["Divers", `${divers.length} of ${maxDiversDisplay} spots`],
              ].map(([label, value]) => (
                <View key={label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{label}</Text>
                  <Text style={styles.reviewValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Passes & Submission */}
          <View style={styles.cardBox}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIcon}><Ionicons name="ticket" size={17} color="#087bff" /></View>
              <View style={styles.sectionTitleCopy}>
                <Text style={styles.cardHeaderTitle}>Passes & Submission</Text>
                <Text style={styles.sectionHint}>Review pass use before submitting</Text>
              </View>
            </View>
            <View style={styles.deductionBanner}>
              <View style={styles.deductionIcon}><Ionicons name="ticket-outline" size={17} color="#16835e" /></View>
              <View style={styles.deductionCopy}>
                <Text style={styles.deductionText}>
                  {passesLoading
                    ? "Checking your dive passes?"
                    : `${passesNeeded} dive pass${passesNeeded === 1 ? "" : "es"} will be deducted. Remaining after submission: ${Math.max(0, remainingPasses - passesNeeded)} passes`}
                </Text>
                {annualSlots > 0 && !passesLoading && (
                  <Text style={styles.deductionSub}>
                    {annualSlots} annual slot{annualSlots === 1 ? "" : "s"} available
                  </Text>
                )}
              </View>
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

          </View>
          </>
          )}

        </ContentContainer>
      </ScrollView>

      <View style={styles.wizardFooter}>
        {error ? (
          <View style={styles.wizardErrorBox}>
            <Ionicons name="alert-circle" size={16} color="#b6223a" />
            <Text style={styles.wizardError}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.draftBtn}
          activeOpacity={0.85}
          onPress={handleSaveDraft}
          accessibilityRole="button"
          accessibilityLabel="Save draft on this device"
        >
          <Ionicons name={draftSavedTick ? "checkmark-circle" : "save-outline"} size={17} color="#006bff" />
          <Text style={styles.draftBtnText}>
            {draftSavedTick ? "Draft saved on this device" : "Save Draft"}
          </Text>
        </TouchableOpacity>
        <View style={styles.wizardNavRow}>
          {currentStep > 0 ? (
            <TouchableOpacity
              style={styles.wizardBackBtn}
              onPress={goToPreviousStep}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Go to previous step"
            >
              <Ionicons name="arrow-back" size={17} color="#006bff" />
              <Text style={styles.wizardBackText}>Back</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[
              styles.wizardNextBtn,
              currentStep === 0 && styles.wizardNextBtnFirst,
            currentStep === reviewStepIndex && (!canSubmit || saving) && styles.wizardActionDisabled,
            ]}
            activeOpacity={0.88}
            onPress={currentStep === reviewStepIndex ? handleSubmit : goToNextStep}
            disabled={currentStep === reviewStepIndex && (!canSubmit || saving)}
            accessibilityRole="button"
            accessibilityLabel={currentStep === reviewStepIndex ? "Submit manifest" : `Continue to ${wizardSteps[currentStep + 1]}`}
            accessibilityState={{ disabled: currentStep === reviewStepIndex && (!canSubmit || saving) }}
          >
            {currentStep === reviewStepIndex && saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.wizardNextText}>{currentStep === reviewStepIndex ? "Submit Manifest" : "Continue"}</Text>
                <Ionicons name={currentStep === reviewStepIndex ? "checkmark" : "arrow-forward"} size={17} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>

      {/* Add Diver Modal matching add-diver-divemanifesto.jpg */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>Add Diver to Manifest</Text>
            <Text style={styles.modalSubheading}>
              Search existing tourist or encode new
            </Text>

            <ScrollView
              style={styles.modalContentScroll}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

            {/* Search Tourist: name contains-match + exact Eco-Dive ID */}
            <Text style={styles.fieldTitle}>Search Tourist (Name or exact Eco-Dive ID)</Text>
            <View style={styles.searchBarWrap}>
              <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <NativeInput
                style={styles.nativeSearchInput}
                placeholder="Name or full Eco-Dive ID (e.g. ECO-2026-…)"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={searchTourists}
                autoCapitalize="characters"
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
                {searchResults.map((item: { id: string; full_name: string; _ecoMatch?: boolean }) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectSearchResult(item)}
                  >
                    <Ionicons name="person" size={16} color={colors.primaryBlue} />
                    <Text style={styles.resultItemName}>{item.full_name}</Text>
                    {item._ecoMatch && (
                      <View style={styles.ecoMatchBadge}>
                        <Text style={styles.ecoMatchText}>Eco-ID ✓</Text>
                      </View>
                    )}
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

            </ScrollView>

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

      {/* Select Registered Dive Master Modal */}
      <Modal
        visible={showDmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalHeading}>Select Dive Master / Instructor</Text>
                <Text style={styles.modalSubheading}>
                  Add accredited dive masters & instructors from tourist profiles
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDmModal(false)}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.dmSearchContainer}>
              <View style={styles.searchBarWrap}>
                <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                <NativeInput
                  style={styles.nativeSearchInput}
                  placeholder="Search by name..."
                  placeholderTextColor="#94A3B8"
                  value={dmSearchQuery}
                  onChangeText={searchDiveMasters}
                />
                {dmSearching && <ActivityIndicator size="small" color={colors.primaryBlue} />}
              </View>
            </View>

            <ScrollView
              style={styles.dmResultsScroll}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 10 }}
              keyboardShouldPersistTaps="handled"
            >
              {dmSearchError && (
                <Text style={styles.searchErrorText}>Failed to load dive masters. Check connection.</Text>
              )}
              {dmSearchResults.length === 0 && !dmSearching && (
                <View style={styles.dmEmptyBox}>
                  <Ionicons name="person-circle-outline" size={44} color="#94A3B8" />
                  <Text style={styles.dmEmptyTitle}>No registered dive masters or instructors found</Text>
                  <Text style={styles.dmEmptySubtitle}>
                    {dmSearchQuery
                      ? "Try searching for another name or encode them manually as a walk-in."
                      : "Registered dive masters / instructors will appear here."}
                  </Text>
                </View>
              )}

              {dmSearchResults.map((dm) => {
                const hasPcssd = Boolean(dm.pcssd_url || dm.pcssd_accreditation_no);
                const hasPermit = Boolean(dm.permit_to_operate_url || dm.permit_to_operate_no);
                const levelLabel = "Dive Master / Instructor";

                return (
                  <TouchableOpacity
                    key={dm.id}
                    style={styles.dmResultCard}
                    onPress={() => handleSelectDiveMaster(dm)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dmResultAvatar}>
                      <Ionicons name="person" size={20} color="#0066FF" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={styles.dmResultName} numberOfLines={1}>{dm.full_name}</Text>
                        <View style={styles.dmLevelBadge}>
                          <Text style={styles.dmLevelBadgeText}>{levelLabel}</Text>
                        </View>
                      </View>

                      {/* Accreditation Badges */}
                      <View style={styles.dmBadgesRow}>
                        {hasPcssd ? (
                          <View style={styles.dmPcssdBadge}>
                            <Ionicons name="shield-checkmark" size={11} color="#15803D" />
                            <Text style={styles.dmPcssdBadgeText}>
                              PCSSD {dm.pcssd_accreditation_no ? `#${dm.pcssd_accreditation_no}` : "Accredited"}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.dmNoCertBadge}>
                            <Text style={styles.dmNoCertBadgeText}>No PCSSD File</Text>
                          </View>
                        )}

                        {hasPermit ? (
                          <View style={styles.dmPermitBadge}>
                            <Ionicons name="document-text" size={11} color="#0369A1" />
                            <Text style={styles.dmPermitBadgeText}>
                              Permit {dm.permit_to_operate_no ? `#${dm.permit_to_operate_no}` : "Verified"}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.dmAddPill}>
                      <Text style={styles.dmAddPillText}>+ Add</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fd" },
  container: { flex: 1 },
  scrollContent: { paddingTop: 18, paddingBottom: 30 },
  topBar: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#e8eef6",
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7f3ff",
  },
  headerTitles: { flex: 1, minWidth: 0 },
  headerEyebrow: { fontSize: 9, letterSpacing: 0.9, fontFamily: "Quicksand_700Bold", color: "#7890b2", marginBottom: 2 },
  headerTitle: {
    fontSize: 19,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#647797",
    marginTop: 2,
  },
  formBody: { flex: 1 },
  twoColRow: { flexDirection: "column", gap: 2, marginBottom: 0 },
  cardBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7edf5",
    padding: 18,
    marginTop: 3,
    marginBottom: 16,
    gap: 15,
    shadowColor: "#4089dc",
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  progressCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e7edf5",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#2f5684",
    shadowOpacity: 0.045,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  progressHeadingRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    marginBottom: 14,
  },
  progressTitleGroup: { gap: 2 },
  progressEyebrow: { fontSize: 9, letterSpacing: 0.8, fontFamily: "Quicksand_700Bold", color: "#8191a9" },
  progressCurrent: { flexShrink: 1, fontSize: 17, fontFamily: "Quicksand_700Bold", color: "#102e59" },
  progressDescription: { fontSize: 11, lineHeight: 15, fontFamily: "Quicksand_500Medium", color: "#70819a" },
  progressSteps: { flexDirection: "row", gap: 2, alignItems: "flex-start" },
  progressStep: { flex: 1, minWidth: 0, alignItems: "center", gap: 6, position: "relative" },
  progressNode: { width: 25, height: 25, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f4f8", borderWidth: 1, borderColor: "#e0e7f0", zIndex: 1 },
  progressNodeActive: { backgroundColor: "#176fe8", borderColor: "#176fe8", shadowColor: "#176fe8", shadowOpacity: 0.2, shadowRadius: 5, elevation: 2 },
  progressNodeComplete: { backgroundColor: "#21a67a", borderColor: "#21a67a" },
  progressNodeText: { fontSize: 10, fontFamily: "Quicksand_700Bold", color: "#8795a9" },
  progressNodeTextActive: { color: "#FFFFFF" },
  progressConnector: { position: "absolute", height: 2, left: "50%", right: "-50%", top: 12, backgroundColor: "#e3eaf2" },
  progressConnectorComplete: { backgroundColor: "#8bd8bc" },
  progressStepLabel: { maxWidth: "100%", fontSize: 8.5, lineHeight: 11, fontFamily: "Quicksand_600SemiBold", color: "#8795a9", textAlign: "center" },
  progressStepLabelActive: { color: "#176fe8", fontFamily: "Quicksand_700Bold" },
  progressStepLabelComplete: { color: "#16835e" },
  capacityCard: {
    minHeight: 88,
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 11,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#e5edf7",
    backgroundColor: "#fbfdff",
  },
  capacityTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  capacityProgressTrack: { height: 6, borderRadius: 5, overflow: "hidden", backgroundColor: "#e8eff7" },
  capacityProgressFill: { height: "100%", borderRadius: 5, backgroundColor: "#2177ea" },
  capacityCopy: { flex: 1, minWidth: 0 },
  capacityTitle: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  capacityHint: { fontSize: 9.5, lineHeight: 13, fontFamily: "Quicksand_500Medium", color: "#7183a4", marginTop: 2 },
  capacityInputWrap: {
    minWidth: 86,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce6f1",
    backgroundColor: "#FFFFFF",
  },
  capacityInput: { flex: 1, minWidth: 0, padding: 0, textAlign: "center", fontSize: 13, fontFamily: "Quicksand_700Bold", color: "#07156c", outlineStyle: "none" as any, outlineWidth: 0 },
  capacityUnit: { fontSize: 9, fontFamily: "Quicksand_600SemiBold", color: "#7183a4" },
  wizardFooter: {
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 10,
    gap: 7,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#e7edf5",
    shadowColor: "#21456c",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  wizardErrorBox: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11, backgroundColor: "#fff1f2", borderWidth: 1, borderColor: "#ffe0e4" },
  wizardError: { flexShrink: 1, fontSize: 10.5, lineHeight: 14, fontFamily: "Quicksand_600SemiBold", color: "#b6223a", textAlign: "center" },
  wizardNavRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  wizardBackBtn: {
    minHeight: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1.3,
    borderColor: "#9dc5ff",
    backgroundColor: "#FFFFFF",
  },
  wizardBackText: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  wizardNextBtn: {
    minHeight: 48,
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: "#087bff",
    shadowColor: "#0065fa",
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  wizardNextBtnFirst: { flex: 1 },
  wizardActionDisabled: { opacity: 0.48 },
  wizardNextText: { fontSize: 12.5, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
  reviewList: { gap: 0, marginTop: 3, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#f7faff" },
  reviewRow: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: "#e8eef6" },
  reviewLabel: { width: 62, fontSize: 10, fontFamily: "Quicksand_700Bold", color: "#8191a9" },
  reviewValue: { flex: 1, fontSize: 10.5, lineHeight: 15, fontFamily: "Quicksand_600SemiBold", color: "#17366e" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  sectionIcon: {
    width: 40,
    height: 40,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: "#edf5ff",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitleCopy: { flex: 1, minWidth: 0 },
  cardHeaderTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: "#07156c",
  },
  sectionHint: {
    fontSize: 10.5,
    lineHeight: 15,
    fontFamily: "Quicksand_500Medium",
    color: "#7183a4",
    marginTop: 2,
  },
  manualSiteWrap: {
    gap: 4,
  },
  manualSiteToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: -4,
    marginBottom: 8,
  },
  manualSiteToggleText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
  staffHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  staffHeaderTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#0F2E6B",
  },
  staffHeaderHint: {
    fontSize: 11,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  exemptTag: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  exemptTagText: {
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
    color: "#166534",
  },
  staffInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  staffDeleteBtn: {
    padding: 10,
    marginBottom: 8,
  },
  addStaffBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  addStaffBtnText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#006bff",
  },
  dmButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6,
    marginBottom: 8,
  },
  selectDmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0066FF",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  selectDmBtnText: {
    fontSize: 12,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  dmSearchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dmResultsScroll: {
    maxHeight: 380,
    paddingTop: 12,
  },
  dmResultCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dmResultAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  dmResultName: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    flexShrink: 1,
  },
  dmLevelBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dmLevelBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#0066FF",
  },
  dmBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  dmPcssdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dmPcssdBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#166534",
  },
  dmNoCertBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dmNoCertBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
  },
  dmPermitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dmPermitBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#0369A1",
  },
  dmAddPill: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dmAddPillText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: "#FFFFFF",
  },
  dmEmptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  dmEmptyTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: "#475569",
  },
  dmEmptySubtitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  siteRetryButton: {
    minHeight: 38,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: "#eef6ff",
  },
  siteRetryText: { fontSize: 10.5, lineHeight: 15, fontFamily: "Quicksand_600SemiBold", color: "#006bff" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 9,
  },
  diverSectionTitle: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 9 },
  sectionHeading: { fontSize: 15, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  orangeAddPill: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 10,
    borderRadius: 13,
    backgroundColor: "#087bff",
  },
  orangeAddPillText: { fontSize: 10.5, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
  diverCardList: { gap: 9, marginBottom: 12 },
  diverCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#e8edf4",
    padding: 13,
    gap: 9,
    shadowColor: "#334e70",
    shadowOpacity: 0.035,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  diverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#e7f3ff",
    alignItems: "center",
    justifyContent: "center",
  },
  diverAvatarText: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  diverContent: { flex: 1, minWidth: 0 },
  diverCardName: { fontSize: 13, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  diverCardMeta: { fontSize: 10, lineHeight: 14, fontFamily: "Quicksand_500Medium", color: "#647797", marginTop: 2 },
  editAttrsLink: { fontSize: 10.5, fontFamily: "Quicksand_700Bold", color: "#006bff", marginTop: 5 },
  attrEditRow: { flexDirection: "column", gap: 0, marginTop: 8 },
  activePill: { backgroundColor: "#dcfce7", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 },
  activePillText: { fontSize: 8, fontFamily: "Quicksand_700Bold", color: "#16835e" },
  noDiversCard: {
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#b6d6fa",
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  noDiversText: { fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_500Medium", color: "#647797", textAlign: "center", marginTop: 8 },
  emptyAddButton: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, marginTop: 4 },
  emptyAddText: { fontSize: 11, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  diverBadges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 5 },
  annualBadge: { borderRadius: 10, backgroundColor: "#dcfce7", paddingVertical: 3, paddingHorizontal: 8 },
  annualText: { fontSize: 9, fontFamily: "Quicksand_700Bold", color: "#16835e" },
  assignBadge: { minHeight: 28, justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#75adff", paddingVertical: 4, paddingHorizontal: 8 },
  assignBadgeActive: { backgroundColor: "#087bff", borderColor: "#087bff" },
  assignText: { fontSize: 9, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  assignTextActive: { color: "#FFFFFF" },
  deductionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0faf6",
    borderWidth: 1,
    borderColor: "#d4eee3",
    borderRadius: 16,
    padding: 14,
    marginTop: 2,
    marginBottom: 5,
  },
  deductionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#d7f4e8" },
  deductionCopy: { flex: 1, minWidth: 0 },
  deductionText: { fontSize: 10.5, lineHeight: 15, fontFamily: "Quicksand_600SemiBold", color: "#16835e" },
  deductionSub: { fontSize: 10, fontFamily: "Quicksand_700Bold", color: "#16835e", marginTop: 3 },
  passesErrorRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 },
  retryText: { fontSize: 11, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  insufficientText: { fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_600SemiBold", color: "#b6223a", textAlign: "center", marginBottom: 7 },
  searchErrorText: { fontSize: 11, lineHeight: 15, fontFamily: "Quicksand_500Medium", color: "#b6223a", marginTop: 5 },
  draftBtn: {
    minHeight: 38,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  draftBtnText: { fontSize: 11.5, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  errorText: { fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_600SemiBold", color: "#b6223a", textAlign: "center", marginBottom: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(5,23,59,0.58)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  modalBox: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "94%",
    flexShrink: 1,
    backgroundColor: "#f4f9ff",
    borderRadius: 22,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    shadowColor: "#153d75",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modalHeading: { fontSize: 17, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  modalSubheading: { fontSize: 11, lineHeight: 15, fontFamily: "Quicksand_500Medium", color: "#647797", marginTop: 2, marginBottom: 8 },
  modalContentScroll: { flexShrink: 1, minHeight: 0 },
  modalContent: { paddingBottom: 8 },
  fieldTitle: { fontSize: 10.5, fontFamily: "Quicksand_700Bold", color: "#31466e", marginBottom: 5 },
  searchBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbdcf0",
    borderRadius: 13,
    paddingHorizontal: 12,
    minHeight: 46,
    backgroundColor: "#FFFFFF",
    marginBottom: 7,
  },
  nativeSearchInput: { flex: 1, minWidth: 0, fontSize: 12, fontFamily: "Quicksand_500Medium", color: "#07156c", outlineStyle: "none" as any, outlineWidth: 0 },
  resultsDrop: { borderWidth: 1, borderColor: "#dce8f5", borderRadius: 13, backgroundColor: "#FFFFFF", marginBottom: 8, overflow: "hidden" },
  resultItem: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#edf2f8" },
  resultItemName: { flex: 1, fontSize: 11.5, fontFamily: "Quicksand_600SemiBold", color: "#07156c" },
  ecoMatchBadge: { borderRadius: 10, backgroundColor: "#dcfce7", paddingVertical: 3, paddingHorizontal: 8, marginLeft: "auto" },
  ecoMatchText: { fontSize: 9, fontFamily: "Quicksand_700Bold", color: "#16835e" },
  orEncodeLabel: { fontSize: 10.5, lineHeight: 15, fontFamily: "Quicksand_600SemiBold", color: "#526789", marginVertical: 8 },
  modalBtnRow: { flexDirection: "row", gap: 9, marginTop: 8 },
  modalCancelBtn: { flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1.3, borderColor: "#9dc5ff", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 11.5, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  modalAddBtn: { flex: 1.4, minHeight: 46, borderRadius: 13, backgroundColor: "#087bff", alignItems: "center", justifyContent: "center" },
  modalAddText: { fontSize: 11.5, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
});
