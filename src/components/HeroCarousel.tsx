import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../constants/colors";

interface CarouselItem {
  image: any;
  announcement?: string;
}

interface HeroCarouselProps {
  items: CarouselItem[];
  autoPlayInterval?: number;
  onPress?: (index: number) => void;
  /** Label for the pill CTA button rendered under the headline. */
  ctaLabel?: string;
  /** Called when the CTA pill is pressed. */
  onCtaPress?: () => void;
}

export function HeroCarousel({
  items,
  autoPlayInterval = 4000,
  onPress,
  ctaLabel,
  onCtaPress,
}: HeroCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const carouselWidth = Math.min(screenWidth - 40, 720);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
      setActiveIndex(index);
    },
    [carouselWidth],
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

  return (
    <View style={[styles.heroWrap, { width: carouselWidth }]}>
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
            activeOpacity={onPress ? 0.85 : 1}
            onPress={onPress ? () => onPress(i) : undefined}
            style={[styles.slide, { width: carouselWidth }]}
          >
            <Image source={item.image} style={styles.heroImage} />
            <View style={styles.scrim} />
            {item.announcement && (
              <View style={styles.headlineWrap}>
                <Text style={styles.headlineText} numberOfLines={2}>
                  {item.announcement}
                </Text>
                {ctaLabel ? (
                  <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={onCtaPress}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.ctaText}>{ctaLabel}</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {items.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    marginTop: 16,
    borderRadius: 24,
    overflow: "hidden",
    height: 190,
  },
  slide: {
    height: 190,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 26, 64, 0.38)",
  },
  headlineWrap: {
    position: "absolute",
    left: 20,
    top: 20,
    right: 24,
    gap: 14,
  },
  headlineText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: colors.navy,
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 18,
  },
  ctaText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
  },
  dot: {
    width: 20,
    height: 4,
    borderRadius: 12,
    backgroundColor: colors.dotInactive,
  },
  dotActive: {
    backgroundColor: colors.white,
  },
});
