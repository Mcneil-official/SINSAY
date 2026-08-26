import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";

interface EstablishmentCardProps {
  image: any;
  onPress?: () => void;
}

export function EstablishmentCard({ image, onPress }: EstablishmentCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image source={image} style={styles.image} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    height: 143,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
