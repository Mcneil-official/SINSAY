import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import BottomNav from "../../components/BottomNav";
import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../hooks/useAuth";

function OperatorGate() {
  const { isOperator, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isOperator) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isOperator, router]);

  return null;
}

const tabIcons: Record<
  string,
  {
    focused: keyof typeof Ionicons.glyphMap;
    unfocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { focused: "home", unfocused: "home-outline" },
  manifests: { focused: "document-text", unfocused: "document-text-outline" },
  "buy-pass": { focused: "cart", unfocused: "cart-outline" },
  profile: { focused: "person", unfocused: "person-outline" },
};

const tabLabels: Record<string, string> = {
  index: "Home",
  manifests: "Manifests",
  "buy-pass": "Buy Pass",
  profile: "Profile",
};

export default function OperatorTabLayout() {
  const { isDesktop } = useLayout();

  return (
    <>
      <OperatorGate />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) =>
          isDesktop ? null : (
            <BottomNav {...props} tabIcons={tabIcons} tabLabels={tabLabels} />
          )
        }
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="manifests" />
        <Tabs.Screen name="buy-pass" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}
