import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, Card, ContentContainer } from "../../../components";
import { supabase } from "../../../lib/supabase";
import { PassPricingRow } from "../../../types/supabase";

export default function BuyPassSelectionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [passOptions, setPassOptions] = useState<PassPricingRow[]>([]);
  const [selectedPass, setSelectedPass] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    supabase
      .from("pass_pricing")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data) setPassOptions(data);
        setLoading(false);
      });
  }, []);

  const selected = selectedPass ? passOptions.find((p) => p.id === selectedPass) : null;
  const totalPasses = selected ? selected.passes * quantity : 0;
  const total = selected ? selected.price * quantity : 0;

  const handleProceed = () => {
    if (!selected) return;
    router.push({
      pathname: "/(operator-tabs)/buy-pass/payment",
      params: {
        passId: selected.id,
        passLabel: selected.label,
        passCount: String(selected.passes),
        quantity: String(quantity),
        total: String(total),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <ContentContainer maxWidth={720}>
          <Text style={styles.title}>Buy Dive Pass</Text>
        <Text style={styles.subtitle}>
          Purchase dive passes for your resort. Each pass is credited to your account and deducted
          when a manifest is submitted.
        </Text>

        {/* Pass Options */}
        <Text style={styles.sectionLabel}>Select Dive Pass</Text>
        <View style={{ gap: 10 }}>
          {passOptions.map((opt) => {
            const isSelected = selectedPass === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.passCard, isSelected && styles.passCardSelected]}
                onPress={() => { setSelectedPass(opt.id); setQuantity(1); }}
                activeOpacity={0.7}
              >
                <View style={styles.passCardLeft}>
                  {isSelected ? (
                    <Ionicons name="radio-button-on" size={20} color={colors.primaryBlue} />
                  ) : (
                    <Ionicons name="radio-button-off" size={20} color={colors.gray} />
                  )}
                  <View>
                    <Text style={styles.passLabel}>{opt.label}</Text>
                    {opt.description && <Text style={styles.passDesc}>{opt.description}</Text>}
                  </View>
                </View>
                <Text style={styles.passPrice}>₱ {opt.price.toLocaleString()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quantity */}
        {selected && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Quantity</Text>
            <Text style={styles.quantityHint}>Buying {quantity} × {selected.label} = {totalPasses} total passes</Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.darkText} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color={colors.darkText} />
              </TouchableOpacity>
            </View>

            {/* Total */}
            <Card style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ₱ {total.toLocaleString()}
                </Text>
              </View>
            </Card>

            <Button title="Proceed to Payment" onPress={handleProceed} />
          </>
        )}

        <View style={{ height: 120 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingTop: 12, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: "700", color: colors.darkText },
  subtitle: { fontSize: 12, color: colors.gray, lineHeight: 18, marginTop: 6, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.gray, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  passCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 14, borderWidth: 1.5, borderColor: colors.grayLight, padding: 14,
  },
  passCardSelected: { borderColor: colors.primaryBlue, backgroundColor: "#F5F9FF" },
  passCardLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  passLabel: { fontSize: 15, fontWeight: "600", color: colors.darkText },
  passDesc: { fontSize: 11, color: colors.gray, marginTop: 1 },
  passPrice: { fontSize: 15, fontWeight: "700", color: colors.primaryBlue },
  quantityHint: { fontSize: 12, color: colors.gray, marginBottom: 8 },
  quantityRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 20 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },
  qtyValue: { fontSize: 20, fontWeight: "700", color: colors.darkText, minWidth: 24, textAlign: "center" },
  totalCard: { padding: 16, marginBottom: 20, gap: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 15, fontWeight: "700", color: colors.darkText },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.primaryBlue },
});
