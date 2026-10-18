import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface WaveDividerProps {
  width?: number;
}

export default function WaveDivider({ width = 80 }: WaveDividerProps) {
  return (
    <View
      style={[styles.container, { width, right: -width + 1 }]}
      pointerEvents="none"
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 1000"
        preserveAspectRatio="none"
      >
        <Path
          d="M 0 0 L 75 0 C 105 100, 15 320, 25 460 C 35 590, 105 690, 85 820 C 70 910, 15 970, 0 1000 L 0 0 Z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 10,
    overflow: "visible",
  },
});
