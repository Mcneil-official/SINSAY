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
  /** Whether to show a raised center action button (default false). */
  showCenterButton?: boolean;
  /** Icon shown in the raised center action button. */
  centerIcon?: keyof typeof Ionicons.glyphMap;
  /** Called when the center action button is pressed. */
  onCenterPress?: () => void;
}

export default function BottomNav({
  state,
  navigation,
  tabIcons,
  tabLabels,
  showCenterButton = false,
  centerIcon = "add",
  onCenterPress,
}: BottomNavProps) {
  // Split tabs left/right of the raised center action button only when showCenterButton is true
  const mid = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes
    .slice(0, mid)
    .map((route, index) => ({ route, index }));
  const rightRoutes = state.routes
    .slice(mid)
    .map((route, index) => ({ route, index: index + mid }));

  const renderTab = (route: TabRoute, index: number) => {
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
        <View
          key={route.key}
          style={styles.activeTab}
          accessibilityRole="tab"
          accessibilityState={{ selected: true }}
        >
          <Ionicons
            name={icon?.focused || "ellipse"}
            size={18}
            color={colors.primaryBlue}
          />
          <Text style={styles.activeText} numberOfLines={1}>{label}</Text>
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
          size={22}
          color="rgba(255,255,255,0.9)"
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.barWrap}>
      <View style={styles.bar}>
        {showCenterButton ? (
          <>
            <View style={styles.side}>
              {leftRoutes.map(({ route, index }) => renderTab(route, index))}
            </View>
            <View style={styles.centerSpacer} />
            <View style={styles.side}>
              {rightRoutes.map(({ route, index }) => renderTab(route, index))}
            </View>
          </>
        ) : (
          state.routes.map((route, index) => renderTab(route, index))
        )}
      </View>

      {showCenterButton && (
        <TouchableOpacity
          style={styles.centerButton}
          onPress={onCenterPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Quick action"
        >
          <Ionicons name={centerIcon} size={26} color={colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    position: "absolute",
    bottom: 24,
    left: 10,
    right: 10,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    height: 64,
    borderRadius: 100,
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  side: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  centerSpacer: {
    width: 56,
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
    color: colors.primaryBlue,
    fontWeight: "700",
    fontSize: 13,
  },
  inactiveTab: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    position: "absolute",
    top: -18,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryBlue,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
});
