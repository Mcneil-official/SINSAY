import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const STEPS = ["Select Pass", "Pay via GCash", "Upload Receipt"];

interface BuyPassProgressProps {
  currentStep: 1 | 2 | 3;
}

export function BuyPassProgress({ currentStep }: BuyPassProgressProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: STEPS.length, now: currentStep }}
      accessibilityLabel={`Step ${currentStep} of ${STEPS.length}: ${STEPS[currentStep - 1]}`}
    >
      {STEPS.map((label, index) => {
        const step = index + 1;
        const done = step < currentStep;
        const active = step === currentStep;
        return (
          <View key={label} style={styles.step}>
            <View style={styles.markerRow}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    step <= currentStep && styles.connectorDone,
                  ]}
                />
              )}
              <View
                style={[
                  styles.marker,
                  done && styles.markerDone,
                  active && styles.markerActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                ) : (
                  <Text style={[styles.markerText, active && styles.markerTextActive]}>
                    {step}
                  </Text>
                )}
              </View>
              {index < STEPS.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    step < currentStep && styles.connectorDone,
                  ]}
                />
              )}
            </View>
            <Text
              numberOfLines={2}
              style={[
                styles.label,
                (active || done) && styles.labelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  step: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  markerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d8e4f3",
    borderWidth: 1,
    borderColor: "#d8e4f3",
  },
  markerActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#006bff",
    borderWidth: 2,
  },
  markerDone: {
    backgroundColor: "#006bff",
    borderColor: "#006bff",
  },
  markerText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#6f83a3",
  },
  markerTextActive: {
    color: "#006bff",
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: "#d8e4f3",
  },
  connectorDone: {
    backgroundColor: "#006bff",
  },
  label: {
    maxWidth: "100%",
    marginTop: 5,
    paddingHorizontal: 2,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#71809b",
  },
  labelActive: {
    color: "#07156c",
    fontFamily: "Quicksand_700Bold",
  },
});
