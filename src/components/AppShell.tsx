import React from "react";
import { StyleSheet, View } from "react-native";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <View style={styles.fill}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
