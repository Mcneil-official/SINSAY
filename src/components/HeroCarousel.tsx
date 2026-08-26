import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
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
}

export function HeroCarousel({
  items,
  autoPlayInterval = 4000,
  onPress,
}: HeroCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const carouselWidth = Math.min(screenWidth - 40, 720);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        e.nativeEvent.contentOffset.x / carouselWidth
      );
      setActiveIndex(index);
    },
    [carouselWidth]
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
            {item.announcement && (
              <View style={styles.announcementPill}>
                <Text style={styles.announcementText}>{item.announcement}</Text>
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
    height: 154,
  },
  slide: {
    height: 154,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  announcementPill: {
    position: "absolute",
    top: 11,
    right: 12,
    backgroundColor: colors.navy,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  announcementText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "500",
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
    backgroundColor: colors.navy,
  },
});
