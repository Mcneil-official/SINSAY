import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
  target: "top-bar" | "map-tab" | "eco-tab" | "assistant-btn" | "profile-tab" | "kpi-stats" | "manifests-tab" | "buy-pass-tab" | "op-profile-tab";
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
  const safeBottom = Math.max(insets.bottom, 12);

  // Calculate geometry for spotlight based on target
  const spotlight = useMemo(() => {
    const tabWidth = containerWidth / 4;

    switch (currentStep.target) {
      case "top-bar":
        return {
          left: containerLeft + 14,
          top: safeTop + 6,
          width: containerWidth - 28,
          height: 52,
          borderRadius: 26,
          caretX: containerLeft + 36,
        };
      case "kpi-stats":
        return {
          left: containerLeft + 14,
          top: safeTop + 12,
          width: containerWidth - 28,
          height: 105,
          borderRadius: 18,
          caretX: containerLeft + 60,
        };
      case "map-tab":
        return {
          left: containerLeft + tabWidth * 1 + (tabWidth - 64) / 2,
          top: height - safeBottom - 56,
          width: 64,
          height: 48,
          borderRadius: 24,
          caretX: containerLeft + tabWidth * 1 + tabWidth / 2,
        };
      case "eco-tab":
        return {
          left: containerLeft + tabWidth * 2 + (tabWidth - 80) / 2,
          top: height - safeBottom - 56,
          width: 80,
          height: 48,
          borderRadius: 24,
          caretX: containerLeft + tabWidth * 2 + tabWidth / 2,
        };
      case "assistant-btn":
        return {
          left: containerLeft + containerWidth - 70,
          top: height - safeBottom - 128,
          width: 56,
          height: 56,
          borderRadius: 28,
          caretX: containerLeft + containerWidth - 42,
        };
      case "profile-tab":
        return {
          left: containerLeft + tabWidth * 3 + (tabWidth - 64) / 2,
          top: height - safeBottom - 56,
          width: 64,
          height: 48,
          borderRadius: 24,
          caretX: containerLeft + tabWidth * 3 + tabWidth / 2,
        };
      case "manifests-tab":
        return {
          left: containerLeft + tabWidth * 1 + (tabWidth - 76) / 2,
          top: height - safeBottom - 56,
          width: 76,
          height: 48,
          borderRadius: 24,
          caretX: containerLeft + tabWidth * 1 + tabWidth / 2,
        };
      case "op-profile-tab":
        return {
          left: containerLeft + tabWidth * 2 + (tabWidth - 68) / 2,
          top: height - safeBottom - 56,
          width: 68,
          height: 48,
          borderRadius: 24,
          caretX: containerLeft + tabWidth * 2 + tabWidth / 2,
        };
      case "buy-pass-tab":
        return {
          left: containerLeft + tabWidth * 3 + (tabWidth - 76) / 2,
          top: height - safeBottom - 56,
          width: 76,
          height: 48,
          borderRadius: 24,
          caretX: containerLeft + tabWidth * 3 + tabWidth / 2,
        };
      default:
        return {
          left: containerLeft + 20,
          top: safeTop + 20,
          width: containerWidth - 40,
          height: 50,
          borderRadius: 12,
          caretX: containerLeft + 50,
        };
    }
  }, [currentStep.target, containerWidth, containerLeft, safeTop, safeBottom, height]);

  // Card position calculations
  const cardWidth = Math.min(containerWidth - 36, 335);
  const cardLeft = Math.max(containerLeft + 18, Math.min(containerLeft + containerWidth - cardWidth - 18, spotlight.caretX - cardWidth / 2));
  const caretRelativeX = Math.max(22, Math.min(cardWidth - 22, spotlight.caretX - cardLeft));

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
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
            <View
              style={[
                styles.caretUp,
                { left: caretRelativeX - 9 },
              ]}
            />
          ) : (
            <View
              style={[
                styles.caretDown,
                { left: caretRelativeX - 9 },
              ]}
            />
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
                style={[
                  styles.backBtn,
                  isFirstStep && styles.backBtnDisabled,
                ]}
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
                accessibilityLabel={isLastStep ? "Finish tutorial" : "Next step"}
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
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
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
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
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
