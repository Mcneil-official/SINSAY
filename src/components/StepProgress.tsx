import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

interface StepProgressProps {
  steps: string[];
  currentIndex: number; // 0-based
}

export function StepProgress({ steps, currentIndex }: StepProgressProps) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: steps.length - 1, now: currentIndex }}
      accessibilityLabel={`Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex]}`}
    >
      {steps.map((label, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepWrap}>
              {isDone ? (
                <View style={[styles.dot, styles.dotDone]}>
                  <Ionicons name="checkmark" size={8} color={colors.white} />
                </View>
              ) : (
                <View style={[styles.dot, isActive && styles.dotActive]} />
              )}
              <Text
                style={[
                  styles.label,
                  (isDone || isActive) && styles.labelActive,
                ]}
              >
                {label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[styles.line, isDone && styles.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  stepWrap: { alignItems: "center", gap: spacing.xs },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.grayLight,
  },
  dotActive: {
    backgroundColor: colors.primaryBlue,
  },
  dotDone: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typography.small,
  },
  labelActive: {
    color: colors.primaryBlue,
    fontWeight: "600",
  },
  line: {
    width: 48,
    height: 2,
    backgroundColor: colors.grayLight,
    marginHorizontal: spacing.sm,
    marginBottom: 18,
  },
  lineDone: {
    backgroundColor: colors.primaryBlue,
  },
});
