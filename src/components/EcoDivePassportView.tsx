import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { deriveEffectiveEcoStatus } from "../lib/ecoIdExpiry";
import { pickAvatarImage } from "../lib/pickAvatar";
import { captureAndDownload, loadImageAsBase64 } from "../lib/snapshot";
import { uploadFile } from "../lib/storage";
import { supabase } from "../lib/supabase";
import ContentContainer from "./ContentContainer";
import { resolveSiteImage } from "./DiveSiteCard";
import { ErrorState } from "./ErrorState";

const ID_CARD_TEMPLATE = require("../../assets/id/Sinsay Dive Pass Card Template.png");
const SINSAY_WHITE_LOGO = require("../../assets/SINSAY white logo.png");

const NATIONALITY_LABELS: Record<string, string> = {
  filipino: "Filipino",
  american: "American",
  japanese: "Japanese",
  korean: "Korean",
  chinese: "Chinese",
  australian: "Australian",
  european: "European",
  other: "International",
};

const DIVE_TYPE_LABELS: Record<string, string> = {
  "fun-intro-guest": "Fun Dive / Intro Dive / Guest",
  "instructor-master": "Dive Instructor / Master",
  "dive-master": "Dive Instructor / Master",
  // Legacy / backward-compatibility mappings
  "intro-fun": "Fun Dive / Intro Dive / Guest",
  fun: "Fun Dive / Intro Dive / Guest",
  intro: "Fun Dive / Intro Dive / Guest",
  guest: "Fun Dive / Intro Dive / Guest",
  "guest-tourist": "Fun Dive / Intro Dive / Guest",
  certified: "Dive Instructor / Master",
};

// Fun Dive profiles do not have certification or accreditation dates. Keep
// those details visible for missing or unrecognized legacy values.
const FUN_DIVE_TYPES = new Set([
  "fun-intro-guest",
  "intro-fun",
  "fun",
  "intro",
  "guest",
  "guest-tourist",
  "intro-dive",
  "fun-dive",
]);

const CERT_LEVEL_LABELS: Record<string, string> = {
  "open-water": "Open Water Diver",
  advanced: "Advanced Open Water",
  rescue: "Rescue Diver",
  divemaster: "Dive Master / Instructor",
  "dive-master": "Dive Master / Instructor",
  instructor: "Dive Master / Instructor",
};

export interface DiveTimelineActivity {
  id: string;
  diveNumber: number;
  siteName: string;
  dateTime: string;
  diveCategory: string;
  resortOrCenter: string;
  barangay: string;
  coordinates: string;
  depthRange: string;
  duration: string;
  visibility: string;
  waterTemp: string;
  buddyOrGuide: string;
  imageIndex: number;
  photoUrl?: string | null;
}

function formatCardDate(raw?: string | null): string {
  if (!raw || !raw.trim()) return "—";
  const parsed = new Date(raw.trim());
  if (Number.isNaN(parsed.getTime())) return raw.trim();
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Custom Dive Mask & Snorkel Icon matching the reference card */
function DiveMaskIcon({
  size = 20,
  color = "#0D74E7",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Mask Frame */}
      <Path
        d="M3.5 9.5C3.5 7.8 4.8 6.5 6.5 6.5H15.5C17.2 6.5 18.5 7.8 18.5 9.5V12.2C18.5 13.7 17.3 15 15.7 15H13.3C12.6 15 12 14.5 11.7 13.8L11 12.4L10.3 13.8C10 14.5 9.4 15 8.7 15H6.3C4.7 15 3.5 13.7 3.5 12.2V9.5Z"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Snorkel Tube */}
      <Path
        d="M20.5 5V16.2C20.5 18.4 18.8 20 16.7 20H14.5"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
      />
      <Circle cx="13.5" cy="19.8" r="1.4" fill={color} />
    </Svg>
  );
}

/** Default Vector Portrait Silhouette matching the reference card */
function DefaultAvatarSilhouette() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 120 160"
      preserveAspectRatio="xMidYMax slice"
    >
      <Rect x="0" y="0" width="120" height="160" fill="#C6DAF1" />
      <Circle cx="60" cy="58" r="24" fill="#82A8D9" />
      <Path
        d="M16 144C16 113 34 95 60 95C86 95 104 113 104 144H16Z"
        fill="#82A8D9"
      />
    </Svg>
  );
}

