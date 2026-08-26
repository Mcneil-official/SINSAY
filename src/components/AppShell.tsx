import React from "react";
import { StyleSheet, View } from "react-native";
import { useLayout } from "../context/LayoutContext";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { mode, sidebarWidth, headerHeight } = useLayout();

  const containerStyle =
    mode === "desktop"
      ? [styles.container, styles.desktopContainer]
      : mode === "tablet"
      ? [styles.container, styles.tabletContainer]
      : [styles.container, styles.mobileContainer];

  const contentStyle =
    mode === "desktop"
      ? [styles.content, { marginLeft: sidebarWidth, marginTop: headerHeight }]
      : styles.content;

  return (
    <View style={containerStyle}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mobileContainer: {
    backgroundColor: "#FFFFFF",
  },
  tabletContainer: {
    backgroundColor: "#FFFFFF",
  },
  desktopContainer: {
    backgroundColor: "#E8EDF2",
  },
  content: {
    flex: 1,
  },
});
