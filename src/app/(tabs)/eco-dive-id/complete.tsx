import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { colors } from "../../../constants/colors";
import { StatusBadge, Card, ErrorState } from "../../../components";
import { useAuth } from "../../../hooks/useAuth";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const steps = [
  { label: "Registered", icon: "checkmark-circle", status: "done" as const },
  { label: "Profile Complete", icon: "checkmark-circle", status: "done" as const },
  { label: "Added to Manifesto", icon: "time", status: "current" as const },
  { label: "Activated", icon: "ellipse-outline", status: "pending" as const },
];

const labels: Record<string, string> = {
  filipino: "Filipino",
  american: "American",
  japanese: "Japanese",
  korean: "Korean",
  chinese: "Chinese",
  australian: "Australian",
  european: "European",
  other: "Other",
};

const diveTypeLabels: Record<string, string> = {
  "intro-fun": "Intro/Fun Dive",
  certified: "Certified",
};

export default function EcoDiveIDCompleteScreen() {
  const router = useRouter();
  const { user, profile, ecoId, isLoading, refreshProfile } = useAuth();
  const prevStatusRef = useRef(ecoId?.status);

  useEffect(() => {
    if (prevStatusRef.current === "complete" && ecoId?.status === "active") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    prevStatusRef.current = ecoId?.status;
  }, [ecoId?.status]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/loginpage");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!isLoading && (!ecoId || (ecoId.status !== "complete" && ecoId.status !== "active"))) {
      router.replace("/eco-dive-id");
    }
  }, [isLoading, ecoId, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={colors.primaryBlue} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState
          message="Unable to load profile data."
          description="Your account may not be fully set up. Please contact support or try again."
          onRetry={() => refreshProfile()}
        />
      </SafeAreaView>
    );
  }

  if (ecoId?.status === "active") {
    return <ActiveIDScreen profile={profile} ecoId={ecoId} router={router} />;
  }

  const idNumber = ecoId?.eco_id_number || `ECO-${new Date().getFullYear()}-000001`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Digital Diver ID</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Your official dive identity in Mabini</Text>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Gradient ID Card — completed state */}
        <View style={styles.idCard}>
          <View style={styles.idCardTop}>
            <View style={styles.ecoPill}>
              <Ionicons name="water" size={14} color={colors.white} />
              <Text style={styles.ecoPillText}>ECO-DIVE ID</Text>
            </View>
            <StatusBadge label="Ready for Manifesto" variant="ready" />
          </View>
          <Text style={styles.idCardName}>{profile?.full_name || "Diver"}</Text>
          <Text style={styles.idCardCode}>{idNumber}</Text>
          <View style={styles.idCardInfoRow}>
            <View style={styles.idCardInfoItem}>
              <Text style={styles.infoItemLabel}>Nationality</Text>
              <Text style={styles.infoItemValue}>{labels[profile?.nationality || ""] || profile?.nationality || "N/A"}</Text>
            </View>
            <View style={styles.idCardInfoItem}>
              <Text style={styles.infoItemLabel}>Dive Type</Text>
              <Text style={styles.infoItemValue}>{diveTypeLabels[profile?.type_of_dive || ""] || profile?.type_of_dive || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Caption */}
        <Text style={styles.caption}>
          Your profile is complete. Please coordinate with your resort to be
          included in a dive manifesto.
        </Text>

        {/* Dive Status Tracker */}
        <Card style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>Dive Status Tracker</Text>
          <View style={styles.trackerSteps}>
            {steps.map((step, i) => (
              <View key={i} style={styles.trackerStep}>
                <View style={styles.trackerStepLeft}>
                  {step.status === "done" ? (
                    <View style={[styles.stepIcon, styles.stepIconDone]}>
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    </View>
                  ) : step.status === "current" ? (
                    <View style={[styles.stepIcon, styles.stepIconCurrent]}>
                      <Ionicons name="time" size={14} color={colors.white} />
                    </View>
                  ) : (
                    <View style={[styles.stepIcon, styles.stepIconPending]}>
                      <View style={styles.stepDot} />
                    </View>
                  )}
                  {i < steps.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        step.status === "done" && styles.stepLineDone,
                        step.status === "current" && styles.stepLinePending,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    step.status === "pending" && styles.stepLabelPending,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ActiveIDScreen({ profile, ecoId, router }: { profile: any; ecoId: any; router: any }) {
  const idNumber = ecoId?.eco_id_number || `ECO-${new Date().getFullYear()}-000001`;

  const activeSteps = [
    { label: "Registered", status: "done" as const },
    { label: "Profile Complete", status: "done" as const },
    { label: "Added to Manifesto", status: "done" as const },
    { label: "Activated", status: "done" as const },
  ];

  const labels: Record<string, string> = {
    filipino: "Filipino",
    american: "American",
    japanese: "Japanese",
    korean: "Korean",
    chinese: "Chinese",
    australian: "Australian",
    european: "European",
    other: "Other",
  };

  const diveTypeLabels: Record<string, string> = {
    "intro-fun": "Intro/Fun Dive",
    certified: "Certified",
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.darkText} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Digital Diver ID</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>Your official dive identity in Mabini</Text>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Active ID Card */}
        <View style={activeStyles.idCard}>
          <View style={styles.idCardTop}>
            <View style={styles.ecoPill}>
              <Ionicons name="water" size={14} color={colors.white} />
              <Text style={styles.ecoPillText}>ECO-DIVE ID</Text>
            </View>
            <View style={activeStyles.activeBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.white} />
              <Text style={activeStyles.activeBadgeText}>Active</Text>
            </View>
          </View>
          <Text style={styles.idCardName}>{profile?.full_name || "Diver"}</Text>
          <Text style={styles.idCardCode}>{idNumber}</Text>
          <View style={styles.idCardInfoRow}>
            <View style={styles.idCardInfoItem}>
              <Text style={styles.infoItemLabel}>Nationality</Text>
              <Text style={styles.infoItemValue}>{labels[profile?.nationality || ""] || profile?.nationality || "N/A"}</Text>
            </View>
            <View style={styles.idCardInfoItem}>
              <Text style={styles.infoItemLabel}>Dive Type</Text>
              <Text style={styles.infoItemValue}>{diveTypeLabels[profile?.type_of_dive || ""] || profile?.type_of_dive || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Activation message */}
        <View style={activeStyles.activatedCard}>
          <Ionicons name="checkmark-circle" size={24} color={colors.green} />
          <Text style={activeStyles.activatedText}>
            You are now part of an active Dive Manifesto. Your Eco-Dive ID is fully activated.
          </Text>
        </View>

        {/* Dive Status Tracker */}
        <Card style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>Dive Status Tracker</Text>
          <View style={styles.trackerSteps}>
            {activeSteps.map((step, i) => (
              <View key={i} style={styles.trackerStep}>
                <View style={styles.trackerStepLeft}>
                  <View style={[styles.stepIcon, styles.stepIconDone]}>
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  </View>
                  {i < activeSteps.length - 1 && <View style={[styles.stepLine, styles.stepLineDone]} />}
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: 120 }} />
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
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.darkText,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  idCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: colors.navy,
    padding: 20,
    gap: 8,
    overflow: "hidden",
  },
  idCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ecoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ecoPillText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  idCardName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  idCardCode: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  idCardInfoRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 4,
  },
  idCardInfoItem: {
    gap: 2,
  },
  infoItemLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoItemValue: {
    fontSize: 13,
    color: colors.white,
    fontWeight: "500",
  },
  caption: {
    fontSize: 13,
    color: colors.gray,
    marginTop: 16,
    lineHeight: 18,
  },
  trackerCard: {
    marginTop: 20,
    padding: 20,
  },
  trackerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 16,
  },
  trackerSteps: {
    gap: 0,
  },
  trackerStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  trackerStepLeft: {
    alignItems: "center",
    width: 28,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconDone: {
    backgroundColor: colors.green,
  },
  stepIconCurrent: {
    backgroundColor: "#D97706",
  },
  stepIconPending: {
    backgroundColor: colors.grayLight,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray,
  },
  stepLine: {
    width: 2,
    flex: 1,
    alignSelf: "center",
    marginVertical: 2,
  },
  stepLineDone: {
    backgroundColor: colors.green,
  },
  stepLinePending: {
    backgroundColor: colors.grayLight,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.darkText,
    fontWeight: "500",
    paddingTop: 4,
    paddingBottom: 20,
  },
  stepLabelPending: {
    color: colors.gray,
  },
});

const activeStyles = StyleSheet.create({
  idCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: colors.green,
    padding: 20,
    gap: 8,
    overflow: "hidden",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  activeBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  activatedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 14,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  activatedText: {
    flex: 1,
    fontSize: 13,
    color: colors.darkText,
    lineHeight: 18,
  },
});
