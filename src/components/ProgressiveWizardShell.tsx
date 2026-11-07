import { Ionicons } from "@expo/vector-icons";
import React, { ReactNode, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ContentContainer from "./ContentContainer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WizardAction {
  label: string;
  onPress: () => void;
}

interface ProgressiveWizardShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: string[];
  currentIndex: number;
  stepDescription: string;
  onHeaderBack: () => void;
  secondaryAction?: WizardAction;
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  children: ReactNode;
}

export function ProgressiveWizardShell({
  eyebrow,
  title,
  subtitle,
  steps,
  currentIndex,
  stepDescription,
  onHeaderBack,
  secondaryAction,
  primaryLabel,
  onPrimaryPress,
  primaryDisabled = false,
  primaryLoading = false,
  children,
}: ProgressiveWizardShellProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentIndex]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onHeaderBack}
          hitSlop={8}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color="#12316c" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>{eyebrow}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={2}>{subtitle}</Text>
        </View>
      </View>

      <ContentContainer maxWidth={480} paddingH={14} style={styles.progressWrap}>
        <View
          style={styles.progressCard}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: steps.length, now: currentIndex + 1 }}
          accessibilityLabel={`Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex]}`}
        >
          <View style={styles.progressHeading}>
            <View style={styles.progressTitleGroup}>
              <Text style={styles.progressEyebrow}>STEP {currentIndex + 1} OF {steps.length}</Text>
              <Text style={styles.progressCurrent}>{steps[currentIndex]}</Text>
            </View>
            <Text style={styles.progressDescription}>{stepDescription}</Text>
          </View>
          <View style={styles.progressSteps}>
            {steps.map((label, index) => {
              const active = index === currentIndex;
              const complete = index < currentIndex;
              return (
                <View key={`${label}-${index}`} style={styles.progressStep}>
                  <View style={[
                    styles.progressNode,
                    active && styles.progressNodeActive,
                    complete && styles.progressNodeComplete,
                  ]}>
                    {complete
                      ? <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      : <Text style={[styles.progressNodeText, active && styles.progressNodeTextActive]}>{index + 1}</Text>}
                  </View>
                  {index < steps.length - 1 ? (
                    <View style={[styles.progressConnector, complete && styles.progressConnectorComplete]} />
                  ) : null}
                  <Text numberOfLines={2} style={[
                    styles.progressStepLabel,
                    active && styles.progressStepLabelActive,
                    complete && styles.progressStepLabelComplete,
                  ]}>{label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ContentContainer>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ContentContainer maxWidth={480} paddingH={14}>
            {children}
          </ContentContainer>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <ContentContainer maxWidth={480} paddingH={14} style={styles.footerContent}>
            <View style={styles.footerActions}>
              {secondaryAction ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={secondaryAction.onPress}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Ionicons name={secondaryAction.label === "Cancel" ? "close" : "arrow-back"} size={17} color="#006bff" />
                  <Text style={styles.secondaryText}>{secondaryAction.label}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.primaryButton, !secondaryAction && styles.primaryButtonFull, primaryDisabled && styles.disabled]}
                onPress={onPrimaryPress}
                activeOpacity={0.88}
                disabled={primaryDisabled || primaryLoading}
                accessibilityRole="button"
                accessibilityState={{ disabled: primaryDisabled || primaryLoading }}
              >
                {primaryLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text numberOfLines={1} style={styles.primaryText}>{primaryLabel}</Text>
                    <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ContentContainer>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f4f8fd" },
  header: {
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
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#e7f3ff" },
  headerCopy: { flex: 1, minWidth: 0 },
  headerEyebrow: { fontSize: 9, letterSpacing: 0.9, fontFamily: "Quicksand_700Bold", color: "#7890b2", marginBottom: 2 },
  headerTitle: { fontSize: 19, fontFamily: "Quicksand_700Bold", color: "#07156c" },
  headerSubtitle: { fontSize: 10.5, lineHeight: 14, fontFamily: "Quicksand_500Medium", color: "#647797", marginTop: 2 },
  progressWrap: { paddingTop: 14 },
  progressCard: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#e7edf5", padding: 16, marginBottom: 14, shadowColor: "#2f5684", shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  progressHeading: { flexDirection: "column", alignItems: "flex-start", gap: 3, marginBottom: 14 },
  progressTitleGroup: { gap: 2 },
  progressEyebrow: { fontSize: 9, letterSpacing: 0.8, fontFamily: "Quicksand_700Bold", color: "#8191a9" },
  progressCurrent: { fontSize: 17, fontFamily: "Quicksand_700Bold", color: "#102e59" },
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
  body: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingBottom: 24 },
  footer: { paddingHorizontal: 0, paddingTop: 11, paddingBottom: 10, backgroundColor: "#FFFFFF", borderTopWidth: 1, borderTopColor: "#e7edf5", shadowColor: "#21456c", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: -3 }, elevation: 8 },
  footerContent: { },
  footerActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  secondaryButton: { minHeight: 48, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, borderWidth: 1.3, borderColor: "#9dc5ff", backgroundColor: "#FFFFFF" },
  secondaryText: { fontSize: 12, fontFamily: "Quicksand_700Bold", color: "#006bff" },
  primaryButton: { minHeight: 48, flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingHorizontal: 10, backgroundColor: "#087bff", shadowColor: "#0065fa", shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  primaryButtonFull: { flex: 1 },
  primaryText: { flexShrink: 1, fontSize: 12.5, fontFamily: "Quicksand_700Bold", color: "#FFFFFF" },
  disabled: { opacity: 0.48 },
});
