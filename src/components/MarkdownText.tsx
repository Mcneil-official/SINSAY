import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

// Lightweight markdown-lite renderer for AI output (chat bubbles + dive
// plans). Handles **bold**, •/- bullets, Day N / ## headers, paragraphs.
// Anything unrecognized renders as plain text — never crashes on raw input.
export function MarkdownText({
  text,
  color = colors.darkText,
  fontSize = 14,
}: {
  text: string;
  color?: string;
  fontSize?: number;
}) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletGroup: string[] = [];

  const flushBullets = (keyBase: string) => {
    if (bulletGroup.length === 0) return;
    blocks.push(
      <View key={keyBase} style={styles.bullets}>
        {bulletGroup.map((b, j) => (
          <View key={`${keyBase}-${j}`} style={styles.bulletRow}>
            <Text style={[styles.bulletDot, { color }]}>•</Text>
            <Text style={[styles.text, { color, fontSize }]}>
              <BoldSpans text={b} color={color} />
            </Text>
          </View>
        ))}
      </View>
    );
    bulletGroup = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line === "") {
      flushBullets(`b${i}`);
      blocks.push(<View key={`s${i}`} style={styles.paragraphGap} />);
      return;
    }
    // Day headers: "**Day 1** ...", "Day 1: ...", "## ..." (also strips
    // emojis Gemini likes to prefix, e.g. "🌊 Dive Plan for X").
    const dayMatch = /^(?:\*\*)?(?:#+\s*)?(Day \d+[^*]*)(?:\*\*)?[:\s]*(.*)$/i.exec(line);
    if (dayMatch && /day \d/i.test(dayMatch[1])) {
      flushBullets(`b${i}`);
      blocks.push(
        <View key={`h${i}`}>
          <Text style={[styles.heading, { fontSize: fontSize + 1 }]}>
            <BoldSpans text={dayMatch[1].trim()} color={colors.darkText} />
          </Text>
          {dayMatch[2] ? (
            <Text style={[styles.text, { color, fontSize }]}>
              <BoldSpans text={dayMatch[2].trim()} color={color} />
            </Text>
          ) : null}
        </View>
      );
      return;
    }
    if (/^#{1,3}\s+/.test(line)) {
      flushBullets(`b${i}`);
      blocks.push(
        <Text key={`h${i}`} style={[styles.heading, { fontSize: fontSize + 1 }]}>
          <BoldSpans text={line.replace(/^#{1,3}\s+/, "")} color={colors.darkText} />
        </Text>
      );
      return;
    }
    const bullet = /^[•\-\*]\s+(.*)$/.exec(line);
    if (bullet) {
      bulletGroup.push(bullet[1]);
      return;
    }
    flushBullets(`b${i}`);
    blocks.push(
      <Text key={`p${i}`} style={[styles.text, { color, fontSize }]}>
        <BoldSpans text={line} color={color} />
      </Text>
    );
  });
  flushBullets("bend");

  return <View style={styles.root}>{blocks}</View>;
}

function BoldSpans({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4 ? (
          <Text key={i} style={[styles.bold, { color }]}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i} style={{ color }}>
            {p.replace(/\*\*/g, "")}
          </Text>
        )
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  text: { lineHeight: 21 },
  bold: { fontWeight: "800" },
  heading: { fontWeight: "800", color: colors.darkText, marginTop: 8, marginBottom: 2, lineHeight: 22 },
  bullets: { marginVertical: 4, gap: 4 },
  bulletRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  bulletDot: { fontSize: 14, lineHeight: 21, fontWeight: "800" },
  paragraphGap: { height: 8 },
});
