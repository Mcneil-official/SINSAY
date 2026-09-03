import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { OnboardingCard } from "../components/OnboardingCard";

export default function Next5Page() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingCard
        heroImage={require("../../assets/images/6.jpeg")}
        onBack={() => router.push("/next4")}
        progressActive={4}
        footer={
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgreed((prev) => !prev)}
            hitSlop={8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and understood all diving guidelines and commit to
              responsible diving in Mabini, Batangas.
            </Text>
          </Pressable>
        }
      >
        <View style={styles.copy}>
          <Text style={styles.title}>YOUR{"\n"}RESPONSIBILITY</Text>
          <Text style={styles.intro}>
            By continuing, you agree to follow all Mabini Eco-Dive Regulations.
          </Text>
          <View style={styles.listBlock}>
            <Text style={styles.listHeader}>Failure to comply may result in:</Text>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Fines</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Restricted access</Text>
            </View>
            <View style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>Reporting to authorities</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomArea}>
          <Pressable
            style={[styles.button, !agreed && styles.buttonDisabled]}
            disabled={!agreed}
            onPress={() => router.push("/loginpage")}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </Pressable>
        </View>
      </OnboardingCard>
    </>
  );
}

const styles = StyleSheet.create({
  copy: { gap: 12, alignItems: "center", paddingHorizontal: 12, paddingBottom: 0 },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0f304f",
    textAlign: "center",
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  intro: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#3a342e",
    textAlign: "center",
    lineHeight: 19,
  },
  listBlock: { alignSelf: "stretch", marginTop: 4, gap: 4 },
  listHeader: { fontSize: 14, color: "#1f1a17", marginBottom: 2 },
  bulletRow: { flexDirection: "row", gap: 6, paddingLeft: 4 },
  bullet: { fontSize: 14, color: "#1f1a17", lineHeight: 20 },
  bulletText: { fontSize: 14, color: "#1f1a17", lineHeight: 20 },
  bottomArea: { gap: 16 },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#176FF2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: "#176FF2" },
  checkmark: { color: "#ffffff", fontSize: 12, fontWeight: "700", lineHeight: 14 },
  checkboxLabel: {
    flex: 1,
    fontSize: 11,
    fontStyle: "italic",
    color: "#5f554d",
    lineHeight: 17,
  },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: { backgroundColor: "#9bbdf0" },
  buttonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
});
