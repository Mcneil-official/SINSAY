import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

function PhoneIllustration() {
  return (
    <Svg width={128} height={176} viewBox="0 0 128 176" accessibilityLabel="Phone">
      <Rect
        x="22"
        y="8"
        width="84"
        height="160"
        rx="16"
        fill="#FFFFFF"
        stroke="#006BFF"
        strokeWidth="5"
      />
      <Path
        d="M57 21h12"
        stroke="#006BFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <Circle cx="75" cy="21" r="1.5" fill="#006BFF" />
      <Path
        d="M44 91c7 0 10-9 17-9s10 9 17 9c4 0 7-3 9-5"
        fill="none"
        stroke="#006BFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M55 155h18"
        stroke="#006BFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function UnsupportedDeviceScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 1200;

  return (
    <View style={styles.root}>
      <View style={[styles.content, isCompact && styles.contentCompact]}>
        <View
          style={[styles.deviceCircle, isCompact && styles.deviceCircleCompact]}
          accessibilityLabel="Mobile device required"
        >
          <PhoneIllustration />
        </View>
        <View style={[styles.message, isCompact && styles.messageCompact]}>
          <Image
            source={require("../../assets/SINSAY blue logo.png")}
            style={[styles.logo, isCompact && styles.logoCompact]}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessibilityLabel="SINSAY"
          />
          <Text style={[styles.title, isCompact && styles.titleCompact]}>
            SINSAY is best experienced on mobile
          </Text>
          <Text style={[styles.description, isCompact && styles.descriptionCompact]}>
            Open SINSAY on your phone to continue.{"\n"}
            Desktop access is restricted.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
    backgroundColor: "#F5FBFF",
  },
  content: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 72,
  },
  contentCompact: {
    gap: 40,
  },
  deviceCircle: {
    width: 264,
    height: 264,
    flexBasis: 264,
    flexShrink: 0,
    borderRadius: 132,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F1FF",
  },
  deviceCircleCompact: {
    width: 220,
    height: 220,
    flexBasis: 220,
    borderRadius: 110,
  },
  message: {
    width: 584,
    maxWidth: "100%",
    alignItems: "flex-start",
    gap: 8,
  },
  messageCompact: {
    gap: 7,
  },
  logo: {
    width: 320,
    height: 88,
    marginLeft: -10,
  },
  logoCompact: {
    width: 280,
    height: 76,
    marginLeft: -8,
  },
  title: {
    margin: 0,
    color: "#526C8D",
    fontSize: 30,
    lineHeight: 44,
    fontFamily: "Quicksand_700Bold",
    letterSpacing: -0.8,
  },
  description: {
    margin: 0,
    color: "#526C8D",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: "Quicksand_400Regular",
  },
  titleCompact: {
    fontSize: 26,
    lineHeight: 36,
  },
  descriptionCompact: {
    fontSize: 14,
    lineHeight: 22,
  },
});
