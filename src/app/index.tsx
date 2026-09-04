import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLayout } from "../context/LayoutContext";

export default function Index() {
  const router = useRouter();
  const { isTablet, isDesktop } = useLayout();
  const isWide = isTablet || isDesktop;

  if (isWide) {
    return (
      <View style={styles.wideRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.wideCard}>
          <View style={styles.wideLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.wideLogo}
              contentFit="contain"
            />
            <View style={styles.wideBody}>
              <Text style={styles.wideSubtitle}>
                Tara, Sinsay na sa Mabini!
              </Text>
              <Pressable
                style={styles.wideCta}
                onPress={() => router.push("/next")}
              >
                <Text style={styles.wideCtaText}>Explore</Text>
              </Pressable>
              <Text style={styles.wideNote}>
                Before you explore, learn how to protect Mabini's marine
                ecosystem.
              </Text>
            </View>
          </View>
          <View style={styles.wideRight}>
            <Image
              source={require("../../assets/images/1.png")}
              style={styles.wideImage}
              contentFit="cover"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/1.png")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        pointerEvents="none"
      />
      <View style={styles.content}>
        <Stack.Screen options={{ headerShown: false }} />
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.subtitle}>Tara, Sinsay na sa Mabini!</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.bottomSection}>
          <Pressable style={styles.button} onPress={() => router.push("/next")}>
            <Text style={styles.buttonText}>Explore</Text>
          </Pressable>

          <Text style={styles.note}>
            Before you explore, learn how to protect Mabini's marine ecosystem.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 90,
    paddingBottom: 32,
    backgroundColor: "#f7f3ea",
    overflow: "hidden",
  },
  content: {
    gap: 0,
  },
  logo: {
    width: 250,
    height: 60,
  },
  bottomSection: {
    width: "100%",
    gap: 10,
    marginBottom: 120,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: "#000000",
    textAlign: "center",
    fontWeight: "700",
    marginTop: -8,
  },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  footer: {
    alignSelf: "stretch",
    gap: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  note: {
    fontSize: 10,
    color: "#ffffff",
    textAlign: "center",
  },
  desktopRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f7f3ea",
  },
  desktopLeft: {
    flex: 1,
    overflow: "hidden",
  },
  desktopHeroImage: {
    width: "100%",
    height: "100%",
  },
  desktopRight: {
    width: 480,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 48,
    gap: 16,
  },
  desktopFooter: {
    width: "100%",
    gap: 10,
    marginTop: 24,
  },
  wideRoot: {
    flex: 1,
    backgroundColor: "#DCEBFB",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  wideCard: {
    flexDirection: "row",
    width: "100%",
    maxWidth: 1280,
    height: "100%",
    maxHeight: 780,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  wideLeft: {
    width: "42%",
    backgroundColor: "#fff",
    borderTopRightRadius: 160,
    borderBottomRightRadius: 160,
    paddingHorizontal: 48,
    paddingVertical: 40,
    justifyContent: "space-between",
    zIndex: 2,
  },
  wideLogo: { width: 160, height: 44 },
  wideBody: { gap: 16, marginBottom: 24 },
  wideSubtitle: { fontSize: 22, fontWeight: "700", color: "#000" },
  wideCta: {
    alignSelf: "stretch",
    backgroundColor: "#176FF2",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  wideCtaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  wideNote: { fontSize: 12, color: "#6B7280" },
  wideRight: { flex: 1 },
  wideImage: { width: "100%", height: "100%" },
});
