import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { ResortLogoBadge } from "./ResortLogoBadge";

type Props = {
  coverImageUrls: string[];
  avatarUrl?: string | null;
  fallbackImageUrl?: string | null;
  resortName?: string;
  wide?: boolean;
  onBack?: () => void;
};

export function ResortProfileHero({
  coverImageUrls,
  avatarUrl,
  fallbackImageUrl,
  resortName = "Resort",
  wide = false,
  onBack,
}: Props) {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const slides = coverImageUrls.length
    ? coverImageUrls
    : fallbackImageUrl
      ? [fallbackImageUrl]
      : [];
  const slideWidth = Math.max(0, wide ? Math.min(width, 980) : width - 32);
  const slideHeight = wide ? 340 : 240;
  const go = (direction: number) => {
    if (!slides.length) return;
    const next = (active + direction + slides.length) % slides.length;
    setActive(next);
    carouselRef.current?.scrollTo({ x: next * slideWidth, animated: true });
  };
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.frame,
          wide && styles.frameWide,
          { width: slideWidth, height: slideHeight },
        ]}
      >
        {slides.length ? (
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) =>
              setActive(
                Math.round(event.nativeEvent.contentOffset.x / slideWidth),
              )
            }
          >
            {slides.map((uri, index) => (
              <Image
                key={`${uri}-${index}`}
                source={{ uri }}
                style={{ width: slideWidth, height: slideHeight }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={45} color="#78A8D8" />
            <Text style={styles.emptyText}>
              Add resort photos to showcase your place
            </Text>
          </View>
        )}
        {slides.length > 1 && (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Previous cover photo"
              style={[styles.arrow, styles.left]}
              onPress={() => go(-1)}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Next cover photo"
              style={[styles.arrow, styles.right]}
              onPress={() => go(1)}
            >
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.dots}>
              {slides.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, active === i && styles.activeDot]}
                />
              ))}
            </View>
          </>
        )}
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={21} color="#07156C" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.avatar}>
        <ResortLogoBadge
          name={resortName}
          logoUrl={avatarUrl}
          size={112}
          borderRadius={56}
          fontSize={40}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 62, position: "relative" },
  frame: {
    overflow: "hidden",
    backgroundColor: "#DCEBFA",
    borderRadius: 26,
  },
  frameWide: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#D6E8F8",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8F2FC",
  },
  emptyText: {
    color: "#55718D",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Quicksand_600SemiBold",
  },
  arrow: {
    position: "absolute",
    top: "45%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#07156CB8",
    alignItems: "center",
    justifyContent: "center",
  },
  left: { left: 10 },
  right: { right: 10 },
  dots: {
    position: "absolute",
    bottom: 13,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#07156C66",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF88" },
  activeDot: { width: 18, backgroundColor: "#fff" },
  avatar: {
    position: "absolute",
    left: "50%",
    bottom: -56,
    width: 112,
    height: 112,
    borderRadius: 56,
    transform: [{ translateX: -56 }],
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#07156C",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatarImage: { width: "100%", height: "100%" },
});

export default ResortProfileHero;
