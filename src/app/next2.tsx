import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Next2Page() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/3.png")}
        style={styles.heroImage}
        contentFit="cover"
      />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push("/next")}
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
          <Text style={styles.title}>RESPECT MARINE LIFE</Text>

          <Text style={styles.intro}>Look, don't touch.</Text>

          <Text style={styles.body}>
            Corals are alive — even a small touch can damage them.{"\n"}
            {"\n"}
            Feeding or disturbing marine life is not allowed.
          </Text>

          <Text style={styles.closing}>
            Violations may result in penalties.
          </Text>
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.progressRow}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <Pressable
            style={styles.button}
            onPress={() => router.push("/next3")}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    paddingHorizontal: 40,
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
    height: 5 * 100,
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
    fontSize: 28,
    fontWeight: "700",
    color: "#0f304f",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  intro: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#3a342e",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: "#3a342e",
    textAlign: "center",
  },
  closing: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#3a342e",
    textAlign: "center",
  },
  bottomArea: {
    gap: 16,
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
  button: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