export function EcoDivePassportView() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const {
    user,
    profile,
    ecoId,
    avatarUri,
    setAvatarUri,
    clearAvatarOverride,
    isLoading,
    refreshProfile,
    updateProfile,
  } = useAuth();
  const { t } = useLanguage();

  const [activities, setActivities] = useState<DiveTimelineActivity[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedRecap, setSelectedRecap] =
    useState<DiveTimelineActivity | null>(null);
  const [recapImageBase64, setRecapImageBase64] = useState<string | null>(null);
  const [recapLogoBase64, setRecapLogoBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedRecap) {
      setRecapImageBase64(null);
      return;
    }
    let active = true;

    const rawSource = resolveSiteImage(
      null,
      selectedRecap.photoUrl,
      selectedRecap.imageIndex,
    );
    const assetSource = Image.resolveAssetSource(rawSource);
    const uri =
      assetSource?.uri || (typeof rawSource === "string" ? rawSource : null);
    if (uri) {
      loadImageAsBase64(uri)
        .then((base64) => {
          if (active && base64) setRecapImageBase64(base64);
        })
        .catch(() => {});
    }

    const logoSource = Image.resolveAssetSource(SINSAY_WHITE_LOGO);
    if (logoSource?.uri) {
      loadImageAsBase64(logoSource.uri)
        .then((base64) => {
          if (active && base64) setRecapLogoBase64(base64);
        })
        .catch(() => {});
    }

    return () => {
      active = false;
    };
  }, [selectedRecap]);
  const storyCardRef = useRef<View>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [copiedBanner, setCopiedBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState(t("toast_recap_copied"));

  const [refreshKey, setRefreshKey] = useState(0);
  const [latestManifestDiveDate, setLatestManifestDiveDate] = useState<
    string | null
  >(null);

  const profilePhotoUri = avatarUri;

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      setRefreshKey((k) => k + 1);
      // Self-healing synchronization: check if active pass has expired by date
      Promise.resolve(supabase.rpc("sync_my_eco_dive_id_status"))
        .then(({ data }) => {
          if (data && typeof data === "object" && (data as any).expired) {
            refreshProfile();
          }
        })
        .catch(() => {});
    }, [refreshProfile]),
  );

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/loginpage");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    setHistoryLoading(true);

    const userEcoId = ecoId?.eco_id_number?.trim();
    let diverQuery = supabase
      .from("manifest_divers")
      .select("id, manifest_id, created_at");

    if (userEcoId) {
      diverQuery = diverQuery.or(
        `tourist_id.eq.${user.id},eco_id.eq.${userEcoId}`,
      );
    } else {
      diverQuery = diverQuery.eq("tourist_id", user.id);
    }

    Promise.resolve(diverQuery.order("created_at", { ascending: false }))
      .then(async ({ data: diverRows, error: diverErr }) => {
        if (!active) return;
        if (diverErr || !diverRows || diverRows.length === 0) {
          setActivities([]);
          setHistoryLoading(false);
          return;
        }

        const manifestIds = Array.from(
          new Set(diverRows.map((d) => d.manifest_id).filter(Boolean)),
        );
        if (manifestIds.length === 0) {
          setActivities([]);
          setHistoryLoading(false);
          return;
        }

        const { data: manifestRows, error: manifestErr } = await supabase
          .from("dive_manifests")
          .select("*")
          .in("id", manifestIds);

        if (!active) return;
        if (manifestErr || !manifestRows || manifestRows.length === 0) {
          setActivities([]);
          setHistoryLoading(false);
          return;
        }

        const dates = manifestRows
          .map((m) => m.dive_date)
          .filter(Boolean)
          .sort()
          .reverse();
        if (dates.length > 0) {
          setLatestManifestDiveDate(dates[0]);
        }

        // Sort chronological ascending to assign permanent dive numbers 1..N
        const sortedAsc = [...manifestRows].sort((a, b) => {
          const dateA = new Date(a.dive_date || a.created_at).getTime();
          const dateB = new Date(b.dive_date || b.created_at).getTime();
          return dateA - dateB;
        });

        // Batch fetch establishment names for operators
        const operatorIds = Array.from(
          new Set(sortedAsc.map((m) => m.operator_id).filter(Boolean)),
        );
        let estMap = new Map<string, { name: string }>();
        if (operatorIds.length > 0) {
          const { data: ests } = await supabase
            .from("establishments")
            .select("operator_id, name")
            .in("operator_id", operatorIds);
          if (ests) {
            estMap = new Map(ests.map((e) => [e.operator_id, e]));
          }
        }

        // Batch fetch dive sites for photos & coordinates
        const siteNames = Array.from(
          new Set(sortedAsc.map((m) => m.location).filter(Boolean)),
        );
        let siteMap = new Map<string, any>();
        if (siteNames.length > 0) {
          const { data: sites } = await supabase
            .from("dive_sites")
            .select(
              "name, barangay, depth_range, lat, lng, image_url, photo_url",
            )
            .in("name", siteNames);
          if (sites) {
            siteMap = new Map(
              sites.map((s) => [s.name.toLowerCase().trim(), s]),
            );
          }
        }

        // Assign chronological dive numbers (1..total)
        const mappedAsc: DiveTimelineActivity[] = sortedAsc.map((m, idx) => {
          const dt = new Date(m.dive_date || m.created_at);
          const formattedDate = dt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const est = estMap.get(m.operator_id);
          const site = siteMap.get((m.location || "").toLowerCase().trim());

          const guideName =
            m.instructor_name ||
            (m.dive_masters && m.dive_masters.length
              ? m.dive_masters[0]
              : null) ||
            m.captain_name ||
            "Accredited Dive Guide";

          return {
            id: m.id,
            diveNumber: idx + 1,
            siteName: m.location || "Mabini Marine Sanctuary",
            dateTime: `${formattedDate} • 09:00 AM`,
            diveCategory: `${m.dive_type || "Recreational Dive"} • ${m.dive_mode || "Boat Dive"}`,
            resortOrCenter:
              est?.name ||
              (m.boat_name
                ? `${m.boat_name} Dive Center`
                : "Mabini Accredited Dive Center"),
            barangay: site?.barangay
              ? `${site.barangay}, Mabini`
              : "Mabini Marine Sanctuary, Batangas",
            coordinates:
              site?.lat && site?.lng
                ? `${site.lat.toFixed(4)}° N, ${site.lng.toFixed(4)}° E`
                : "13.7242° N, 120.8764° E",
            depthRange:
              site?.depth_range ||
              (m.difficulty === "Advanced" ? "18–32m" : "12–24m"),
            duration: "45 mins",
            visibility: "20m Clear",
            waterTemp: "28°C",
            buddyOrGuide: guideName,
            imageIndex: idx % 3,
            photoUrl: site?.photo_url || site?.image_url || null,
          };
        });

        // Present newest dive first (Dive #N at the top)
        const mappedDesc = mappedAsc.reverse();
        setActivities(mappedDesc);
        setHistoryLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Failed to load dive history:", err);
        setActivities([]);
        setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, ecoId?.eco_id_number, refreshKey]);

  const handlePickProfilePhoto = useCallback(async () => {
    const result = await pickAvatarImage();
    if (!result) return;
    if (!result.ok) {
      setToastMessage(result.error);
      setCopiedBanner(true);
      setTimeout(() => setCopiedBanner(false), 2600);
      return;
    }
    setAvatarUri(result.uri, result.blob);
    if (user) {
      const fileInfo = {
        name: `avatar_${Date.now()}.jpg`,
        mimeType: result.blob?.type || "image/jpeg",
        size: result.blob?.size || 1024,
        uri: result.uri,
      };
      const uploadRes = await uploadFile(
        "operator_media",
        "profile-avatar",
        fileInfo,
        user.id,
      );
      if (uploadRes.path) {
        await updateProfile({ avatar_path: uploadRes.path });
        clearAvatarOverride(user.id);
        setToastMessage(t("toast_eco_photo_saved"));
        setCopiedBanner(true);
        setTimeout(() => setCopiedBanner(false), 2600);
      }
    }
  }, [setAvatarUri, user, updateProfile, clearAvatarOverride, t]);

  const handleSaveRecapImage = useCallback(
    async (activity: DiveTimelineActivity) => {
      if (!storyCardRef.current || isSavingImage) return;
      setIsSavingImage(true);
      try {
        let needsSettle = false;

        // 1. Guarantee background dive photo base64 is resolved before snapshot
        let bgBase64 = recapImageBase64;
        if (!bgBase64) {
          const rawSource = resolveSiteImage(
            null,
            activity.photoUrl,
            activity.imageIndex,
          );
          const assetSource = Image.resolveAssetSource(rawSource);
          const uri =
            assetSource?.uri ||
            (typeof rawSource === "string" ? rawSource : null);
          if (uri) {
            bgBase64 = await loadImageAsBase64(uri);
            if (bgBase64) {
              setRecapImageBase64(bgBase64);
              needsSettle = true;
            }
          }
        }

        // 2. Guarantee brand logo base64 is resolved before snapshot
        let logoBase64 = recapLogoBase64;
        if (!logoBase64) {
          const logoSource = Image.resolveAssetSource(SINSAY_WHITE_LOGO);
          if (logoSource?.uri) {
            logoBase64 = await loadImageAsBase64(logoSource.uri);
            if (logoBase64) {
              setRecapLogoBase64(logoBase64);
              needsSettle = true;
            }
          }
        }

        if (needsSettle) {
          await new Promise((r) => setTimeout(r, 100));
        }

        const safeName = (activity.siteName || "mabini")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        const fileName = `sinsay-recap-dive-${String(activity.diveNumber).padStart(2, "0")}-${safeName}.png`;
        await captureAndDownload(storyCardRef.current, fileName);
        setToastMessage(t("toast_recap_saved"));
        setCopiedBanner(true);
        setTimeout(() => setCopiedBanner(false), 2600);
      } catch (e) {
        console.warn("Failed to save recap image:", e);
        setToastMessage(
          e instanceof Error ? e.message : t("save_image_error"),
        );
        setCopiedBanner(true);
        setTimeout(() => setCopiedBanner(false), 2600);
      } finally {
        setIsSavingImage(false);
      }
    },
    [isSavingImage, recapImageBase64, recapLogoBase64, t],
  );

  // Effective date-aware status (prevents expired One-Day passes from showing active)
  const effectiveStatus = useMemo(() => {
    return deriveEffectiveEcoStatus({
      dbStatus: ecoId?.status,
      passType: profile?.dive_pass_type,
      latestManifestDiveDate,
      annualValidUntil: profile?.renewal_date || null,
    });
  }, [
    ecoId?.status,
    profile?.dive_pass_type,
    latestManifestDiveDate,
    profile?.renewal_date,
  ]);

  const isIdActive = effectiveStatus === "active";
  const isIdExpired = effectiveStatus === "expired";
  const showCertificationDetails = !FUN_DIVE_TYPES.has(
    profile?.type_of_dive?.trim().toLowerCase() ?? "",
  );

  // Dynamic values for the ID card matching the reference layout
  const cardData = useMemo(() => {
    const fullName = profile?.full_name?.trim() || "—";
    const nationality =
      (profile?.nationality &&
        NATIONALITY_LABELS[profile.nationality.toLowerCase()]) ||
      profile?.nationality ||
      "—";
    const typeOfDive =
      (profile?.type_of_dive &&
        DIVE_TYPE_LABELS[profile.type_of_dive.toLowerCase()]) ||
      profile?.type_of_dive ||
      "—";
    const certLevel =
      (profile?.certification_level &&
        CERT_LEVEL_LABELS[profile.certification_level.toLowerCase()]) ||
      profile?.certification_level ||
      (profile?.type_of_dive === "instructor-master" ||
      profile?.type_of_dive === "dive-master"
        ? "Dive Master / Instructor"
        : "—");
    const dateAccredited = formatCardDate(profile?.date_accredited);
    const renewalDate = formatCardDate(profile?.renewal_date);
    const emergencyName = profile?.emergency_contact_name?.trim() || "—";
    const emergencyNumber = profile?.emergency_contact_number?.trim() || "—";

    return {
      fullName,
      nationality,
      typeOfDive,
      certLevel,
      dateAccredited,
      renewalDate,
      emergencyName,
      emergencyNumber,
    };
  }, [profile]);

  // Compute dive profile completion progress (0% - 100%)
  const { completionProgress, isProfileComplete, missingStepHint } =
    useMemo(() => {
      if (!profile) {
        return {
          completionProgress: 0,
          isProfileComplete: false,
          missingStepHint: t("hint_profile_missing"),
        };
      }
      const hasName = Boolean(profile.full_name?.trim());
      const hasNationality = Boolean(profile.nationality?.trim());
      const hasEmergency = Boolean(
        profile.emergency_contact_name?.trim() &&
        profile.emergency_contact_number?.trim(),
      );
      const hasDiveType = Boolean(profile.type_of_dive?.trim());
      const isInstructorMasterPath =
        profile.type_of_dive === "instructor-master" ||
        profile.type_of_dive === "dive-master" ||
        profile.type_of_dive === "certified";
      const hasCertDetails = !isInstructorMasterPath
        ? hasDiveType
        : Boolean(
            (profile.pcssd_accreditation_no?.trim() ||
              profile.pcssd_url?.trim()) &&
            (profile.permit_to_operate_no?.trim() ||
              profile.permit_to_operate_url?.trim()),
          );

      const checks = [
        hasName,
        hasNationality,
        hasEmergency,
        hasDiveType,
        hasCertDetails,
      ];
      const completedCount = checks.filter(Boolean).length;
      const pct = Math.round((completedCount / checks.length) * 100);

      let hint = t("hint_profile_complete");
      if (!hasNationality || !hasEmergency) {
        hint = t("hint_nationality_emergency");
      } else if (!hasDiveType) {
        hint = t("hint_dive_category");
      } else if (isInstructorMasterPath && !hasCertDetails) {
        hint = t("hint_instructor_master");
      }

      return {
        completionProgress: pct,
        isProfileComplete: pct >= 100,
        missingStepHint: hint,
      };
    }, [profile, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ErrorState
          message="Unable to load profile data."
          description="Your account may not be fully set up. Please contact support or try again."
          onRetry={() => refreshProfile()}
        />
      </SafeAreaView>
    );
  }

  // Proportional geometry derived directly from the card's blank center height so rows fill the space cleanly without overlapping
  const cardWidth = Math.min(screenWidth - 32, 528);
  const cardHeight = Math.round(cardWidth / 1.5);
  const centerTop = Math.round(cardHeight * 0.305);
  const centerBottom = Math.round(cardHeight * 0.175);
  const centerHeight = cardHeight - centerTop - centerBottom;
  const u = centerHeight / 100;

  const labelFs = Math.round(u * 5.8 * 10) / 10;
  const labelLh = Math.round(u * 7.2 * 10) / 10;
  const valFs = Math.round(u * 9.0 * 10) / 10;
  const valLh = Math.round(u * 11.0 * 10) / 10;
  const subValFs = Math.round(u * 7.8 * 10) / 10;
  const subValLh = Math.round(u * 9.6 * 10) / 10;
  const iconSz = Math.max(13, Math.round(u * 13.2));
  const iconBoxW = Math.max(16, Math.round(u * 15));
  const rowGap = Math.max(5, Math.round(cardWidth * 0.016));
  const colPad = Math.max(7, Math.round(cardWidth * 0.022));
  const midRowVerticalGap = Math.max(4, Math.round(u * 5.4));
  const rightRowVerticalGap = Math.max(2, Math.round(u * 2.8));

  const renderFunDiveDetail = (
    icon: React.ReactNode,
    label: string,
    values: string[],
    compact = false,
  ) => (
    <View style={styles.funDiveDetailCell}>
      <View style={styles.funDiveDetailHeading}>
        {icon}
        <Text
          style={[styles.cardFieldLabel, { fontSize: labelFs, lineHeight: labelLh }]}
        >
          {label}
        </Text>
      </View>
      <View style={styles.funDiveDetailValues}>
        {values.map((value, index) => (
          <Text
            key={`${label}-${index}`}
            style={[
              styles.cardFieldValue,
              {
                fontSize: compact ? subValFs : valFs,
                lineHeight: compact ? subValLh : valLh,
              },
            ]}
          >
            {value}
          </Text>
        ))}
      </View>
    </View>
  );

  // Responsive 9:16 story card size so the View Recap modal never overflows the viewport frame
  const storyCardHeight = Math.max(
    260,
    Math.min(Math.round(screenHeight * 0.5), 350),
  );
  const storyCardWidth = Math.round(storyCardHeight * 0.6);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 12, paddingBottom: 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ContentContainer maxWidth={560}>
          {/* 1. SIMPLIFIED SCREEN HEADER */}
          <View style={styles.screenHeader}>
            <View style={styles.headerTextCol}>
              <Text style={styles.screenTitle}>{t("eco_id_title")}</Text>
              <Text style={styles.screenSubtitle}>
                {t("eco_id_tagline")}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <TouchableOpacity
                style={styles.headerEditIconBtn}
                onPress={() => router.push("/tourist/dive-details/step1")}
                activeOpacity={0.82}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_edit_id_card")}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.primaryBlue}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. SINSAY DIVE PASS IDENTIFICATION CARD (TAP TO VIEW FULL DETAILS & SAVE) */}
          <TouchableOpacity
            style={[
              styles.idCardShadowWrap,
              { width: cardWidth, height: cardHeight },
            ]}
            activeOpacity={0.93}
            onPress={() => setShowIdCardModal(true)}
            accessibilityRole="button"
            accessibilityLabel={t("a11y_open_id_card")}
          >
            <View style={styles.idCardCanvas}>
              {/* Official SINSAY Dive Pass Card Design Background */}
              <Image
                source={ID_CARD_TEMPLATE}
                style={styles.templateBgImage}
                resizeMode="stretch"
              />

              {/* BLANK WHITE CENTER CANVAS: 3-Part Horizontal Reference Grid */}
              <View
                style={[
                  styles.blankCenterCanvas,
                  {
                    top: centerTop,
                    bottom: centerBottom,
                    left: Math.round(cardWidth * 0.048),
                    right: Math.round(cardWidth * 0.038),
                  },
                ]}
              >
                {/* PART 1: Left Column (Portrait Photo + Eco-Dive ID Number + Status Pill below) */}
                <View
                  style={[
                    styles.portraitCol,
                    {
                      width: Math.round(cardWidth * 0.26),
                      paddingTop: Math.max(4, Math.round(u * 3.2)),
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.portraitBox,
                      {
                        height: Math.round(centerHeight * 0.75),
                        borderRadius: Math.max(4, Math.round(u * 4.8)),
                      },
                    ]}
                    onPress={handlePickProfilePhoto}
                    activeOpacity={0.85}
                    focusable
                    accessibilityLabel={t("a11y_upload_photo")}
                  >
                    {profilePhotoUri ? (
                      <Image
                        source={{ uri: profilePhotoUri }}
                        style={styles.portraitImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <DefaultAvatarSilhouette />
                    )}
                  </TouchableOpacity>

                  {/* Clean Eco-Dive ID Number below photo (unclipped with proper line height) */}
                  <Text
                    style={[
                      styles.portraitIdText,
                      {
                        fontSize: Math.max(5.8, Math.round(u * 4.4 * 10) / 10),
                        lineHeight: Math.max(
                          8.5,
                          Math.round(u * 6.2 * 10) / 10,
                        ),
                        marginTop: Math.max(2.5, Math.round(u * 2.0)),
                        width: "115%",
                        flexShrink: 0,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {ecoId?.eco_id_number || t("eco_id_pending_short")}
                  </Text>

                  {/* Active / Inactive Status Pill (positioned lower with clear separation) */}
                  <View
                    style={[
                      styles.portraitBottomStatusPill,
                      isIdActive
                        ? styles.portraitBottomStatusPillActive
                        : isIdExpired
                          ? styles.portraitBottomStatusPillExpired
                          : styles.portraitBottomStatusPillInactive,
                      {
                        marginTop: Math.max(2.5, Math.round(u * 2.2)),
                        paddingHorizontal: Math.max(5, Math.round(u * 3.8)),
                        paddingVertical: Math.max(1.0, Math.round(u * 0.9)),
                        flexShrink: 0,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        isIdActive
                          ? "checkmark-circle"
                          : isIdExpired
                            ? "time-outline"
                            : "ellipse"
                      }
                      size={
                        isIdActive
                          ? Math.max(6.5, Math.round(u * 6.2))
                          : Math.max(4.5, Math.round(u * 4.5))
                      }
                      color={
                        isIdActive
                          ? "#059669"
                          : isIdExpired
                            ? "#DC2626"
                            : "#64748B"
                      }
                    />
                    <Text
                      style={[
                        styles.portraitBottomStatusText,
                        isIdActive
                          ? styles.portraitBottomStatusTextActive
                          : isIdExpired
                            ? styles.portraitBottomStatusTextExpired
                            : styles.portraitBottomStatusTextInactive,
                        {
                          fontSize: Math.max(
                            5.2,
                            Math.round(u * 3.8 * 10) / 10,
                          ),
                          lineHeight: Math.max(
                            7.2,
                            Math.round(u * 5.2 * 10) / 10,
                          ),
                        },
                      ]}
                    >
                      {isIdActive
                        ? t("status_active").toUpperCase()
                        : isIdExpired
                          ? t("status_expired").toUpperCase()
                          : effectiveStatus === "complete"
                            ? t("status_ready")
                            : t("status_inactive")}
                    </Text>
                  </View>
                </View>

                {showCertificationDetails ? (
                  <>
                {/* PART 2: Middle Identity Column (4 Icon + Label/Value Rows) */}
                <View
                  style={[
                    styles.middleIdentityCol,
                    {
                      paddingLeft: colPad,
                      paddingRight: Math.max(4, Math.round(colPad * 0.65)),
                      gap: midRowVerticalGap,
                    },
                  ]}
                >
                  {/* Row 1: FULL NAME */}
                  <View style={[styles.cardFieldRow, { gap: rowGap }]}>
                    <View style={[styles.cardIconWrap, { width: iconBoxW }]}>
                      <Ionicons name="person" size={iconSz} color="#0D74E7" />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_full_name")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: valFs, lineHeight: valLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.fullName}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: NATIONALITY */}
                  <View style={[styles.cardFieldRow, { gap: rowGap }]}>
                    <View style={[styles.cardIconWrap, { width: iconBoxW }]}>
                      <Ionicons
                        name="globe-outline"
                        size={iconSz}
                        color="#0D74E7"
                      />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_nationality")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: valFs, lineHeight: valLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.nationality}
                      </Text>
                    </View>
                  </View>

                  {/* Row 3: TYPE OF DIVE */}
                  <View style={[styles.cardFieldRow, { gap: rowGap }]}>
                    <View style={[styles.cardIconWrap, { width: iconBoxW }]}>
                      <DiveMaskIcon size={iconSz} color="#0D74E7" />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_type_of_dive")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: valFs, lineHeight: valLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.typeOfDive}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Thin Vertical Light-Blue Divider */}
                <View style={styles.verticalCardDivider} />

                {/* PART 3: Right Certification & Emergency Column */}
                <View
                  style={[
                    styles.rightCertCol,
                    {
                      paddingLeft: colPad,
                      gap: rightRowVerticalGap,
                    },
                  ]}
                >
                  {showCertificationDetails && (
                    <>
                  {/* Row 1: CERTIFICATION LEVEL */}
                  <View style={[styles.cardFieldRow, { gap: rowGap }]}>
                    <View style={[styles.cardIconWrap, { width: iconBoxW }]}>
                      <Ionicons name="ribbon" size={iconSz} color="#0D74E7" />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_certification_level")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: valFs, lineHeight: valLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.certLevel}
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: DATE ACCREDITED */}
                  <View style={[styles.cardFieldRow, { gap: rowGap }]}>
                    <View style={[styles.cardIconWrap, { width: iconBoxW }]}>
                      <Ionicons
                        name="calendar-outline"
                        size={iconSz}
                        color="#0D74E7"
                      />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_date_accredited")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: subValFs, lineHeight: subValLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.dateAccredited}
                      </Text>
                    </View>
                  </View>

                  {/* Row 3: RENEWAL DATE */}
                  <View style={[styles.cardFieldRow, { gap: rowGap }]}>
                    <View style={[styles.cardIconWrap, { width: iconBoxW }]}>
                      <Ionicons
                        name="calendar-outline"
                        size={iconSz}
                        color="#0D74E7"
                      />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_renewal_date")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: subValFs, lineHeight: subValLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.renewalDate}
                      </Text>
                    </View>
                  </View>

                    </>
                  )}

                  {/* Thin Horizontal Light-Blue Divider above Emergency Contact */}
                  <View style={styles.horizontalCardDivider} />

                  {/* Row 4: EMERGENCY CONTACT */}
                  <View
                    style={[
                      styles.cardFieldRow,
                      { gap: rowGap, alignItems: "flex-start" },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardIconWrap,
                        {
                          width: iconBoxW,
                          paddingTop: Math.max(1, Math.round(u * 1.2)),
                        },
                      ]}
                    >
                      <Ionicons
                        name="call"
                        size={Math.max(12, iconSz - 1)}
                        color="#0D74E7"
                      />
                    </View>
                    <View style={styles.cardFieldTextCol}>
                      <Text
                        style={[
                          styles.cardFieldLabel,
                          { fontSize: labelFs, lineHeight: labelLh },
                        ]}
                        numberOfLines={1}
                      >
                        {t("label_emergency_contact")}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: subValFs, lineHeight: subValLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.emergencyName}
                      </Text>
                      <Text
                        style={[
                          styles.cardFieldValue,
                          { fontSize: subValFs, lineHeight: subValLh },
                        ]}
                        numberOfLines={1}
                      >
                        {cardData.emergencyNumber}
                      </Text>
                    </View>
                  </View>
                </View>
                  </>
                ) : (
                  <View style={[styles.funDiveDetailsGrid, { paddingLeft: colPad }]}>
                    <View style={styles.funDiveDetailsRow}>
                      {renderFunDiveDetail(
                        <Ionicons name="person" size={iconSz} color="#0D74E7" />,
                        "FULL NAME",
                        [cardData.fullName],
                      )}
                      <View style={styles.funDiveGridVerticalDivider} />
                      {renderFunDiveDetail(
                        <Ionicons name="globe-outline" size={iconSz} color="#0D74E7" />,
                        "NATIONALITY",
                        [cardData.nationality],
                      )}
                    </View>
                    <View style={styles.funDiveGridHorizontalDivider} />
                    <View style={styles.funDiveDetailsRow}>
                      {renderFunDiveDetail(
                        <DiveMaskIcon size={iconSz} color="#0D74E7" />,
                        "TYPE OF DIVE",
                        [cardData.typeOfDive],
                      )}
                      <View style={styles.funDiveGridVerticalDivider} />
                      {renderFunDiveDetail(
                        <Ionicons name="call" size={Math.max(12, iconSz - 1)} color="#0D74E7" />,
                        "EMERGENCY CONTACT",
                        [cardData.emergencyName, cardData.emergencyNumber],
                        true,
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Tap Card Hint Row */}
          <TouchableOpacity
            style={styles.tapCardHintRow}
            onPress={() => setShowIdCardModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="expand-outline"
              size={13}
              color={colors.primaryBlue}
            />
            <Text style={styles.tapCardHintText}>
              {t("tap_card_details")}
            </Text>
          </TouchableOpacity>

          {/* INCOMPLETE DIVE PROFILE PROMPT WITH PROGRESS BAR */}
          {!isProfileComplete && (
            <View style={styles.incompletePromptCard}>
              <View style={styles.incompleteHeaderRow}>
                <View style={styles.incompleteIconBadge}>
                  <Ionicons
                    name="shield-half-outline"
                    size={18}
                    color={colors.primaryBlue}
                  />
                </View>
                <View style={styles.incompleteTitleCol}>
                  <Text style={styles.incompleteTitle}>
                    {t("complete_your_profile")}
                  </Text>
                  <Text style={styles.incompleteSubtitle}>
                    {missingStepHint}
                  </Text>
                </View>
                <View style={styles.incompletePctPill}>
                  <Text style={styles.incompletePctText}>
                    {completionProgress}%
                  </Text>
                </View>
              </View>

              <View style={styles.incompleteProgressTrack}>
                <View
                  style={[
                    styles.incompleteProgressFill,
                    { width: `${completionProgress}%` },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={styles.incompleteCtaBtn}
                onPress={() => router.push("/tourist/dive-details/step1")}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_complete_dive_profile")}
              >
                <Text style={styles.incompleteCtaText}>
                  {t("complete_profile_cta_short")}
                </Text>
                <Ionicons name="arrow-forward" size={15} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. VERTICAL TIMELINE FOR DIVE LOGS */}
          <View style={styles.timelineSectionHeader}>
            <Text style={styles.timelineTitle}>{t("dive_timeline")}</Text>
            <View style={styles.timelineCountPill}>
              <Text style={styles.timelineCountText}>
                {activities.length === 1
                  ? t("dive_count", { count: 1 })
                  : t("dives_count", { count: activities.length })}
              </Text>
            </View>
          </View>

          {historyLoading ? (
            <View style={styles.historyLoadingWrap}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
              <Text style={styles.historyLoadingText}>
                {t("loading_dive_history")}
              </Text>
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.emptyTimelineCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="boat-outline"
                  size={30}
                  color={colors.primaryBlue}
                />
              </View>
              <Text style={styles.emptyTimelineTitle}>{t("no_dive_history_title")}</Text>
              <Text style={styles.emptyTimelineSubtitle}>
                {t("no_dive_history_body")}
              </Text>
            </View>
          ) : (
            <View style={styles.verticalTimelineContainer}>
              {activities.map((item, idx) => {
                const isLast = idx === activities.length - 1;
                return (
                  <View key={item.id} style={styles.timelineRow}>
                    {/* Vertical Timeline Left Rail & Node */}
                    <View style={styles.timelineRailCol}>
                      <View style={styles.timelineNodeOuter}>
                        <View style={styles.timelineNodeInner} />
                      </View>
                      {!isLast && <View style={styles.timelineConnectorLine} />}
                    </View>

                    {/* Individual White Activity Card with Subtle Blue Border */}
                    <View style={styles.timelineCardWrap}>
                      <View style={styles.timelineActivityCard}>
                        {/* Card Header: Dive Number + Date/Time */}
                        <View style={styles.activityHeaderRow}>
                          <View style={styles.diveNumberBadge}>
                            <Text style={styles.diveNumberText}>
                              {t("dive_number", { number: String(item.diveNumber).padStart(2, "0") })}
                            </Text>
                          </View>
                          <Text style={styles.dateTimeText} numberOfLines={1}>
                            {item.dateTime}
                          </Text>
                        </View>

                        {/* Main Body: Left Details + Right Site Photo */}
                        <View style={styles.activityMainRow}>
                          <View style={styles.activityInfoCol}>
                            {/* Dive Site Name */}
                            <Text
                              style={styles.activitySiteName}
                              numberOfLines={1}
                            >
                              {item.siteName}
                            </Text>

                            {/* Dive Category, Resort / Dive Center, and Location */}
                            <View style={styles.metaInfoStack}>
                              <View style={styles.metaInlineRow}>
                                <Ionicons
                                  name="water-outline"
                                  size={13}
                                  color={colors.primaryBlue}
                                />
                                <Text
                                  style={styles.metaCategoryText}
                                  numberOfLines={1}
                                >
                                  {item.diveCategory}
                                </Text>
                              </View>

                              <View style={styles.metaInlineRow}>
                                <Ionicons
                                  name="boat-outline"
                                  size={13}
                                  color="#64748B"
                                />
                                <Text
                                  style={styles.metaResortText}
                                  numberOfLines={1}
                                >
                                  {item.resortOrCenter}
                                </Text>
                              </View>

                              <View style={styles.metaInlineRow}>
                                <Ionicons
                                  name="location-sharp"
                                  size={13}
                                  color={colors.primaryBlue}
                                />
                                <Text
                                  style={styles.locBarangay}
                                  numberOfLines={1}
                                >
                                  {item.barangay} • {item.duration}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Right-Side Dive Site Photo (Location Preview) */}
                          <TouchableOpacity
                            style={styles.rightPhotoBox}
                            activeOpacity={0.86}
                            onPress={() => router.push("/(tabs)/map")}
                            accessibilityRole="button"
                            accessibilityLabel={t("a11y_preview_map", { site: item.siteName })}
                          >
                            <Image
                              source={resolveSiteImage(
                                null,
                                item.photoUrl,
                                item.imageIndex ?? idx,
                              )}
                              style={styles.locThumbImg}
                              resizeMode="cover"
                            />
                            <View
                              style={styles.locThumbGrad}
                              pointerEvents="none"
                            >
                              <Svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                              >
                                <Defs>
                                  <LinearGradient
                                    id={`locGrad-${item.id}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                  >
                                    <Stop
                                      offset="0"
                                      stopColor="#020817"
                                      stopOpacity="0"
                                    />
                                    <Stop
                                      offset="1"
                                      stopColor="#020817"
                                      stopOpacity="0.85"
                                    />
                                  </LinearGradient>
                                </Defs>
                                <Rect
                                  x="0"
                                  y="0"
                                  width="100"
                                  height="100"
                                  fill={`url(#locGrad-${item.id})`}
                                />
                              </Svg>
                            </View>
                            <Text style={styles.locDepthOverlay}>
                              {item.depthRange}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* View Dive Recap Action */}
                        <View style={styles.cardFooterActions}>
                          <TouchableOpacity
                            style={styles.viewRecapBtn}
                            onPress={() => setSelectedRecap(item)}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityLabel={t("a11y_view_recap", { site: item.siteName })}
                          >
                            <Ionicons
                              name="document-text-outline"
                              size={14}
                              color={colors.primaryBlue}
                            />
                  <Text style={styles.viewRecapBtnText}>
                    {t("view_recap")}
                  </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ContentContainer>
      </ScrollView>

      {/* Copied / Saved Toast Banner */}
      {copiedBanner && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#34D399" />
          <Text style={styles.toastBannerText}>{toastMessage}</Text>
        </View>
      )}

      {/* ECO-DIVE ID CARD FULL DETAILS & SAVE MODAL */}
      <Modal
        visible={showIdCardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIdCardModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowIdCardModal(false)}
        >
          <Pressable
            style={styles.idDetailModalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.recapSheetHeader}>
              <View style={styles.recapSheetTitleCol}>
                <Text style={styles.recapSheetTitle}>
                  SINSAY Eco-Dive ID Pass
                </Text>
                <Text style={styles.recapSheetSubtitle}>
                  Full digital pass details &amp; accreditation
                </Text>
              </View>

              <View style={styles.recapSheetHeaderActions}>
                <TouchableOpacity
                  style={styles.recapSheetCloseBtn}
                  onPress={() => {
                    setShowIdCardModal(false);
                    router.push("/tourist/dive-details/step1");
                  }}
                  activeOpacity={0.8}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("a11y_edit_id_card")}
                >
                  <Ionicons name="create-outline" size={17} color="#0D74E7" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.recapSheetCloseBtn}
                  onPress={() => setShowIdCardModal(false)}
                  activeOpacity={0.8}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("a11y_close_id_card")}
                >
                  <Ionicons name="close" size={17} color="#0D74E7" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.idDetailModalScroll}
              contentContainerStyle={styles.idDetailModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Full Details Profile Header Row */}
              <View style={styles.idFullTopProfileRow}>
                <TouchableOpacity
                  style={styles.idFullPortraitThumb}
                  onPress={handlePickProfilePhoto}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={t("a11y_change_photo")}
                >
                  {profilePhotoUri ? (
                    <Image
                      source={{ uri: profilePhotoUri }}
                      style={styles.portraitImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <DefaultAvatarSilhouette />
                  )}
                  <View style={styles.idFullCameraBadge}>
                    <Ionicons name="camera" size={11} color={colors.white} />
                  </View>
                </TouchableOpacity>

                <View style={styles.idFullTopIdentityCol}>
                  <Text style={styles.idFullLabel}>{t("label_full_name")}</Text>
                  <Text style={styles.idFullPrimaryName}>
                    {cardData.fullName}
                  </Text>
                  <View
                    style={[
                      styles.idFullPassBadge,
                      isIdActive
                        ? styles.idFullPassBadgeActive
                        : isIdExpired
                          ? styles.idFullPassBadgeExpired
                          : null,
                    ]}
                  >
                    <Ionicons
                      name={
                        isIdActive
                          ? "shield-checkmark"
                          : isIdExpired
                            ? "time-outline"
                            : "ellipse"
                      }
                      size={12}
                      color={colors.primaryBlue}
                    />
                    <Text
                      style={[
                        styles.idFullPassBadgeText,
                        isIdActive
                          ? styles.idFullPassBadgeTextActive
                          : isIdExpired
                            ? styles.idFullPassBadgeTextExpired
                            : null,
                      ]}
                    >
                      {isIdActive
                        ? t("status_active_title")
                        : isIdExpired
                          ? t("status_expired_title")
                          : t("status_pending")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Complete Un-truncated Details List */}
              <View style={styles.idFullGridCard}>
                {/* ECO-DIVE ID NO. */}
                <View style={styles.idFullDetailItem}>
                  <Ionicons
                    name="finger-print-outline"
                    size={16}
                    color={colors.primaryBlue}
                  />
                  <View style={styles.idFullDetailTextCol}>
                    <Text style={styles.idFullLabel}>{t("label_eco_id_no")}</Text>
                    <Text
                      style={[
                        styles.idFullValue,
                        {
                          color: colors.primaryBlue,
                          fontFamily: "Quicksand_700Bold",
                          letterSpacing: 0.5,
                        },
                      ]}
                    >
                      {ecoId?.eco_id_number || t("eco_id_pending_long")}
                    </Text>
                  </View>
                </View>

                <View style={styles.idFullDivider} />

                <View style={styles.idFullDetailItem}>
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={colors.primaryBlue}
                  />
                  <View style={styles.idFullDetailTextCol}>
                    <Text style={styles.idFullLabel}>{t("label_nationality")}</Text>
                    <Text style={styles.idFullValue}>
                      {cardData.nationality}
                    </Text>
                  </View>
                </View>
                <View style={styles.idFullDivider} />

                <View style={styles.idFullDetailItem}>
                  <DiveMaskIcon size={16} color={colors.primaryBlue} />
                  <View style={styles.idFullDetailTextCol}>
                    <Text style={styles.idFullLabel}>{t("label_type_of_dive")}</Text>
                    <Text style={styles.idFullValue}>
                      {cardData.typeOfDive}
                    </Text>
                  </View>
                </View>

                <View style={styles.idFullDivider} />

                {showCertificationDetails && (
                  <>
                <View style={styles.idFullDetailItem}>
                  <Ionicons
                    name="ribbon"
                    size={16}
                    color={colors.primaryBlue}
                  />
                  <View style={styles.idFullDetailTextCol}>
                    <Text style={styles.idFullLabel}>{t("label_certification_level")}</Text>
                    <Text style={styles.idFullValue}>{cardData.certLevel}</Text>
                  </View>
                </View>

                <View style={styles.idFullDivider} />

                <View style={styles.idFullTwoColDates}>
                  <View style={styles.idFullDateCell}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={colors.primaryBlue}
                    />
                    <View style={styles.idFullDetailTextCol}>
                      <Text style={styles.idFullLabel}>{t("label_date_accredited")}</Text>
                      <Text style={styles.idFullValue}>
                        {cardData.dateAccredited}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.idFullDateCell}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={colors.primaryBlue}
                    />
                    <View style={styles.idFullDetailTextCol}>
                      <Text style={styles.idFullLabel}>{t("label_renewal_date")}</Text>
                      <Text style={styles.idFullValue}>
                        {cardData.renewalDate}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.idFullDivider} />

                  </>
                )}

                <View style={styles.idFullDetailItem}>
                  <Ionicons name="call" size={16} color={colors.primaryBlue} />
                  <View style={styles.idFullDetailTextCol}>
                    <Text style={styles.idFullLabel}>{t("label_emergency_contact")}</Text>
                    <Text style={styles.idFullValue}>
                      {cardData.emergencyName}
                    </Text>
                    <Text style={styles.idFullSubValue}>
                      {cardData.emergencyNumber}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* SHAREABLE 9:16 STORY DIVE RECAP MODAL */}
      <Modal
        visible={Boolean(selectedRecap)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRecap(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedRecap(null)}
        >
          {selectedRecap && (
            <Pressable
              style={styles.recapModalSheet}
              onPress={(e) => e.stopPropagation()}
            >
              {/* Top Modal Header */}
              <View style={styles.recapSheetHeader}>
                <View style={styles.recapSheetTitleCol}>
                  <Text style={styles.recapSheetTitle}>
                    {t("recap_title")}
                  </Text>
                  <Text style={styles.recapSheetSubtitle}>
                    {t("recap_subtitle")}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.recapSheetCloseBtn}
                  onPress={() => setSelectedRecap(null)}
                  activeOpacity={0.8}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("a11y_close_recap")}
                >
                  <Ionicons name="close" size={17} color="#0D74E7" />
                </TouchableOpacity>
              </View>

              {/* Centered 9:16 Vertical Story Card */}
              <View style={styles.storyCardOuterWrap}>
                <View
                  ref={storyCardRef}
                  style={[
                    styles.storyCardCanvas,
                    { width: storyCardWidth, height: storyCardHeight },
                  ]}
                >
                  <Image
                    source={
                      recapImageBase64
                        ? { uri: recapImageBase64 }
                        : resolveSiteImage(
                            null,
                            selectedRecap.photoUrl,
                            selectedRecap.imageIndex,
                          )
                    }
                    style={styles.storyCardBgImage}
                    resizeMode="cover"
                  />

                  {/* Dark Underwater Gradient Overlay */}
                  <View style={styles.storyCardGrad} pointerEvents="none">
                    <Svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <Defs>
                        <LinearGradient
                          id="storyCardGradSvg"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <Stop
                            offset="0"
                            stopColor="#020817"
                            stopOpacity="0.32"
                          />
                          <Stop
                            offset="0.4"
                            stopColor="#020817"
                            stopOpacity="0.1"
                          />
                          <Stop
                            offset="0.68"
                            stopColor="#020817"
                            stopOpacity="0.65"
                          />
                          <Stop
                            offset="1"
                            stopColor="#020817"
                            stopOpacity="0.92"
                          />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        fill="url(#storyCardGradSvg)"
                      />
                    </Svg>
                  </View>

                  {/* Story Card Top Brand Header */}
                  <View style={styles.storyTopBrandBlock}>
                    <Image
                      source={
                        recapLogoBase64
                          ? { uri: recapLogoBase64 }
                          : SINSAY_WHITE_LOGO
                      }
                      style={styles.storyBrandLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.storyBrandLocation}>
                      {t("story_location")}
                    </Text>
                  </View>

                  {/* Story Card Bottom Details Overlay */}
                  <View style={styles.storyBottomOverlay}>
                    <View style={styles.storyDiveBadge}>
                      <Text style={styles.storyDiveBadgeText}>
                        {t("story_dive_badge", {
                          number: String(selectedRecap.diveNumber).padStart(2, "0"),
                        })}
                      </Text>
                    </View>

                    <Text style={styles.storyHeroHeadline}>
                      {t("story_headline", { site: selectedRecap.siteName })}
                    </Text>

                    <Text style={styles.storyDateCatLine} numberOfLines={1}>
                      {selectedRecap.dateTime.split("•")[0].trim()} ·{" "}
                      {selectedRecap.diveCategory}
                    </Text>

                    <View style={styles.storyDividerLine} />

                    <View style={styles.storyDetailsStack}>
                      <Text style={styles.storyResortLine} numberOfLines={1}>
                        {t("story_with", { resort: selectedRecap.resortOrCenter })}
                      </Text>

                      <Text style={styles.storyStatsLine} numberOfLines={1}>
                        {selectedRecap.depthRange} · {selectedRecap.duration}
                      </Text>

                      <Text style={styles.storyEcoTagline}>
                        {t("story_tagline")}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Save Image Action Button */}
              <TouchableOpacity
                style={[
                  styles.saveStoryImageBtn,
                  isSavingImage && styles.saveStoryImageBtnDisabled,
                ]}
                onPress={() => handleSaveRecapImage(selectedRecap)}
                activeOpacity={0.86}
                disabled={isSavingImage}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_save_recap")}
              >
                {isSavingImage ? (
                  <ActivityIndicator size="small" color="#0D74E7" />
                ) : (
                  <Ionicons name="download-outline" size={17} color="#0D74E7" />
                )}
                <Text style={styles.saveStoryImageBtnText}>
                  {isSavingImage ? t("saving_image") : t("save_image")}
                </Text>
              </TouchableOpacity>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6FAFF",
    paddingBottom: 0,
  },
  centerLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* 1. SIMPLIFIED SCREEN HEADER */
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  screenSubtitle: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 1,
  },
  headerEditIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  /* 2. SINSAY DIVE PASS IDENTIFICATION CARD (EXACT REFERENCE PROPORTIONS) */
  idCardShadowWrap: {
    alignSelf: "center",
    borderRadius: 20,
    backgroundColor: colors.white,
    shadowColor: "#0F294A",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  idCardCanvas: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.white,
  },
  templateBgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },

  /* BLANK WHITE CENTER CANVAS (3-Part Reference Layout) */
  blankCenterCanvas: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "stretch",
  },
  portraitCol: {
    flexDirection: "column",
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "flex-start",
  },
  portraitBox: {
    width: "100%",
    backgroundColor: "#C6DAF1",
    overflow: "hidden",
    flexShrink: 0,
  },
  portraitIdText: {
    width: "100%",
    fontFamily: "Quicksand_700Bold",
    color: "#0F294A",
    letterSpacing: 0.1,
    textAlign: "center",
    flexShrink: 0,
  },
  portraitBottomStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: 999,
    alignSelf: "center",
    flexShrink: 0,
  },
  portraitBottomStatusPillActive: {
    backgroundColor: "rgba(236, 253, 245, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  portraitBottomStatusPillExpired: {
    backgroundColor: "rgba(254, 242, 242, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  portraitBottomStatusPillInactive: {
    backgroundColor: "rgba(241, 245, 249, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  portraitBottomStatusText: {
    fontFamily: "Quicksand_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  portraitBottomStatusTextActive: {
    color: "#059669",
  },
  portraitBottomStatusTextExpired: {
    color: "#DC2626",
  },
  portraitBottomStatusTextInactive: {
    color: "#475569",
  },
  portraitImage: {
    width: "100%",
    height: "100%",
  },
  middleIdentityCol: {
    flex: 1.04,
    justifyContent: "center",
  },
  verticalCardDivider: {
    width: 1,
    backgroundColor: "#B8D4F2",
  },
  rightCertCol: {
    flex: 1,
    justifyContent: "center",
  },
  funDiveDetailsGrid: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  funDiveDetailsRow: {
    flex: 1,
    minHeight: 0,
    flexDirection: "row",
    alignItems: "stretch",
  },
  funDiveDetailCell: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  funDiveDetailHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  funDiveDetailValues: {
    minWidth: 0,
  },
  funDiveGridVerticalDivider: {
    width: 1,
    backgroundColor: "#B8D4F2",
  },
  funDiveGridHorizontalDivider: {
    height: 1,
    backgroundColor: "#B8D4F2",
  },
  horizontalCardDivider: {
    height: 1,
    backgroundColor: "#B8D4F2",
    marginRight: "6%",
  },
  cardFieldRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardFieldTextCol: {
    flex: 1,
    minWidth: 0,
  },
  cardFieldLabel: {
    fontFamily: "Quicksand_700Bold",
    color: "#0D74E7",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardFieldValue: {
    fontFamily: "Quicksand_700Bold",
    color: "#0F294A",
  },
  tapCardHintRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 8,
  },
  tapCardHintText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
  },

  /* INCOMPLETE DIVE PROFILE PROMPT WITH PROGRESS BAR */
  incompletePromptCard: {
    marginTop: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 18,
    padding: 14,
    gap: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  incompleteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  incompleteIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  incompleteTitleCol: {
    flex: 1,
    gap: 1,
  },
  incompleteTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  incompleteSubtitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  incompletePctPill: {
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  incompletePctText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  incompleteProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  incompleteProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primaryBlue,
  },
  incompleteCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primaryBlue,
    borderRadius: 999,
    paddingVertical: 10,
  },
  incompleteCtaText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },

  /* ID CARD FULL DETAILS & SAVE MODAL */
  idDetailModalSheet: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "88%",
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    shadowColor: "#0F172A",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  idDetailModalScroll: {
    flexGrow: 0,
  },
  idDetailModalScrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  idFullTopProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#F6FAFF",
    borderWidth: 1,
    borderColor: "#DCEBFA",
    borderRadius: 16,
    padding: 12,
  },
  idFullPortraitThumb: {
    width: 64,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#C6DAF1",
    position: "relative",
    flexShrink: 0,
  },
  idFullCameraBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  idFullTopIdentityCol: {
    flex: 1,
    gap: 3,
  },
  idFullLabel: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#0D74E7",
    letterSpacing: 0.5,
  },
  idFullPrimaryName: {
    fontSize: 16.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F294A",
  },
  idFullPassBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 2,
  },
  idFullPassBadgeActive: {
    backgroundColor: "#ECFDF5",
  },
  idFullPassBadgeExpired: {
    backgroundColor: "#FEF2F2",
  },
  idFullPassBadgeTextActive: {
    color: "#059669",
  },
  idFullPassBadgeTextExpired: {
    color: "#DC2626",
  },
  idFullPassBadgeText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  idFullGridCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  idFullDetailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 7,
  },
  idFullDetailTextCol: {
    flex: 1,
    gap: 1,
  },
  idFullValue: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F294A",
  },
  idFullSubValue: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#475569",
  },
  idFullDivider: {
    height: 1,
    backgroundColor: "#EBF2FA",
  },
  idFullTwoColDates: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
  },
  idFullDateCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  idModalActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  idModalEditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingVertical: 11,
  },
  idModalEditBtnText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  idModalSavePrimaryBtn: {
    flex: 1.25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primaryBlue,
    borderRadius: 999,
    paddingVertical: 11,
  },
  idModalSavePrimaryText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },

  /* 3. VERTICAL TIMELINE FOR DIVE LOGS */
  timelineSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 14,
  },
  timelineTitle: {
    fontSize: 18,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  timelineCountPill: {
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  timelineCountText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  verticalTimelineContainer: {
    paddingLeft: 2,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  timelineRailCol: {
    width: 20,
    alignItems: "center",
  },
  timelineNodeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#DBEAFE",
    borderWidth: 2,
    borderColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  timelineNodeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryBlue,
  },
  timelineConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#BFDBFE",
    marginVertical: 4,
  },
  timelineCardWrap: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineActivityCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#CFE2F6",
    borderRadius: 18,
    padding: 14,
    gap: 8,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  activityHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  diveNumberBadge: {
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  diveNumberBadgeModal: {
    backgroundColor: colors.primaryBlue,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  diveNumberText: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  diveNumberTextModal: {
    fontSize: 11,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  dateTimeText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  activityMainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  activityInfoCol: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  activitySiteName: {
    fontSize: 16.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  metaInfoStack: {
    gap: 4,
  },
  metaInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaCategoryText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#1E40AF",
  },
  metaResortText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
  },

  /* RIGHT-SIDE LOCATION PHOTO PREVIEW */
  rightPhotoBox: {
    width: 88,
    height: 82,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#CBD5E1",
    borderWidth: 1,
    borderColor: "#DCEBFA",
    flexShrink: 0,
  },
  locThumbImg: {
    width: "100%",
    height: "100%",
  },
  locThumbGrad: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "65%",
    backgroundImage:
      "linear-gradient(180deg, rgba(2,8,23,0) 0%, rgba(2,8,23,0.85) 100%)" as any,
  },
  locDepthOverlay: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 5,
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    textAlign: "center",
  },
  locBarangay: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: "#475569",
  },

  /* CARD FOOTER ACTIONS */
  cardFooterActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  viewRecapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EBF3FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewRecapBtnText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.primaryBlue,
  },
  shareRecapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.primaryBlue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  shareRecapBtnText: {
    fontSize: 11.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },

  /* TOAST & RECAP MODAL */
  toastBanner: {
    position: "absolute",
    bottom: 96,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastBannerText: {
    fontSize: 12.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 13, 31, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recapModalSheet: {
    width: "100%",
    maxWidth: 344,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 15,
    shadowColor: "#0F172A",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  recapSheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  recapSheetTitleCol: {
    flex: 1,
  },
  recapSheetHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recapSheetTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
  },
  recapSheetSubtitle: {
    fontSize: 11.5,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    marginTop: 1,
  },
  recapSheetCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  storyCardOuterWrap: {
    alignItems: "center",
    marginBottom: 14,
  },
  storyCardCanvas: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#06152D",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  storyCardBgImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  storyCardGrad: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  storyTopBrandBlock: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 2,
  },
  storyBrandLogo: {
    width: 88,
    height: 24,
  },
  storyBrandLocation: {
    fontSize: 8,
    fontFamily: "Quicksand_700Bold",
    color: "rgba(255, 255, 255, 0.92)",
    letterSpacing: 0.8,
  },
  storyBottomOverlay: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  storyDiveBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0D74E7",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    marginBottom: 7,
  },
  storyDiveBadgeText: {
    fontSize: 8.5,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    letterSpacing: 0.4,
  },
  storyHeroHeadline: {
    fontSize: 19,
    lineHeight: 23,
    fontFamily: "Quicksand_700Bold",
    color: colors.white,
    marginBottom: 5,
  },
  storyDateCatLine: {
    fontSize: 10.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "rgba(255, 255, 255, 0.92)",
  },
  storyDividerLine: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    marginVertical: 8,
  },
  storyDetailsStack: {
    gap: 2,
  },
  storyResortLine: {
    fontSize: 10,
    fontFamily: "Quicksand_600SemiBold",
    color: "rgba(255, 255, 255, 0.95)",
  },
  storyStatsLine: {
    fontSize: 9.5,
    fontFamily: "Quicksand_600SemiBold",
    color: "#93C5FD",
  },
  storyEcoTagline: {
    fontSize: 9.5,
    fontFamily: "Quicksand_500Medium",
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 1,
  },
  saveStoryImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#93C5FD",
    borderRadius: 999,
    paddingVertical: 11,
  },
  saveStoryImageBtnDisabled: {
    opacity: 0.65,
  },
  saveStoryImageBtnText: {
    fontSize: 13.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0D74E7",
  },
  historyLoadingWrap: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  historyLoadingText: {
    fontSize: 13,
    fontFamily: "Quicksand_600SemiBold",
    color: "#64748B",
  },
  emptyTimelineCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0F6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTimelineTitle: {
    fontSize: 16,
    fontFamily: "Quicksand_700Bold",
    color: "#07156C",
    textAlign: "center",
    marginBottom: 6,
  },
  emptyTimelineSubtitle: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 320,
  },
});
