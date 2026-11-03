import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type Props = { coverImageUrls: string[]; avatarUrl?: string | null; fallbackImageUrl?: string | null };

export function ResortProfileHero({ coverImageUrls, avatarUrl, fallbackImageUrl }: Props) {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const slides = coverImageUrls.length ? coverImageUrls : fallbackImageUrl ? [fallbackImageUrl] : [];
  const slideWidth = Math.max(0, Math.min(width - 40, 688));
  const go = (direction: number) => {
    if (!slides.length) return;
    const next = (active + direction + slides.length) % slides.length;
    setActive(next);
    carouselRef.current?.scrollTo({ x: next * slideWidth, animated: true });
  };
  return <View style={styles.wrap}>
    <View style={[styles.frame, { width: slideWidth }]}>
      {slides.length ? <ScrollView ref={carouselRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(event) => setActive(Math.round(event.nativeEvent.contentOffset.x / slideWidth))}>
        {slides.map((uri, index) => <Image key={`${uri}-${index}`} source={{ uri }} style={{ width: slideWidth, height: 232 }} resizeMode="cover" />)}
      </ScrollView> : <View style={styles.empty}><Ionicons name="business-outline" size={45} color="#78A8D8" /><Text style={styles.emptyText}>Add resort photos to showcase your place</Text></View>}
      {slides.length > 1 && <><TouchableOpacity accessibilityLabel="Previous cover photo" style={[styles.arrow, styles.left]} onPress={() => go(-1)}><Ionicons name="chevron-back" size={20} color="#fff" /></TouchableOpacity><TouchableOpacity accessibilityLabel="Next cover photo" style={[styles.arrow, styles.right]} onPress={() => go(1)}><Ionicons name="chevron-forward" size={20} color="#fff" /></TouchableOpacity><View style={styles.dots}>{slides.map((_, i) => <View key={i} style={[styles.dot, active === i && styles.activeDot]} />)}</View></>}
    </View>
    <View style={styles.avatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatarImage} /> : <Ionicons name="person" size={34} color="#fff" />}</View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 52 },
  frame: { height: 232, borderRadius: 24, overflow: "hidden", backgroundColor: "#DCEBFA", borderWidth: 1, borderColor: "#D6E8F8" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#E8F2FC" },
  emptyText: { color: "#55718D", fontSize: 13, fontWeight: "600", fontFamily: "Quicksand_600SemiBold" },
  arrow: { position: "absolute", top: 100, width: 38, height: 38, borderRadius: 19, backgroundColor: "#07156CB8", alignItems: "center", justifyContent: "center" },
  left: { left: 10 }, right: { right: 10 },
  dots: { position: "absolute", bottom: 13, alignSelf: "center", flexDirection: "row", gap: 6, backgroundColor: "#07156C66", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF88" }, activeDot: { width: 18, backgroundColor: "#fff" },
  avatar: { position: "absolute", bottom: -42, width: 96, height: 96, borderRadius: 48, borderWidth: 6, borderColor: "#fff", backgroundColor: "#087BFF", alignItems: "center", justifyContent: "center", overflow: "hidden", elevation: 5, shadowColor: "#07156C", shadowOpacity: 0.16, shadowRadius: 9, shadowOffset: { width: 0, height: 4 } },
  avatarImage: { width: "100%", height: "100%" },
});

export default ResortProfileHero;
