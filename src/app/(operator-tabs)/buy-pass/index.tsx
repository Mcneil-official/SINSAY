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
import { Button, Card, ContentContainer, TextInput } from "../../../components";
import { supabase } from "../../../lib/supabase";
import { PassPricingRow } from "../../../types/supabase";

type PassTab = "one_day" | "annual";

const TABS: { code: PassTab; label: string }[] = [
  { code: "one_day", label: "One-Day" },
  { code: "annual", label: "Annual" },
];

const MIN_CUSTOM = 1;
const MAX_CUSTOM = 50;

export default function BuyPassSelectionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [passOptions, setPassOptions] = useState<PassPricingRow[]>([]);
  const [activeTab, setActiveTab] = useState<PassTab>("one_day");
  const [countText, setCountText] = useState("1");

  const loadOptions = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from("pass_pricing")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      // PostgREST returns numeric columns as strings — normalize so price
      // math and toLocaleString() can't crash below.
      setPassOptions((data || []).map((o) => ({ ...o, price: Number(o.price) })));
    } catch (e) {
      console.warn("Failed to load pass pricing:", e);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const switchTab = (tab: PassTab) => {
    setActiveTab(tab);
    setCountText("1");
  };

  const activeRow = passOptions.find((p) => p.code === activeTab) ?? null;
  const unitPrice = activeRow ? Number(activeRow.price) : 0;
  const parsedCount = Number(countText);
  const countValid =
    activeRow !== null &&
    unitPrice > 0 &&
    Number.isInteger(parsedCount) &&
    parsedCount >= MIN_CUSTOM &&
    parsedCount <= MAX_CUSTOM;
  const total = countValid ? parsedCount * unitPrice : 0;

  const handleProceed = () => {
    if (!activeRow || !countValid) return;
    router.push({
      pathname: "/(operator-tabs)/buy-pass/payment",
      params: {
        passId: activeRow.id,
        passLabel: activeRow.label,
        passCount: String(parsedCount),
        quantity: "1",
        total: String(total),
        unitPrice: String(unitPrice),
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

  if (loadError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>Couldn&apos;t load dive passes</Text>
          <Text style={styles.centerSub}>Check your connection and try again.</Text>
          <Button title="Retry" onPress={loadOptions} />
        </View>
      </SafeAreaView>
    );
  }

  if (passOptions.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>No dive passes available</Text>
          <Text style={styles.centerSub}>Please contact the Tourism Office for pricing.</Text>
          <Button title="Retry" variant="outline" onPress={loadOptions} />
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

          {/* Pass type tabs */}
          <View style={styles.tabRow}>
            {TABS.map((t) => {
              const isActive = activeTab === t.code;
              return (
                <TouchableOpacity
                  key={t.code}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => switchTab(t.code)}
                  activeOpacity={0.7}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={t.label}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!activeRow || unitPrice <= 0 ? (
            <Card style={styles.unavailableCard}>
              <Text style={styles.unavailableTitle}>
                {activeTab === "annual" ? "Annual passes not yet available" : "Pricing unavailable"}
              </Text>
              <Text style={styles.unavailableSub}>
                {activeTab === "annual"
                  ? "The Tourism Office hasn't set annual pricing yet. Please check back later or contact them directly."
                  : "Please contact the Tourism Office for pricing."}
              </Text>
            </Card>
          ) : (
            <>
              <Text style={styles.rateLine}>
                ₱ {unitPrice.toLocaleString()} per {activeRow.label.toLowerCase().includes("annual") ? "annual pass" : "dive day"}
              </Text>
              {activeRow.description && (
                <Text style={styles.rateDesc}>{activeRow.description}</Text>
              )}
              <View style={{ height: 12 }} />
              <TextInput
                label={activeTab === "annual" ? "How many annual passes?" : "How many dive days?"}
                placeholder={`1–${MAX_CUSTOM}`}
                value={countText}
                onChangeText={(v) => setCountText(v.replace(/[^0-9]/g, "").slice(0, 3))}
                keyboardType="numeric"
                error={
                  countText.length > 0 && !countValid
                    ? `Enter a whole number from ${MIN_CUSTOM} to ${MAX_CUSTOM}.`
                    : undefined
                }
              />

              {/* Total */}
              <Card style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    Total ({countValid ? parsedCount : "—"} × ₱ {unitPrice.toLocaleString()})
                  </Text>
                  <Text style={styles.totalValue}>
                    ₱ {total.toLocaleString()}
                  </Text>
                </View>
              </Card>

              <Button
                title="Proceed to Payment"
                onPress={handleProceed}
                disabled={!countValid}
              />
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
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  centerTitle: { fontSize: 17, fontWeight: "700", color: colors.darkText, textAlign: "center" },
  centerSub: { fontSize: 13, color: colors.gray, textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 12, color: colors.gray, lineHeight: 18, marginTop: 6, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.gray, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 100,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    borderRadius: 100,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: colors.gray },
  tabTextActive: { color: colors.primaryBlue },
  rateLine: { fontSize: 16, fontWeight: "700", color: colors.primaryBlue },
  rateDesc: { fontSize: 12, color: colors.gray, marginTop: 4 },
  unavailableCard: { padding: 20, alignItems: "center" },
  unavailableTitle: { fontSize: 15, fontWeight: "700", color: colors.darkText, textAlign: "center" },
  unavailableSub: { fontSize: 12, color: colors.gray, textAlign: "center", marginTop: 6, lineHeight: 18 },
  totalCard: { padding: 16, marginTop: 16, marginBottom: 20, gap: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  totalValue: { fontSize: 18, fontWeight: "700", color: colors.primaryBlue },
});
