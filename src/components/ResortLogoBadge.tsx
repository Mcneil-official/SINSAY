import React, { useState } from "react";
import {
  Image,
  ImageResizeMode,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { getResortInitials } from "../lib/resortInitials";

export { getResortInitials };

export interface ResortLogoBadgeProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
  borderRadius?: number;
  fontSize?: number;
  resizeMode?: ImageResizeMode;
  style?: StyleProp<ViewStyle>;
}

export function ResortLogoBadge({
  name,
  logoUrl,
  size = 32,
  borderRadius,
  fontSize,
  resizeMode = "cover",
  style,
}: ResortLogoBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const radius = borderRadius ?? size / 2;
  const computedFontSize = fontSize ?? Math.max(10, Math.round(size * 0.38));
  const initials = getResortInitials(name);
  const hasValidLogo = Boolean(
    logoUrl && logoUrl.trim().length > 0 && !imageFailed,
  );

  if (hasValidLogo) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: "#F1F5F9",
          },
          style,
        ]}
      >
        <Image
          source={{ uri: logoUrl! }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode={resizeMode}
          onError={() => setImageFailed(true)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: "#FFFFFF",
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${name} logo initials`}
    >
      <Text
        style={[
          styles.initialsText,
          {
            fontSize: computedFontSize,
            lineHeight: computedFontSize * 1.2,
          },
        ]}
        numberOfLines={1}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initialsText: {
    color: "#005EEC",
    fontWeight: "700",
    fontFamily: "Quicksand_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
