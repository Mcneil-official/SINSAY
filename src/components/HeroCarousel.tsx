import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../constants/colors";

export interface CarouselItem {
  image: any;
  announcement?: string;
  body?: string | null;
}

interface HeroCarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
  onPress?: (index: number) => void;
  /** Optional CTA label (omitted by default to keep photo unobstructed). */
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function HeroCarousel({
  items,
  autoPlayInterval = 4500,
  onPress,
}: HeroCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const carouselWidth = Math.min(screenWidth - 40, 860);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
      setActiveIndex(index);
    },
    [carouselWidth],
  );

  const jumpToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) return;
      setActiveIndex(index);
      scrollRef.current?.scrollTo({
        x: index * carouselWidth,
        animated: true,
      });
    },
    [carouselWidth, items.length],
  );

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % items.length;
      setActiveIndex(next);
      scrollRef.current?.scrollTo({
        x: next * carouselWidth,
        animated: true,
      });
    }, autoPlayInterval);
    return () => clearInterval(timer);
  }, [activeIndex, items.length, autoPlayInterval, carouselWidth]);

  // Ensure pagination/progress bar is always visible below the hero
  const indicatorCount = Math.max(items.length, 3);

  return (
    <View style={[styles.outerWrap, { width: carouselWidth }]}>
      <View style={[styles.heroCard, { width: carouselWidth }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          {items.map((item, i) => (
            <TouchableOpacity
              key={i}
              activeOpacity={onPress ? 0.9 : 1}
              onPress={onPress ? () => onPress(i) : undefined}
              style={[styles.slide, { width: carouselWidth }]}
            >
              <Image
                source={item.image}
                style={styles.heroImage}
                contentFit="cover"
              />

              {/* Smooth bottom gradient so the upper photo stays clear while multi-line text has rich depth */}
              <View style={styles.gradientWrap} pointerEvents="none">
                <Svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <Defs>
                    <LinearGradient
                      id={`heroAnnouncementGrad-${i}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <Stop offset="0" stopColor="#020817" stopOpacity="0" />
                      <Stop offset="0.35" stopColor="#020817" stopOpacity="0.38" />
                      <Stop offset="0.7" stopColor="#020817" stopOpacity="0.78" />
                      <Stop offset="1" stopColor="#020817" stopOpacity="0.95" />
                    </LinearGradient>
                  </Defs>
                  <Rect
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    fill={`url(#heroAnnouncementGrad-${i})`}
                  />
                </Svg>
              </View>

              {(item.announcement || item.body) && (
                <View style={styles.contentWrap}>
                  <View style={styles.badgePill}>
                    <View style={styles.badgeDot} />
                    <Text style={styles.badgeLabel}>MABINI TOURISM</Text>
                  </View>

                  {item.announcement ? (
                    <Text style={styles.headlineText} numberOfLines={2}>
                      {item.announcement.trim()}
                    </Text>
                  ) : null}

                  {item.body ? (
                    <Text style={styles.bodyText} numberOfLines={2}>
                      {item.body.trim()}
                    </Text>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Pagination / Progress Bar below the hero */}
      <View style={styles.paginationRow}>
        {Array.from({ length: indicatorCount }).map((_, i) => {
          const isActive = i === activeIndex;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => jumpToSlide(i)}
              disabled={i >= items.length}
              hitSlop={6}
              style={[styles.progressSegment, isActive && styles.progressSegmentActive]}
              accessibilityRole="button"
              accessibilityLabel={`Announcement slide ${i + 1}`}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    marginTop: 14,
    alignSelf: "center",
    alignItems: "center",
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    height: 186,
    backgroundColor: "#0B192C",
  },
  slide: {
    height: 186,
    justifyContent: "flex-end",
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  gradientWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "78%",
    backgroundImage:
      "linear-gradient(180deg, rgba(2, 8, 23, 0) 0%, rgba(2, 8, 23, 0.38) 35%, rgba(2, 8, 23, 0.78) 70%, rgba(2, 8, 23, 0.95) 100%)" as any,
  },
  contentWrap: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 10,
    gap: 3,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "rgba(38, 121, 232, 0.32)",
    borderWidth: 1,
    borderColor: "rgba(147, 197, 253, 0.45)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#60A5FA",
  },
  badgeLabel: {
    fontSize: 9.5,
    fontFamily: "Quicksand_700Bold",
    color: "#DBEAFE",
    letterSpacing: 0.7,
  },
  headlineText: {
    color: colors.white,
    fontSize: 16.5,
    fontFamily: "Quicksand_700Bold",
    lineHeight: 21,
    letterSpacing: 0.2,
    textShadowColor: "rgba(4, 13, 31, 0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  bodyText: {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    lineHeight: 16.5,
    textShadowColor: "rgba(4, 13, 31, 0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  progressSegment: {
    width: 8,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#CBD5E1",
  },
  progressSegmentActive: {
    width: 28,
    backgroundColor: colors.primaryBlue,
  },
});
