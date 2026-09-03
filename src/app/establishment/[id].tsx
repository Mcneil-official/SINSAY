import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { colors } from "../../constants/colors";
import { EstablishmentRow } from "../../types/supabase";
import { ContentContainer } from "../../components";

export default function EstablishmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [est, setEst] = useState<EstablishmentRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase.from("establishments").select("*").eq("id", id).single().then(({ data, error }) => {
      if (!error && data) setEst(data);
      setLoading(false);
    });
  }, [id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.title}>Establishment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primaryBlue} />
          </View>
        ) : !est ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.red} />
            <Text style={styles.errorText}>Establishment not found</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.retryText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ContentContainer maxWidth={720} paddingH={16}>
          <>
            <View style={styles.hero}>
              <View style={styles.heroOverlay}>
                <Ionicons name="business" size={48} color={colors.white} />
              </View>
              {est.accreditation && (
                <View style={styles.accreditationBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.white} />
                  <Text style={styles.accreditationText}>{est.accreditation}</Text>
                </View>
              )}
            </View>

            <View style={styles.contentSection}>
              <Text style={styles.estName}>{est.name}</Text>
              {est.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={colors.gray} />
                  <Text style={styles.locationText}>{est.location}</Text>
                </View>
              )}

              {est.description && (
                <Text style={styles.description}>{est.description}</Text>
              )}

              {(est.phone || est.email || est.website || est.facebook) && (
                <>
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                  <View style={styles.contactList}>
                    {est.phone && (
                      <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`tel:${est.phone}`)}
                      >
                        <Ionicons name="call-outline" size={18} color={colors.primaryBlue} />
                        <Text style={styles.contactText}>{est.phone}</Text>
                      </TouchableOpacity>
                    )}

                    {est.email && (
                      <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`mailto:${est.email}`)}
                      >
                        <Ionicons name="mail-outline" size={18} color={colors.primaryBlue} />
                        <Text style={styles.contactText}>{est.email}</Text>
                      </TouchableOpacity>
                    )}

                    {est.website && (
                      <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(est.website!)}
                      >
                        <Ionicons name="globe-outline" size={18} color={colors.primaryBlue} />
                        <Text style={styles.contactText}>{est.website.replace(/^https?:\/\//, "")}</Text>
                      </TouchableOpacity>
                    )}

                    {est.facebook && (
                      <TouchableOpacity
                        style={styles.contactRow}
                        onPress={() => Linking.openURL(`https://facebook.com/${est.facebook}`)}
                      >
                        <Ionicons name="logo-facebook" size={18} color={colors.primaryBlue} />
                        <Text style={styles.contactText}>{est.facebook}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </>
          </ContentContainer>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 17, fontWeight: "600", color: colors.darkText },
  hero: {
    height: 180,
    backgroundColor: colors.navy,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroOverlay: { opacity: 0.6 },
  accreditationBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.green,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  accreditationText: { fontSize: 11, fontWeight: "700", color: colors.white },
  contentSection: { paddingTop: 20 },
  estName: { fontSize: 22, fontWeight: "700", color: colors.darkText },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  locationText: { fontSize: 13, color: colors.gray, flex: 1 },
  description: {
    fontSize: 14,
    color: colors.gray,
    lineHeight: 22,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.darkText,
    marginTop: 24,
    marginBottom: 12,
  },
  contactList: { gap: 10 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
  },
  contactText: { fontSize: 13, color: colors.darkText, fontWeight: "500" },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32, gap: 12, marginTop: 80,
  },
  errorText: { fontSize: 14, color: colors.red, textAlign: "center" },
  retryBtn: { borderRadius: 8, backgroundColor: colors.primaryBlue, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { fontSize: 14, fontWeight: "600", color: colors.white },
});
