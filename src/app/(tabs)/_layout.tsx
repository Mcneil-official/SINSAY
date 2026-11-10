import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import SplashScreen from "../../components/SplashScreen";
import { FloatingAssistant } from "../../components/assistant/FloatingAssistant";
import { InAppTutorial } from "../../components/InAppTutorial";
import { TutorialProvider } from "../../context/TutorialContext";
import WiderScreenNavbar from "../../components/WiderScreenNavbar";
import { colors } from "../../constants/colors";
import { ENABLE_DESKTOP_LAYOUT } from "../../constants/layout";
import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../hooks/useAuth";

function TouristGate() {
  const { user, isOperator, viewAsTourist, isLoading, roleReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !roleReady) return;
    if (!user) {
      router.replace("/loginpage");
    } else if (isOperator && !viewAsTourist) {
      router.replace("/(operator-tabs)");
    }
  }, [isLoading, roleReady, user, isOperator, viewAsTourist, router]);

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
  map: { focused: "map", unfocused: "map-outline" },
  "eco-dive-id": { focused: "id-card", unfocused: "id-card-outline" },
  profile: { focused: "person", unfocused: "person-outline" },
};

const tabLabels: Record<string, string> = {
  index: "Home",
  map: "Map",
  "eco-dive-id": "Eco-Dive ID",
  profile: "Profile",
};

const HIDDEN_ROUTES = ["dive-assistant", "establishment"];

export default function TabLayout() {
  const { isDesktop } = useLayout();
  const { isLoading, roleReady } = useAuth();

  const ready = !isLoading && roleReady;
  const [hasInitialized, setHasInitialized] = useState(ready);

  useEffect(() => {
    if (ready && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [ready, hasInitialized]);

  if (!hasInitialized) {
    return (
      <>
        <TouristGate />
        <SplashScreen isReady={ready} />
      </>
    );
  }

  return (
    <TutorialProvider>
      <View style={styles.container}>
        <TouristGate />
        {isDesktop && ENABLE_DESKTOP_LAYOUT && <WiderScreenNavbar />}
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={(props) =>
            isDesktop && ENABLE_DESKTOP_LAYOUT ? null : (
              <BottomNav
                {...props}
                tabIcons={tabIcons}
                tabLabels={tabLabels}
                hiddenRoutes={HIDDEN_ROUTES}
              />
            )
          }
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="map" />
          <Tabs.Screen name="eco-dive-id" />
          <Tabs.Screen name="dive-assistant" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="establishment" />
        </Tabs>
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <FloatingAssistant />
        </View>
        <InAppTutorial role="tourist" />
      </View>
    </TutorialProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
