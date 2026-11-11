import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTutorial } from "../context/TutorialContext";

export interface TutorialStep {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  target:
    | "top-bar"
    | "map-tab"
    | "eco-tab"
    | "assistant-btn"
    | "profile-tab"
    | "kpi-stats"
    | "manifests-tab"
    | "buy-pass-tab"
    | "op-profile-tab";
  caretPosition: "top" | "bottom";
}

const TOURIST_STEPS: TutorialStep[] = [
  {
    title: "Welcome to SINSAY",
    description:
      "Explore Mabini's world-class diving. Check notifications for live marine sanctuary advisories, weather, and municipal notices.",
    icon: "notifications",
    target: "top-bar",
    caretPosition: "top",
  },
  {
    title: "Explore Dive Sites & MPAs",
    description:
      "Browse 30+ official dive spots across Mabini. Check depth, coordinates, marine biodiversity, and sanctuary protection levels.",
    icon: "map",
    target: "map-tab",
    caretPosition: "bottom",
  },
  {
    title: "Your Digital Eco-Dive ID",
    description:
      "Your required digital pass for diving in Mabini. Complete your diver details once—accredited dive centers activate your pass and log verified dives.",
    icon: "id-card",
    target: "eco-tab",
    caretPosition: "bottom",
  },
  {
    title: "AI Dive Assistant",
    description:
      "Powered by Gemini AI. Tap anytime to ask about marine life, MPA sanctuary fees, local dive rules, or generate custom dive plans.",
    icon: "sparkles",
    target: "assistant-btn",
    caretPosition: "bottom",
  },
  {
    title: "Profile & Diver Preferences",
    description:
      "Manage your credentials, switch language to Filipino or English, view saved favorite dive sites, or apply to become an accredited operator.",
    icon: "person",
    target: "profile-tab",
    caretPosition: "bottom",
  },
];

const OPERATOR_STEPS: TutorialStep[] = [
  {
    title: "Operator Dashboard",
    description:
      "Monitor daily active divers, your pass credit inventory, and weekly manifests at a glance before daily boat departures.",
    icon: "stats-chart",
    target: "kpi-stats",
    caretPosition: "top",
  },
  {
    title: "Electronic Dive Manifests",
    description:
      "Create manifests for boat or shore dives, search registered divers by Eco-Dive ID (or add walk-ins), and submit official records to the Tourism Office.",
    icon: "boat",
    target: "manifests-tab",
    caretPosition: "bottom",
  },
  {
    title: "Buy Dive Pass Credits",
    description:
      "Purchase municipal dive pass packages seamlessly with GCash QR payment to keep your resort pass pool topped up.",
    icon: "card",
    target: "buy-pass-tab",
    caretPosition: "bottom",
  },
  {
    title: "Resort Profile & Diver View",
    description:
      "Manage your establishment accreditation and contact links, or switch to Tourist View anytime to browse the app as a diver.",
    icon: "business",
    target: "op-profile-tab",
    caretPosition: "bottom",
  },
];

interface InAppTutorialProps {
  role?: "tourist" | "operator";
}

