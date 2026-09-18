import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Card,
  ContentContainer,
  StepProgress,
} from "../../../components";
import { colors } from "../../../constants/colors";
import { supabase } from "../../../lib/supabase";
import { PaymentConfigRow } from "../../../types/supabase";

export default function PaymentScreen() {
  const router = useRouter();
  const { passId, passLabel, passCount, quantity, total, unitPrice } =
    useLocalSearchParams<{
      passId?: string;
      passLabel?: string;
      passCount?: string;
      quantity?: string;
      total?: string;
      unitPrice?: string;
    }>();

  const [config, setConfig] = useState<PaymentConfigRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("payment_config")
          .select("*")
          .limit(1)
          .single();
        if (data) setConfig(data);
      } catch (e) {
        // Empty table (.single() PGRST116) or network failure both land here;
        // the "not configured" card below covers either case.
        console.warn("Failed to load payment config:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalNum = Number(total) || 0;
  const unitNum = Number(unitPrice) || 0;
  const countNum = Number(passCount) || 0;
  // Deep-link guard: this screen is meaningless without an order.
  const hasOrder = !!passId && !!passLabel && totalNum > 0;

  if (!hasOrder) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={colors.darkText} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Payment</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerWrap}>
          <Text style={styles.centerTitle}>No order found</Text>
          <Text style={styles.centerSub}>Please select a dive pass first.</Text>
          <Button title="Back to Passes" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ContentContainer maxWidth={720}>
        {/* Progress steps */}
        <StepProgress steps={["Payment", "Upload Receipt"]} currentIndex={0} />

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pass</Text>
            <Text style={styles.summaryValue}>{passLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Qty</Text>
            <Text style={styles.summaryValue}>
              {quantity} × {passCount} passes
            </Text>
          </View>
          {unitNum > 0 && countNum > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Rate</Text>
              <Text style={styles.summaryValue}>
                {countNum} × ₱ {unitNum.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>₱ {totalNum.toLocaleString()}</Text>
          </View>
        </Card>

        {/* Payment instructions */}
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primaryBlue}
            style={{ marginTop: 20 }}
          />
        ) : config ? (
          <>
            <Card style={styles.accountCard}>
              <Text style={styles.payLabel}>Send payment to:</Text>
              <View style={styles.accountRow}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={colors.primaryBlue}
                />
                <Text style={styles.accountLabel}>Account Name</Text>
              </View>
              <Text style={styles.accountValue}>{config.account_name}</Text>
              <View style={styles.accountRow}>
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={colors.primaryBlue}
                />
                <Text style={styles.accountLabel}>Account Number</Text>
              </View>
              <Text style={styles.accountValue}>{config.account_number}</Text>
            </Card>

            {config.qr_code_url && (
              <Card style={styles.qrCard}>
                <Text style={styles.qrTitle}>Scan to Pay</Text>
                {config.qr_code_url.startsWith("http") ? (
                  <Image
                    source={{ uri: config.qr_code_url }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons
                      name="qr-code"
                      size={80}
                      color={colors.primaryBlue}
                    />
                  </View>
                )}
                <Text style={styles.qrNote}>Scan via GCash or Maya</Text>
              </Card>
            )}
          </>
        ) : (
          <Card style={styles.accountCard}>
            <Text style={styles.payLabel}>
              Payment details not yet configured by the Tourism Office. Please
              contact them directly.
            </Text>
          </Card>
        )}

        <View style={{ gap: 10, marginTop: 8 }}>
          <Button
            title="Upload Payment Receipt"
            onPress={() =>
              router.push({
                pathname: "/(operator-tabs)/buy-pass/upload",
                params: { passId, passLabel, passCount, quantity, total, unitPrice },
              })
            }
          />
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>

        <View style={{ height: 110 }} />
        </ContentContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  content: { paddingTop: 12, paddingBottom: 24 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  centerTitle: { fontSize: 17, fontWeight: "700", color: colors.darkText, textAlign: "center" },
  centerSub: { fontSize: 13, color: colors.gray, textAlign: "center", marginBottom: 12 },
  summaryCard: { padding: 16, marginBottom: 16, gap: 4 },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  summaryLabel: { fontSize: 13, color: colors.gray },
  summaryValue: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: 6 },
  grandLabel: { fontSize: 15, fontWeight: "700", color: colors.darkText },
  grandValue: { fontSize: 18, fontWeight: "700", color: colors.primaryBlue },
  payLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.darkText,
    marginBottom: 8,
  },
  qrCard: { padding: 20, alignItems: "center", marginBottom: 16 },
  qrTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.darkText,
    marginBottom: 12,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#EBF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  qrImage: { width: 180, height: 180, borderRadius: 12, marginBottom: 8 },
  qrNote: { fontSize: 12, color: colors.gray },
  accountCard: { padding: 16, marginBottom: 16, gap: 4 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  accountLabel: { fontSize: 12, color: colors.gray },
  accountValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.darkText,
    marginLeft: 24,
  },
});
