import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import BottomNav from "../../components/BottomNav";
import { colors } from "../../constants/colors";
import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../hooks/useAuth";

function OperatorGate() {
  const { user, isOperator, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/loginpage");
    } else if (!isOperator) {
      router.replace("/(tabs)");
    }
  }, [isLoading, user, isOperator, router]);

  if (isLoading) {
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
  manifests: { focused: "document-text", unfocused: "document-text-outline" },
  "buy-pass": { focused: "cart", unfocused: "cart-outline" },
  profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

const tabLabels: Record<string, string> = {
  index: "Home",
  manifests: "Dive Manifesto",
  "buy-pass": "Buy Dive Pass",
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
            <BottomNav
              {...props}
              tabIcons={tabIcons}
              tabLabels={tabLabels}
            />
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
