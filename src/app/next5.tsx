import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Next5Page() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/6.jpeg")}
        style={styles.heroImage}
        contentFit="cover"
      />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push("/next4")}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>‹</Text>
        </Pressable>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.brand}
          contentFit="contain"
        />
      </View>

      <View pointerEvents="none" style={styles.oval} />

      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>YOUR{"\n"}RESPONSIBILITY</Text>

          <Text style={styles.intro}>
            By continuing, you agree to follow all Mabini Eco-Dive Regulations.
          </Text>

          <View style={styles.listBlock}>
            <Text style={styles.listHeader}>
              Failure to comply may result in:
            </Text>
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

          <View style={styles.bottomArea}>
            <View style={styles.progressRow}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} />
            </View>

            <Pressable
              style={[styles.button, !agreed && styles.buttonDisabled]}
              disabled={!agreed}
              onPress={() => router.push("/loginpage")}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    paddingHorizontal: 35,
    paddingTop: 80,
    paddingBottom: 32,
    backgroundColor: "#f7f3ea",
    overflow: "hidden",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 500,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 3,
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 32,
    lineHeight: 32,
    color: "#1f1a17",
    fontWeight: "400",
  },
  brand: {
    width: 120,
    height: 40,
  },
  oval: {
    position: "absolute",
    left: "-40%",
    right: "-40%",
    bottom: -60,
    height: "72%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    elevation: 8,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 30,
    zIndex: 1,
  },
  copy: {
    gap: 12,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
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
  listBlock: {
    alignSelf: "stretch",
    marginTop: 4,
    gap: 4,
  },
  listHeader: {
    fontSize: 14,
    color: "#1f1a17",
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 6,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 14,
    color: "#1f1a17",
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    color: "#1f1a17",
    lineHeight: 20,
  },
  bottomArea: {
    gap: 16,
  },
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
  checkboxChecked: {
    backgroundColor: "#176FF2",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
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
  buttonDisabled: {
    backgroundColor: "#9bbdf0",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#d2d2d2",
  },
  activeDot: {
    width: 18,
    backgroundColor: "#0f304f",
  },
});
