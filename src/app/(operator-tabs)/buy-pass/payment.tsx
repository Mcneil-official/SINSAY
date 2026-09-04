import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const { passId, passLabel, passCount, quantity, total } =
    useLocalSearchParams<{
      passId?: string;
      passLabel?: string;
      passCount?: string;
      quantity?: string;
      total?: string;
    }>();

  const [config, setConfig] = useState<PaymentConfigRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("payment_config")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setConfig(data);
        setLoading(false);
      });
  }, []);

  const totalNum = Number(total) || 0;

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
                <View style={styles.qrPlaceholder}>
                  <Ionicons
                    name="qr-code"
                    size={80}
                    color={colors.primaryBlue}
                  />
                </View>
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
                params: { passLabel, passCount, quantity, total },
              })
            }
          />
          <Button
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>

        <View style={{ height: 40 }} />
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
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 0,
  },
  progressStepWrap: { alignItems: "center", gap: 4 },
  progressDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryBlue,
  },
  progressDotInactive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.grayLight,
  },
  progressTextActive: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryBlue,
  },
  progressTextInactive: { fontSize: 11, color: colors.gray },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: colors.grayLight,
    marginHorizontal: 8,
    marginBottom: 18,
  },
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
