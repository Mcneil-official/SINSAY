import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../../constants/colors";
import { Button, Card, ContentContainer } from "../../../components";

export default function ManifestConfirmedScreen() {
  const router = useRouter();
  const { manifestId, location, diverCount, boatName, captainName, remainingBalance } = useLocalSearchParams<{
    manifestId?: string;
    location?: string;
    diverCount?: string;
    boatName?: string;
    captainName?: string;
    remainingBalance?: string;
  }>();

  const now = new Date();
  const formattedDate = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Manifest Submitted</Text>
        <View style={{ width: 24 }} />
      </View>

      <ContentContainer maxWidth={720} style={styles.container}>
        <View style={styles.checkWrap}>
          <Ionicons name="checkmark-circle" size={72} color="#16A34A" />
        </View>

        <Text style={styles.heading}>Manifest Sent!</Text>
        <Text style={styles.subheading}>
          Your dive manifest has been submitted to the{"\n"}local authorities for approval.
        </Text>

        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Manifest Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Manifest ID</Text>
            <Text style={styles.summaryValue}>{manifestId || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dive Site</Text>
            <Text style={styles.summaryValue}>{location || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Divers Count</Text>
            <Text style={styles.summaryValue}>{diverCount || "0"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Boat</Text>
            <Text style={styles.summaryValue}>{boatName || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Captain</Text>
            <Text style={styles.summaryValue}>{captainName || "—"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Time Submitted</Text>
            <Text style={styles.summaryValue}>
              {formattedDate}, {formattedTime}
            </Text>
          </View>
        </Card>

        {/* Dive Pass Credits */}
        <Card style={styles.creditsCard}>
          <Ionicons name="ticket" size={20} color={colors.primaryBlue} />
          <View style={{ flex: 1 }}>
            <Text style={styles.creditsLabel}>Dive Pass Credits Consumed</Text>
            <Text style={styles.creditsValue}>{diverCount || "0"} passes</Text>
          </View>
        </Card>
        {remainingBalance !== undefined && (
          <Card style={styles.creditsCard}>
            <Ionicons name="wallet-outline" size={20} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.creditsLabel}>Remaining Balance</Text>
              <Text style={[styles.creditsValue, { color: "#16A34A" }]}>{remainingBalance} passes</Text>
            </View>
          </Card>
        )}

        <View style={{ gap: 10, marginTop: 8 }}>
          <Button title="Back to Dashboard" onPress={() => router.replace("/(operator-tabs)")} />
          <Button
            title="Create Another Manifest"
            variant="outline"
            onPress={() => router.replace("/establishment/create-manifest/step1")}
          />
        </View>
      </ContentContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1, justifyContent: "center" },
  topBar: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  topTitle: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  checkWrap: { alignItems: "center", marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.darkText, textAlign: "center" },
  subheading: { fontSize: 13, color: colors.gray, textAlign: "center", marginTop: 6, lineHeight: 20 },
  summaryCard: { padding: 16, marginTop: 24 },
  summaryTitle: { fontSize: 15, fontWeight: "700", color: colors.darkText, marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryLabel: { fontSize: 13, color: colors.gray },
  summaryValue: { fontSize: 13, fontWeight: "600", color: colors.darkText },
  divider: { height: 1, backgroundColor: colors.grayLight, marginVertical: 2 },
  creditsCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, marginTop: 12, backgroundColor: "#EBF2FF",
  },
  creditsLabel: { fontSize: 13, color: colors.darkText },
  creditsValue: { fontSize: 15, fontWeight: "700", color: colors.primaryBlue },
});
