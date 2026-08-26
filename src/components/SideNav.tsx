import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";

type TabRoute = { key: string; name: string };

interface SideNavProps {
  state: { index: number; routes: TabRoute[] };
  navigation: any;
  tabIcons: Record<
    string,
    { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
  >;
  tabLabels: Record<string, string>;
}

export default function SideNav({
  state,
  navigation,
  tabIcons,
  tabLabels,
}: SideNavProps) {
  const { signOut } = useAuth();

  return (
    <View style={styles.sidebar}>
      <View style={styles.logoSection}>
        <Ionicons name="water" size={28} color={colors.white} />
        <Text style={styles.logoText}>SINSAY</Text>
      </View>

      <View style={styles.navSection}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const name = route.name;
          const icon = tabIcons[name];
          const label = tabLabels[name] || name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.navItem, isFocused && styles.navItemActive]}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
            >
              <Ionicons
                name={isFocused ? icon?.focused || "ellipse" : icon?.unfocused || "ellipse-outline"}
                size={20}
                color={isFocused ? colors.white : "rgba(255,255,255,0.5)"}
              />
              <Text style={[styles.navLabel, isFocused && styles.navLabelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.5)" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 240,
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
  logoText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
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
