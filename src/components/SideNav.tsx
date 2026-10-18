import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import ConfirmModal from "./ConfirmModal";

type TabRoute = { key: string; name: string };

interface SideNavProps {
  state?: { index: number; routes: TabRoute[] };
  navigation?: any;
  tabIcons: Record<
    string,
    {
      focused: keyof typeof Ionicons.glyphMap;
      unfocused: keyof typeof Ionicons.glyphMap;
    }
  >;
  tabLabels: Record<string, string>;
  activeTab?: string;
  onSelect?: (name: string) => void;
  width?: number;
}

export default function SideNav({
  state,
  navigation,
  tabIcons,
  tabLabels,
  activeTab,
  onSelect,
  width = 240,
}: SideNavProps) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      router.replace("/loginpage");
    }
  };

  const navRoutes = state?.routes ?? Object.keys(tabLabels).map((name) => ({ key: name, name }));

  const handlePress = (name: string, index: number) => {
    if (onSelect) {
      onSelect(name);
      return;
    }
    if (!navigation || !state) return;
    const route = state.routes[index];
    const event = navigation.emit?.({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (index !== state.index && !event?.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  return (
    <View style={[styles.sidebar, { width }]}>
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoImage}
          contentFit="contain"
          tintColor="#FFFFFF"
          accessibilityLabel="SINSAY"
        />
      </View>

      <View style={styles.navSection}>
        {navRoutes.map((route, index) => {
          const name = route.name;
          const isFocused = activeTab !== undefined
            ? activeTab === name
            : state?.index === index;
          const icon = tabIcons[name];
          const label = tabLabels[name] || name;

          return (
            <TouchableOpacity
              key={route.key ?? name}
              onPress={() => handlePress(name, index)}
              style={[styles.navItem, isFocused && styles.navItemActive]}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
            >
              <Ionicons
                name={
                  isFocused
                    ? icon?.focused || "ellipse"
                    : icon?.unfocused || "ellipse-outline"
                }
                size={20}
                color={isFocused ? colors.white : "rgba(255,255,255,0.5)"}
              />
              <Text
                style={[styles.navLabel, isFocused && styles.navLabelActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color="rgba(255,255,255,0.5)"
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={showLogoutModal}
        title="Log Out"
        message="Are you sure you want to log out?"
        cancelText="Cancel"
        confirmText="Log Out"
        icon="log-out-outline"
        destructive
        isLoading={isLoggingOut}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#0F172A",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 100,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  logoImage: {
    width: 130,
    height: 30,
  },
  navSection: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  navLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
  navLabelActive: {
    color: colors.white,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  logoutText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "500",
  },
});
