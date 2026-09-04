import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useLayout } from "../context/LayoutContext";
import { useAuth } from "../hooks/useAuth";
import DesktopHeader from "./DesktopHeader";
import SideNav from "./SideNav";

const PRE_AUTH_PATHS = new Set([
  "/",
  "/next",
  "/next2",
  "/next3",
  "/next4",
  "/next5",
  "/signup",
  "/loginpage",
]);

function normalizePath(pathname: string): string {
  return pathname.replace(/\/\(tabs\)|\/\(operator-tabs\)/g, "") || "/";
}

function touristActiveTab(path: string): string | undefined {
  if (
    path === "/" ||
    path.startsWith("/dive-sites") ||
    path.startsWith("/establishments") ||
    path.startsWith("/notifications") ||
    path.startsWith("/dive-site/") ||
    path.startsWith("/establishment/")
  ) {
    return "index";
  }
  if (path.startsWith("/eco-dive-id") || path.startsWith("/tourist/dive-details")) {
    return "eco-dive-id";
  }
  if (path.startsWith("/dive-assistant")) {
    return "dive-assistant";
  }
  if (path.startsWith("/profile")) {
    return "profile";
  }
  return undefined;
}

function operatorActiveTab(path: string): string | undefined {
  if (
    path === "/" ||
    path.startsWith("/establishment/create-manifest") ||
    path.startsWith("/notifications")
  ) {
    return "index";
  }
  if (path.startsWith("/manifests")) {
    return "manifests";
  }
  if (path.startsWith("/buy-pass")) {
    return "buy-pass";
  }
  if (path.startsWith("/profile")) {
    return "profile";
  }
  return undefined;
}

const touristIcons: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: "home", unfocused: "home-outline" },
  "eco-dive-id": { focused: "id-card", unfocused: "id-card-outline" },
  "dive-assistant": {
    focused: "chatbubble-ellipses",
    unfocused: "chatbubble-ellipses-outline",
  },
  profile: { focused: "person", unfocused: "person-outline" },
};

const touristLabels: Record<string, string> = {
  index: "Home",
  "eco-dive-id": "Eco-Dive ID",
  "dive-assistant": "Dive Assistant",
  profile: "Profile",
};

const operatorIcons: Record<string, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: "home", unfocused: "home-outline" },
  manifests: { focused: "document-text", unfocused: "document-text-outline" },
  "buy-pass": { focused: "cart", unfocused: "cart-outline" },
  profile: { focused: "person", unfocused: "person-outline" },
};

const operatorLabels: Record<string, string> = {
  index: "Home",
  manifests: "Manifests",
  "buy-pass": "Buy Pass",
  profile: "Profile",
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isDesktop, isTablet, sidebarWidth, headerHeight } = useLayout();
  const { user, isOperator, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const path = normalizePath(pathname);
  const isPreAuth = PRE_AUTH_PATHS.has(path);

  if (!isDesktop || isPreAuth) {
    return <View style={styles.fill}>{children}</View>;
  }

  if (isLoading || !user) {
    return <View style={styles.fill}>{children}</View>;
  }

  const icons = isOperator ? operatorIcons : touristIcons;
  const labels = isOperator ? operatorLabels : touristLabels;
  const activeTab = (isOperator ? operatorActiveTab : touristActiveTab)(path);

const handleSelect = (name: string) => {
  if (isOperator) {
    if (name === "index") router.push("/(operator-tabs)");
    else if (name === "manifests") router.push("/manifests");
    else if (name === "buy-pass") router.push("/buy-pass");
    else if (name === "profile") router.push("/profile");
    return;
  }
  if (name === "index") router.push("/");
  else if (name === "eco-dive-id") router.push("/eco-dive-id");
  else if (name === "dive-assistant") router.push("/dive-assistant");
  else if (name === "profile") router.push("/profile");
};

  return (
    <View style={styles.root}>
      <SideNav
        tabIcons={icons}
        tabLabels={labels}
        activeTab={activeTab}
        onSelect={handleSelect}
        width={sidebarWidth}
      />
      <DesktopHeader sidebarWidth={sidebarWidth} />
      <View
        style={[
          styles.content,
          { marginLeft: sidebarWidth, marginTop: headerHeight },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#E8EDF2",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  fill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
