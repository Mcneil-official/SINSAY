import { Image } from "expo-image";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLayout } from "../context/LayoutContext";

export default function Index() {
  const router = useRouter();
  const { isDesktop } = useLayout();

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot}>
        <View style={styles.desktopLeft}>
          <Image
            source={require("../../assets/images/1.png")}
            style={styles.desktopHeroImage}
            contentFit="cover"
          />
        </View>
        <View style={styles.desktopRight}>
          <Stack.Screen options={{ headerShown: false }} />
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={styles.subtitle}>Tara, Sinsay na sa Mabini!</Text>
          <View style={styles.desktopFooter}>
            <Pressable
              style={styles.button}
              onPress={() => router.push("/next")}
            >
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

  return (
    <ImageBackground
      source={require("../../assets/images/1.png")}
      style={styles.container}
    >
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
          <Pressable
            style={styles.button}
            onPress={() => router.push("/next")}
          >
            <Text style={styles.buttonText}>Explore</Text>
          </Pressable>

          <Text style={styles.note}>
            Before you explore, learn how to protect Mabini's marine ecosystem.
          </Text>
        </View>
      </View>
    </ImageBackground>
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
});
