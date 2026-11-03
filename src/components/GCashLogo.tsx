import React from "react";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";

interface GCashLogoProps {
  size?: number;
}

/** Compact, rounded GCash tile based on the supplied logo. */
export function GCashLogo({ size = 32 }: GCashLogoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 320 320"
      accessibilityLabel="GCash"
    >
      <Rect x="16" y="16" width="288" height="288" rx="22" fill="#087BFF" />

      {/* GCash symbol */}
      <Path
        d="M183 75A64 64 0 1 0 183 165"
        fill="none"
        stroke="#0734BD"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <Path
        d="M169 101A35 35 0 1 0 169 151H147V128H178"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M201 91A43 43 0 0 1 201 159M220 78A62 62 0 0 1 220 172"
        fill="none"
        stroke="#70C7F5"
        strokeWidth="14"
        strokeLinecap="round"
      />

      <SvgText
        x="160"
        y="264"
        fill="#FFFFFF"
        fontFamily="Arial, sans-serif"
        fontSize="64"
        fontWeight="500"
        textAnchor="middle"
      >
        GCash
      </SvgText>
    </Svg>
  );
}
