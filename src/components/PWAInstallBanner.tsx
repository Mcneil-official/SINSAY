import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePWAInstall } from "../context/PWAContext";

export default function PWAInstallBanner() {
  const { isInstalled, isBannerDismissed, promptInstall, dismissBanner } =
    usePWAInstall();

  if (Platform.OS !== "web" || isInstalled || isBannerDismissed) {
    return null;
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.banner}>
        <View style={styles.left}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              Install SINSAY
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              Fast home screen & offline access
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.installBtn,
              pressed && styles.installBtnPressed,
            ]}
            onPress={promptInstall}
            accessibilityRole="button"
            accessibilityLabel="Install SINSAY App"
          >
            <Text style={styles.installText}>Install</Text>
          </Pressable>

          <Pressable
            style={styles.closeBtn}
            onPress={dismissBanner}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Dismiss install banner"
          >
            <Ionicons name="close" size={16} color="#64748B" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  banner: {
    width: "100%",
    maxWidth: 480,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  installBtn: {
    backgroundColor: "#005EEC",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  installBtnPressed: {
    backgroundColor: "#0048B3",
  },
  installText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
  },
});
