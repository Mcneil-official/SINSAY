import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { colors } from "../constants/colors";
import { useLayout } from "../context/LayoutContext";

export const BOTTOM_NAV_HEIGHT = 54;
export const BOTTOM_NAV_PADDING = 8;

const INACTIVE_COLOR = "#657C9B";

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
  /** Allow longer operator labels to wrap in the compact bottom bar. */
  allowLabelWrap?: boolean;
  /** Route names to hide from the rendered bar while keeping them registered in Tabs. */
  hiddenRoutes?: string[];
}

function renderReferenceNavIcon(
  routeName: string,
  color: string,
  size: number,
): React.ReactElement | null {
  const sharedProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (routeName) {
    case "index":
      return (
        <Svg {...sharedProps}>
          <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
          <Path d="M9 21v-8h6v8" />
        </Svg>
      );
    case "map":
      return (
        <Svg {...sharedProps}>
          <Path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z" />
          <Path d="M9 3v16M15 5v16" />
        </Svg>
      );
    case "eco-dive-id":
      return (
        <Svg {...sharedProps}>
          <Rect x="2" y="4" width="20" height="16" rx="3" />
          <Circle cx="8" cy="10" r="2" />
          <Path d="M5 16c0-3 6-3 6 0M14 9h5M14 13h5M14 16h3" />
        </Svg>
      );
    case "profile":
      return (
        <Svg {...sharedProps}>
          <Circle cx="12" cy="12" r="10" />
          <Circle cx="12" cy="9" r="3" />
          <Path d="M5.5 19c1-5.5 12-5.5 13 0" />
        </Svg>
      );
    default:
      return null;
  }
}

export default function BottomNav({
  state,
  navigation,
  tabIcons,
  tabLabels,
  hiddenRoutes,
  allowLabelWrap = false,
}: BottomNavProps) {
  const { isCompact } = useLayout();
  const activeKey = state.routes[state.index]?.key;
  const visibleRoutes = state.routes.filter(
    (r) =>
      !hiddenRoutes?.includes(r.name) &&
      Boolean(tabLabels[r.name] || tabIcons[r.name]),
  );

  const renderTab = (route: TabRoute) => {
    const isFocused = route.key === activeKey;
    const name = route.name;
    const icon = tabIcons[name];
    const label = tabLabels[name] || name;
    const iconColor = isFocused ? colors.white : INACTIVE_COLOR;
    const iconSize = isFocused ? (isCompact ? 16 : 18) : isCompact ? 18 : 20;

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

    const refSvg = renderReferenceNavIcon(name, iconColor, iconSize);

    const tutorialId = (() => {
      if (name === "map") return "tutorial-map-tab";
      if (name === "eco-dive-id") return "tutorial-eco-tab";
      if (name === "manifests") return "tutorial-manifests-tab";
      if (name === "buy-pass") return "tutorial-buy-pass-tab";
      if (name === "profile") {
        return allowLabelWrap
          ? "tutorial-op-profile-tab"
          : "tutorial-profile-tab";
      }
      return undefined;
    })();

    return (
      <TouchableOpacity
        key={route.key}
        testID={tutorialId}
        onPress={onPress}
        style={[
          isFocused ? styles.activeTab : styles.inactiveTab,
          isCompact &&
            (isFocused ? styles.compactActiveTab : styles.compactInactiveTab),
          allowLabelWrap &&
            (isFocused ? styles.operatorActiveTab : styles.operatorInactiveTab),
        ]}
        activeOpacity={0.75}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={label}
      >
        {refSvg ?? (
          <Ionicons
            name={
              isFocused
                ? icon?.focused || "ellipse"
                : icon?.unfocused || "ellipse-outline"
            }
            size={iconSize}
            color={iconColor}
          />
        )}
        <Text
          style={[
            isFocused ? styles.activeText : styles.inactiveText,
            isCompact &&
              (isFocused
                ? styles.compactActiveText
                : styles.compactInactiveText),
            allowLabelWrap &&
              (isFocused
                ? styles.operatorActiveText
                : styles.operatorInactiveText),
          ]}
          numberOfLines={allowLabelWrap ? 2 : 1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.barWrap,
        isCompact && styles.compactBarWrap,
        { paddingBottom: BOTTOM_NAV_PADDING },
      ]}
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route) => renderTab(route))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    width: "100%",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#DBE8F4",
    paddingTop: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  activeTab: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryBlue,
  },
  operatorActiveTab: {
    gap: 4,
    paddingHorizontal: 8,
  },
  activeText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 11,
  },
  operatorActiveText: {
    fontSize: 10.5,
    flexShrink: 0,
  },
  inactiveTab: {
    flex: 1,
    minWidth: 56,
    minHeight: 38,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 999,
  },
  operatorInactiveTab: {
    minWidth: 0,
    minHeight: 46,
    paddingHorizontal: 0,
  },
  inactiveText: {
    color: INACTIVE_COLOR,
    fontWeight: "600",
    fontSize: 10,
    textAlign: "center",
  },
  operatorInactiveText: {
    width: "100%",
    fontSize: 9,
    lineHeight: 11,
  },
  compactBarWrap: {
    paddingHorizontal: 8,
  },
  compactActiveTab: {
    paddingHorizontal: 10,
    gap: 3,
  },
  compactInactiveTab: {
    minWidth: 44,
    paddingHorizontal: 1,
  },
  compactActiveText: {
    fontSize: 10,
  },
  compactInactiveText: {
    fontSize: 9,
  },
});
