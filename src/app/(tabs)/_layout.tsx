import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import BottomNav from "../../components/BottomNav";
import SideNav from "../../components/SideNav";
import DesktopHeader from "../../components/DesktopHeader";
import { useAuth } from "../../hooks/useAuth";
import { useLayout } from "../../context/LayoutContext";

function TouristGate() {
  const { isOperator, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isOperator) {
      router.replace("/(operator-tabs)");
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
  "eco-dive-id": { focused: "id-card", unfocused: "id-card-outline" },
  "dive-assistant": {
    focused: "chatbubble-ellipses",
    unfocused: "chatbubble-ellipses-outline",
  },
  profile: { focused: "person", unfocused: "person-outline" },
};

const tabLabels: Record<string, string> = {
  index: "Home",
  "eco-dive-id": "Eco-Dive ID",
  "dive-assistant": "Dive Assistant",
  profile: "Profile",
};

export default function TabLayout() {
  const { isDesktop } = useLayout();

  return (
    <>
      <TouristGate />
      {isDesktop && (
        <>
          <DesktopHeader sidebarWidth={240} />
        </>
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) =>
          isDesktop ? (
            <SideNav {...props} tabIcons={tabIcons} tabLabels={tabLabels} />
          ) : (
            <BottomNav {...props} tabIcons={tabIcons} tabLabels={tabLabels} />
          )
        }
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="eco-dive-id" />
        <Tabs.Screen name="dive-assistant" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </>
  );
}
