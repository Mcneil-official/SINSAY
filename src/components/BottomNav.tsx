import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

type TabRoute = { key: string; name: string };

interface BottomNavProps {
  state: { index: number; routes: TabRoute[] };
  navigation: any;
  tabIcons: Record<
    string,
    {
      focused: keyof typeof Ionicons.glyphMap;
      unfocused: keyof typeof Ionicons.glyphMap;
    }
  >;
  tabLabels: Record<string, string>;
}

export default function BottomNav({
  state,
  navigation,
  tabIcons,
  tabLabels,
}: BottomNavProps) {
  return (
    <View style={styles.barWrap}>
      <View style={styles.bar}>
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

          if (isFocused) {
            return (
              <View key={route.key} style={styles.activeTab} accessibilityRole="tab" accessibilityState={{ selected: true }}>
                <Ionicons
                  name={icon?.focused || "ellipse"}
                  size={18}
                  color={colors.navy}
                />
                <Text style={styles.activeText}>{label}</Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.inactiveTab}
              activeOpacity={0.6}
              accessibilityRole="tab"
              accessibilityState={{ selected: false }}
              accessibilityLabel={label}
            >
              <Ionicons
                name={icon?.unfocused || "ellipse-outline"}
                size={20}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: "absolute",
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    borderRadius: 100,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  activeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 100,
    height: 42,
    paddingHorizontal: 16,
    gap: 6,
  },
  activeText: {
    color: colors.navy,
    fontWeight: "600",
    fontSize: 13,
  },
  inactiveTab: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
});
