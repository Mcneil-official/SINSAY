import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import WiderScreenNavbar from "../../components/WiderScreenNavbar";
import { colors } from "../../constants/colors";
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

  if (isLoading || !roleReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

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
  const { isLoading, roleReady } = useAuth();
  const router = useRouter();

  const ready = !isLoading && roleReady;

  if (!ready) {
    return (
      <>
        <TouristGate />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <TouristGate />
      {isDesktop && <WiderScreenNavbar />}
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) =>
          isDesktop ? null : (
            <BottomNav
              {...props}
              tabIcons={tabIcons}
              tabLabels={tabLabels}
            />
          )
        }
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="eco-dive-id" />
        <Tabs.Screen name="dive-assistant" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