interface TargetRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getElementViewportRect(targetId: string): TargetRect | null {
  if (typeof document === "undefined") return null;
  const el =
    document.getElementById(targetId) ||
    document.querySelector(`[data-testid="${targetId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function InAppTutorial({ role = "tourist" }: InAppTutorialProps) {
  const { isTutorialActive, dismissTutorial } = useTutorial();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const steps = role === "operator" ? OPERATOR_STEPS : TOURIST_STEPS;
  const currentStep = steps[currentStepIndex] || steps[0];
  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Mobile container centered math
  const containerWidth = Math.min(width, 480);
  const containerLeft = Math.max(0, (width - containerWidth) / 2);
  const safeTop = Math.max(insets.top, 16);

  const [targetRect, setTargetRect] = useState<TargetRect | null>(() =>
    getElementViewportRect(`tutorial-${currentStep.target}`),
  );

  useEffect(() => {
    if (!isTutorialActive) return;

    if (typeof window !== "undefined") {
      if (
        currentStep.target === "top-bar" ||
        currentStep.target === "kpi-stats"
      ) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    const measure = () => {
      const rect = getElementViewportRect(`tutorial-${currentStep.target}`);
      if (rect) {
        setTargetRect((prev) => {
          if (
            prev &&
            Math.abs(prev.left - rect.left) < 1 &&
            Math.abs(prev.top - rect.top) < 1 &&
            Math.abs(prev.width - rect.width) < 1 &&
            Math.abs(prev.height - rect.height) < 1
          ) {
            return prev;
          }
          return rect;
        });
      }
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const timer = setTimeout(measure, 50);

    if (typeof window !== "undefined") {
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", measure);
        window.removeEventListener("scroll", measure, true);
      }
    };
  }, [isTutorialActive, currentStepIndex, currentStep.target, width, height]);

  // Calculate geometry for spotlight based on live measured target or calibrated fallback
  const spotlight = useMemo(() => {
    const tabWidth = containerWidth / 4;
    const targetId = `tutorial-${currentStep.target}`;
    const rect = targetRect || getElementViewportRect(targetId);

    if (rect) {
      if (currentStep.target === "assistant-btn") {
        const pad = 5;
        const size = Math.max(rect.width, rect.height) + pad * 2;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return {
          left: centerX - size / 2,
          top: centerY - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          caretX: centerX,
        };
      }

      if (
        currentStep.target === "map-tab" ||
        currentStep.target === "eco-tab" ||
        currentStep.target === "profile-tab" ||
        currentStep.target === "manifests-tab" ||
        currentStep.target === "buy-pass-tab" ||
        currentStep.target === "op-profile-tab"
      ) {
        const padX = 6;
        const padY = 4;
        const w = rect.width + padX * 2;
        const h = rect.height + padY * 2;
        return {
          left: rect.left - padX,
          top: rect.top - padY,
          width: w,
          height: h,
          borderRadius: Math.min(24, h / 2),
          caretX: rect.left + rect.width / 2,
        };
      }

      if (currentStep.target === "top-bar") {
        const pad = 6;
        return {
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          borderRadius: 18,
          caretX: rect.left + rect.width - 44,
        };
      }

      if (currentStep.target === "kpi-stats") {
        const pad = 6;
        return {
          left: rect.left - pad,
          top: rect.top - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          borderRadius: 18,
          caretX: rect.left + rect.width / 2,
        };
      }

      const pad = 6;
      return {
        left: rect.left - pad,
        top: rect.top - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        borderRadius: 14,
        caretX: rect.left + rect.width / 2,
      };
    }

    // Static fallback calculations when element is not measured yet
    const bottomNavHeight = 54;
    const bottomNavPadding = 8;
    const barTrackWidth = containerWidth - 24;
    const activeTabWidth = Math.min(80, barTrackWidth * 0.28);
    const inactiveTabWidth = Math.max(0, barTrackWidth - activeTabWidth - 12) / 3;
    const tab1Center =
      containerLeft + 12 + activeTabWidth + 4 + inactiveTabWidth / 2;
    const tab2Center =
      containerLeft +
      12 +
      activeTabWidth +
      4 +
      (inactiveTabWidth + 4) +
      inactiveTabWidth / 2;
    const tab3Center =
      containerLeft +
      12 +
      activeTabWidth +
      4 +
      (inactiveTabWidth + 4) * 2 +
      inactiveTabWidth / 2;
    const tabTop = height - 49;

    switch (currentStep.target) {
      case "top-bar":
        return {
          left: containerLeft + 14,
          top: safeTop + 8,
          width: containerWidth - 28,
          height: 50,
          borderRadius: 25,
          caretX: containerLeft + containerWidth - 60,
        };
      case "kpi-stats":
        return {
          left: containerLeft + 14,
          top: safeTop + 112,
          width: containerWidth - 28,
          height: 96,
          borderRadius: 16,
          caretX: containerLeft + containerWidth / 2,
        };
      case "map-tab":
        return {
          left: tab1Center - 33,
          top: tabTop,
          width: 66,
          height: 44,
          borderRadius: 22,
          caretX: tab1Center,
        };
      case "eco-tab":
        return {
          left: tab2Center - 39,
          top: tabTop,
          width: 78,
          height: 44,
          borderRadius: 22,
          caretX: tab2Center,
        };
      case "assistant-btn": {
        const fabBottom = bottomNavPadding + bottomNavHeight + 12; // 74
        const fabSize = 48;
        const spotSize = 58;
        const fabCenterX = containerLeft + containerWidth - 16 - fabSize / 2;
        const fabCenterY = height - fabBottom - fabSize / 2;
        return {
          left: fabCenterX - spotSize / 2,
          top: fabCenterY - spotSize / 2,
          width: spotSize,
          height: spotSize,
          borderRadius: spotSize / 2,
          caretX: fabCenterX,
        };
      }
      case "profile-tab":
        return {
          left: tab3Center - 33,
          top: tabTop,
          width: 66,
          height: 44,
          borderRadius: 22,
          caretX: tab3Center,
        };
      case "manifests-tab":
        return {
          left: tab1Center - 39,
          top: tabTop,
          width: 78,
          height: 44,
          borderRadius: 22,
          caretX: tab1Center,
        };
      case "buy-pass-tab":
        return {
          left: tab2Center - 39,
          top: tabTop,
          width: 78,
          height: 44,
          borderRadius: 22,
          caretX: tab2Center,
        };
      case "op-profile-tab":
        return {
          left: tab3Center - 33,
          top: tabTop,
          width: 66,
          height: 44,
          borderRadius: 22,
          caretX: tab3Center,
        };
      default:
        return {
          left: containerLeft + 20,
          top: safeTop + 20,
          width: containerWidth - 40,
          height: 50,
          borderRadius: 12,
          caretX: containerLeft + containerWidth / 2,
        };
    }
  }, [
    currentStep.target,
    targetRect,
    containerWidth,
    containerLeft,
    safeTop,
    height,
    width,
  ]);

  // Card position calculations
  const cardWidth = Math.min(containerWidth - 36, 335);
  const cardLeft = Math.max(
    containerLeft + 18,
    Math.min(
      containerLeft + containerWidth - cardWidth - 18,
      spotlight.caretX - cardWidth / 2,
    ),
  );
  const caretRelativeX = Math.max(
    22,
    Math.min(cardWidth - 22, spotlight.caretX - cardLeft),
  );

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];
      if (nextStep) {
        setTargetRect(getElementViewportRect(`tutorial-${nextStep.target}`));
      }
      setCurrentStepIndex(nextIndex);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      const prevIndex = currentStepIndex - 1;
      const prevStep = steps[prevIndex];
      if (prevStep) {
        setTargetRect(getElementViewportRect(`tutorial-${prevStep.target}`));
      }
      setCurrentStepIndex(prevIndex);
    }
  };

  const handleClose = () => {
    setCurrentStepIndex(0);
    dismissTutorial();
  };

  if (!isTutorialActive) {
    return null;
  }

  return (
    <Modal
      visible={isTutorialActive}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop} pointerEvents="auto">
        {/* Dimmed background overlay */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        {/* Highlighted Spotlight Ring around target */}
        <View
          style={[
            styles.spotlightRing,
            {
              left: spotlight.left,
              top: spotlight.top,
              width: spotlight.width,
              height: spotlight.height,
              borderRadius: spotlight.borderRadius,
            },
          ]}
          pointerEvents="none"
        >
          <View
            style={[
              styles.spotlightInner,
              { borderRadius: spotlight.borderRadius },
            ]}
          />
        </View>

        {/* Floating Popover Card with Caret Arrow */}
        <View
          style={[
            styles.popoverCard,
            {
              width: cardWidth,
              left: cardLeft,
              ...(currentStep.caretPosition === "top"
                ? { top: spotlight.top + spotlight.height + 14 }
                : { bottom: height - spotlight.top + 14 }),
            },
          ]}
          accessibilityRole="alert"
          accessibilityLabel={`${currentStep.title}, step ${currentStepIndex + 1} of ${totalSteps}`}
        >
          {/* Caret Arrow pointing at spotlight */}
          {currentStep.caretPosition === "top" ? (
            <View style={[styles.caretUp, { left: caretRelativeX - 9 }]} />
          ) : (
            <View style={[styles.caretDown, { left: caretRelativeX - 9 }]} />
          )}

          {/* Card Header: Title + Close Button */}
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name={currentStep.icon} size={15} color="#006bff" />
              </View>
              <Text style={styles.titleText}>{currentStep.title}</Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              hitSlop={10}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close tutorial"
            >
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Card Body Description */}
          <Text style={styles.descriptionText}>{currentStep.description}</Text>

          {/* Card Footer: Step Counter + Navigation Controls */}
          <View style={styles.cardFooter}>
            <Text style={styles.stepCounterText}>
              {currentStepIndex + 1}/{totalSteps}
            </Text>

            <View style={styles.actionRow}>
              {/* Previous circular button */}
              <TouchableOpacity
                onPress={handleBack}
                disabled={isFirstStep}
                style={[styles.backBtn, isFirstStep && styles.backBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Previous step"
              >
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={isFirstStep ? "#CBD5E1" : "#0F172A"}
                />
              </TouchableOpacity>

              {/* Next / Done pill button (OKX / Uber Eats style) */}
              <TouchableOpacity
                onPress={handleNext}
                style={styles.nextBtn}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={
                  isLastStep ? "Finish tutorial" : "Next step"
                }
              >
                <Text style={styles.nextBtnText}>
                  {isLastStep ? "Done" : "Next"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(11, 24, 48, 0.65)",
    zIndex: 999999,
  },
  spotlightRing: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#006bff",
    shadowOpacity: 0.9,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  spotlightInner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: "rgba(0, 107, 255, 0.5)",
  },
  popoverCard: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    zIndex: 1000000,
  },
  caretUp: {
    position: "absolute",
    top: -9,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
  caretDown: {
    position: "absolute",
    bottom: -9,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FFFFFF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    paddingRight: 6,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e0efff",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  titleText: {
    fontSize: 15.5,
    fontFamily: "Quicksand_700Bold",
    color: "#0F172A",
    flex: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  stepCounterText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnDisabled: {
    opacity: 0.35,
    borderColor: "#F1F5F9",
  },
  nextBtn: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 68,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    letterSpacing: 0.2,
  },
});
