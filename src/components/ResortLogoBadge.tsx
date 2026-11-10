import React, { useState } from "react";
import {
  Image,
  ImageResizeMode,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
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
  const gradId = `resortLogoGrad-${size}-${Math.random().toString(36).substring(2, 7)}`;

  const hasValidLogo = Boolean(logoUrl && logoUrl.trim().length > 0 && !imageFailed);

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
        },
        Platform.OS === "web"
          ? ({
              backgroundImage:
                "linear-gradient(135deg, #006BFF 0%, #0047C2 50%, #07156C 100%)",
            } as any)
          : null,
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${name} logo initials`}
    >
      <Svg
        width={size}
        height={size}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      >
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#006BFF" />
            <Stop offset="50%" stopColor="#0047C2" />
            <Stop offset="100%" stopColor="#07156C" />
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width={size}
          height={size}
          rx={radius}
          ry={radius}
          fill={`url(#${gradId})`}
        />
      </Svg>

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
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: "Quicksand_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});
