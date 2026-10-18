import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePWAInstall } from "../context/PWAContext";

export default function PWAInstallModal() {
  const { showInstallModal, setShowInstallModal, isIOS, isInstalled } =
    usePWAInstall();

  if (!showInstallModal) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={showInstallModal}
      onRequestClose={() => setShowInstallModal(false)}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.backdropPressable}
          onPress={() => setShowInstallModal(false)}
        />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.title}>Install SINSAY</Text>
                <Text style={styles.subtitle}>Eco-Dive Tourism Batangas</Text>
              </View>
            </View>
            <Pressable
              style={styles.closeBtn}
              onPress={() => setShowInstallModal(false)}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </Pressable>
          </View>

          {isInstalled ? (
            <View style={styles.installedBox}>
              <Ionicons name="checkmark-circle" size={32} color="#16A34A" />
              <Text style={styles.installedTitle}>App Already Installed!</Text>
              <Text style={styles.installedSub}>
                SINSAY is installed on your device. You can launch it directly
                from your home screen or app drawer.
              </Text>
            </View>
          ) : isIOS ? (
            <View style={styles.stepsContainer}>
              <Text style={styles.guideIntro}>
                Follow these simple steps in Safari to add SINSAY to your home
                screen:
              </Text>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Tap the <Text style={styles.stepBold}>Share</Text> button in
                    the Safari toolbar at the bottom of your screen.
                  </Text>
                  <View style={styles.iconChip}>
                    <Ionicons name="share-outline" size={18} color="#005EEC" />
                    <Text style={styles.iconChipText}>Share icon</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Scroll down and tap{" "}
                    <Text style={styles.stepBold}>Add to Home Screen</Text>.
                  </Text>
                  <View style={styles.iconChip}>
                    <Ionicons
                      name="add-circle-outline"
                      size={18}
                      color="#005EEC"
                    />
                    <Text style={styles.iconChipText}>Add to Home Screen</Text>
                  </View>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Tap <Text style={styles.stepBold}>Add</Text> in the
                    top-right corner to finish.
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.stepsContainer}>
              <Text style={styles.guideIntro}>
                To install SINSAY in your browser:
              </Text>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Tap the browser menu button (three dots{" "}
                    <Text style={styles.stepBold}>⋮</Text> or address bar
                    install icon).
                  </Text>
                </View>
              </View>

              <View style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>
                    Select <Text style={styles.stepBold}>Install app</Text> or{" "}
                    <Text style={styles.stepBold}>Add to Home screen</Text>.
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Pressable
            style={styles.doneBtn}
            onPress={() => setShowInstallModal(false)}
          >
            <Text style={styles.doneBtnText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appIcon: {
    width: 44,
    height: 44,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  guideIntro: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 14,
    lineHeight: 18,
  },
  stepsContainer: {
    gap: 14,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: "700",
    color: "#005EEC",
  },
  stepContent: {
    flex: 1,
    gap: 6,
  },
  stepText: {
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 19,
  },
  stepBold: {
    fontWeight: "700",
    color: "#005EEC",
  },
  iconChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0F9FF",
    borderColor: "#BAE6FD",
    borderWidth: 1,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  iconChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0369A1",
  },
  installedBox: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 8,
  },
  installedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#16A34A",
  },
  installedSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 19,
  },
  doneBtn: {
    backgroundColor: "#005EEC",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
