import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ContentContainer, Dropdown, TextInput } from "../components";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { showAlert } from "../lib/confirm";
import { safeBack } from "../lib/navigation";
import { uploadFile } from "../lib/storage";
import { supabase } from "../lib/supabase";
import { toLocalPhDigits, toDbPhPhone } from "../lib/phone";
import { BookingLinkItem, BookingPlatformType } from "../types/supabase";
import { detectTravelPlatform, PLATFORM_NAMES, normalizeTravelUrl } from "../components/EstablishmentBookingSection";

type Photo = { uri: string; path: string | null; file?: DocumentPicker.DocumentPickerAsset };
type EditorTab = "resort" | "photos" | "account";
const publicUrl = (path?: string | null) => path ? supabase.storage.from("operator_media").getPublicUrl(path).data.publicUrl : "";

const PLATFORM_OPTIONS: { label: string; value: BookingPlatformType }[] = [
  { label: "Messenger (Facebook)", value: "messenger" },
  { label: "Agoda", value: "agoda" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Booking.com", value: "booking" },
  { label: "Viber", value: "viber" },
  { label: "TripAdvisor", value: "tripadvisor" },
  { label: "Klook", value: "klook" },
  { label: "Airbnb", value: "airbnb" },
  { label: "Instagram", value: "instagram" },
  { label: "Official Website", value: "website" },
  { label: "Other / Direct Link", value: "direct" },
];

export default function OperatorProfileEditScreen() {
  const router = useRouter();
  const { user, profile, operatorApplication: app, avatarUri, isLoading, isOperator, roleReady, refreshProfile } = useAuth();
  const [values, setValues] = useState({ resortName: "", location: "", description: "", resortPhone: "", resortEmail: "", facebook: "", website: "", bookingUrl: "", fullName: "", phone: "", email: "" });
  const [bookingLinks, setBookingLinks] = useState<BookingLinkItem[]>([]);
  const [covers, setCovers] = useState<Photo[]>([]);
  const [avatar, setAvatar] = useState<Photo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<EditorTab>("resort");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const handleBack = () => safeBack(router, "/(operator-tabs)/profile");
  const change = (key: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  useEffect(() => {
    if (!roleReady || !user) return;
    if (!isOperator) router.replace("/(operator-tabs)/profile");
  }, [roleReady, user, isOperator, router]);
  useEffect(() => {
    queueMicrotask(() => {
      if (!profile || !app) return;
      setValues({ resortName: app.resort_name || "", location: app.resort_location || "", description: app.resort_description || "", resortPhone: toLocalPhDigits(app.contact_number || ""), resortEmail: app.resort_email || "", facebook: app.facebook_url || "", website: app.website_url || "", bookingUrl: app.booking_url || "", fullName: profile.full_name || "", phone: toLocalPhDigits(profile.contact_number || ""), email: user?.email || profile.email || "" });
      setCovers((app.cover_image_paths || []).map((path) => ({ path, uri: publicUrl(path) })));
      setAvatar(profile.avatar_path ? { path: profile.avatar_path, uri: publicUrl(profile.avatar_path) } : avatarUri ? { path: null, uri: avatarUri } : null);
      const initialLinks: BookingLinkItem[] = Array.isArray(app.booking_links) && app.booking_links.length > 0
        ? app.booking_links
        : app.booking_url
          ? [{ id: `link_${Date.now()}`, platform: "direct", label: "Book Online", url: app.booking_url }]
          : [];
      setBookingLinks(initialLinks);
    });
  }, [profile, app, user?.email, avatarUri]);

      const addBookingLink = () => {
    setBookingLinks((prev) => [
      ...prev,
      {
        id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        platform: "agoda",
        label: "Agoda",
        url: "",
      },
    ]);
  };

  const updateBookingLink = (id: string, updates: Partial<BookingLinkItem>) => {
    setBookingLinks((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };

        // If user manually switched the platform dropdown:
        if (updates.platform && updates.platform !== item.platform) {
          if (!next.label || next.label === PLATFORM_NAMES[item.platform]) {
            next.label = PLATFORM_NAMES[updates.platform];
          }
        }

        // If user entered URL, auto-detect platform if still default/direct:
        if (updates.url !== undefined) {
          const auto = detectTravelPlatform(updates.url);
          if (auto !== "direct") {
            next.platform = auto;
            if (!next.label || Object.values(PLATFORM_NAMES).includes(next.label)) {
              next.label = PLATFORM_NAMES[auto];
            }
          }
        }
        return next;
      })
    );
  };

  const removeBookingLink = (id: string) => {
    setBookingLinks((prev) => prev.filter((item) => item.id !== id));
  };

  const pickPhoto = async (kind: "cover" | "avatar", index?: number) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ["image/jpeg", "image/png", "image/webp"], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    const photo = { uri: file.uri, path: null, file };
    if (kind === "avatar") setAvatar(photo);
    else setCovers((prev) => { const next = [...prev]; if (index === undefined) next.push(photo); else next[index] = photo; return next.slice(0, 3); });
  };
  const move = (index: number, direction: number) => setCovers((prev) => { const next = [...prev]; const target = index + direction; if (target < 0 || target >= next.length) return prev; [next[index], next[target]] = [next[target], next[index]]; return next; });
  const save = async () => {
    if (!user || !app) return;
    const missingResort = [!values.resortName.trim() && "resort name", !values.location.trim() && "location", !values.resortPhone.trim() && "resort phone"].filter(Boolean);
    const missingAccount = !values.fullName.trim();
    if (missingResort.length || missingAccount) {
      setActiveTab(missingResort.length ? "resort" : "account");
      setFieldErrors({
        resortName: !values.resortName.trim() ? "Required" : undefined,
        location: !values.location.trim() ? "Required" : undefined,
        resortPhone: !values.resortPhone.trim() ? "Required" : undefined,
        fullName: !values.fullName.trim() ? "Required" : undefined,
      });
      const tabNeeds = [missingResort.length ? `complete ${missingResort.join(", ")} in the Resort tab` : "", missingAccount ? "enter your full name in the Account tab" : ""].filter(Boolean);
      setError(`Please ${tabNeeds.join(" and ")}.`);
      return;
    }
    setBusy(true); setError("");
    const uploaded: string[] = [];
    try {
      const savePhoto = async (photo: Photo, folder: "profile-cover" | "profile-avatar") => {
        if (!photo.file && photo.path) return photo.path;
        let resultPath: string | null = null;
        if (photo.file) {
          const result = await uploadFile("operator_media", folder, { name: photo.file.name, mimeType: photo.file.mimeType || undefined, size: photo.file.size, uri: photo.file.uri }, user.id);
          if (!result.path) throw new Error(result.error || "Could not upload image.");
          resultPath = result.path;
        } else {
          const blob = await fetch(photo.uri).then((response) => response.blob());
          const path = `${folder}/${user.id}/${Date.now()}_account-avatar.jpg`;
          const { error: uploadError } = await supabase.storage.from("operator_media").upload(path, blob, { contentType: blob.type || "image/jpeg" });
          if (uploadError) throw uploadError;
          resultPath = path;
        }
        if (resultPath) uploaded.push(resultPath);
        return resultPath;
      };
      const coverPaths = (await Promise.all(covers.map((photo) => savePhoto(photo, "profile-cover")))).filter((path): path is string => !!path);
      const avatarPath = avatar ? await savePhoto(avatar, "profile-avatar") : null;
                  const cleanedLinks = bookingLinks
        .filter((l) => l.url.trim().length > 0)
        .map((l) => ({
          ...l,
          label: l.label.trim() || PLATFORM_NAMES[l.platform] || "Book Online",
          url: normalizeTravelUrl(l.url, l.platform),
        }));
      const { error: saveError } = await supabase.rpc("save_operator_profile", {
        p_application_id: app.id, p_resort_name: values.resortName.trim(), p_resort_location: values.location.trim(), p_resort_description: values.description.trim() || null,
        p_resort_contact_number: toDbPhPhone(values.resortPhone) || "", p_resort_email: values.resortEmail.trim() || null, p_facebook_url: values.facebook.trim() || null, p_website_url: values.website.trim() || null, p_booking_url: cleanedLinks[0]?.url || values.bookingUrl.trim() || null,
        p_cover_image_paths: coverPaths, p_full_name: values.fullName.trim(), p_personal_contact_number: toDbPhPhone(values.phone), p_avatar_path: avatarPath,
        p_booking_links: cleanedLinks,
      });
      if (saveError) throw saveError;
      let emailNotice = "";
      if (values.email.trim() && values.email.trim().toLowerCase() !== user.email?.toLowerCase()) {
        const { error: emailError } = await supabase.auth.updateUser({ email: values.email.trim() });
        if (emailError) emailNotice = `Profile saved, but email update failed: ${emailError.message}`;
        else emailNotice = "Profile saved. Check your inbox to confirm the new email address.";
      }
      const removed = [...(app.cover_image_paths || []).filter((p) => !coverPaths.includes(p)), ...(profile?.avatar_path && profile.avatar_path !== avatarPath ? [profile.avatar_path] : [])];
      if (removed.length) await supabase.storage.from("operator_media").remove(removed);
      await refreshProfile();
      if (emailNotice) showAlert("Profile updated", emailNotice); else showAlert("Profile updated", "Your resort and account details have been saved.");
      handleBack();
    } catch (e) {
      if (uploaded.length) await supabase.storage.from("operator_media").remove(uploaded);
      setError(e instanceof Error ? e.message : "Could not save profile. Please try again.");
    } finally { setBusy(false); }
  };

  const field = (label: string, key: keyof typeof values, opts: { multiline?: boolean; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none" | "sentences"; prefix?: string; maxLength?: number } = {}) => <View style={styles.field} key={key}><TextInput label={label} value={values[key]} onChangeText={(v) => change(key, opts.keyboardType === "phone-pad" ? toLocalPhDigits(v) : v)} multiline={opts.multiline} keyboardType={opts.keyboardType || "default"} autoCapitalize={opts.autoCapitalize || "sentences"} placeholder={opts.keyboardType === "phone-pad" ? "9XXXXXXXXX" : label} prefix={opts.prefix} maxLength={opts.maxLength} error={fieldErrors[key]} /></View>;
  if (isLoading || !roleReady || !app) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.primaryBlue} style={{ marginTop: 48 }} /></SafeAreaView>;
  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <View style={styles.header}><TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back"><Ionicons name="chevron-back" size={21} color="#07156c" /></TouchableOpacity><View style={styles.headerText}><Text style={styles.eyebrow}>PROFILE SETTINGS</Text><Text style={styles.title}>Edit resort profile</Text></View><View style={{ width: 42 }} /></View>
    <ContentContainer maxWidth={720} paddingH={12}><View style={styles.tabBar} accessibilityRole="tablist">
      {(["resort", "photos", "account"] as const).map((tab) => {
        const active = activeTab === tab;
        const labels = { resort: "Resort", photos: "Photos", account: "Account" };
        const icons = { resort: "business-outline" as const, photos: "images-outline" as const, account: "person-outline" as const };
        return <TouchableOpacity key={tab} style={[styles.tabButton, active && styles.tabButtonActive]} onPress={() => { setActiveTab(tab); setError(""); }} accessibilityRole="tab" accessibilityState={{ selected: active }}><Ionicons name={icons[tab]} size={16} color={active ? "#fff" : "#647797"} /><Text style={[styles.tabText, active && styles.tabTextActive]}>{labels[tab]}</Text></TouchableOpacity>;
      })}
    </View></ContentContainer>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}><ContentContainer maxWidth={720} paddingH={12}>
      <Text style={styles.intro}>Update the details divers see when they find your resort.</Text>
      {activeTab === "photos" && <View style={styles.card}><View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="images-outline" size={19} color="#087BFF" /></View><View style={{ flex: 1 }}><Text style={styles.section}>Resort photos</Text><Text style={styles.helper}>Add up to 3 photos. Reorder them to choose the cover.</Text></View></View>
        <View style={styles.photos}>{covers.map((photo, i) => <View key={`${photo.uri}-${i}`} style={styles.photoCard}><Image source={{ uri: photo.uri }} style={styles.photo} /><View style={styles.coverIndex}><Text style={styles.coverIndexText}>{i === 0 ? "COVER PHOTO" : `PHOTO ${i + 1}`}</Text></View><View style={styles.photoControls}><TouchableOpacity style={styles.photoControl} accessibilityLabel="Move photo earlier" onPress={() => move(i, -1)} disabled={!i}><Ionicons name="chevron-back" size={19} color={i ? colors.primaryBlue : "#B6C6D6"} /></TouchableOpacity><TouchableOpacity style={styles.photoControl} accessibilityLabel="Replace photo" onPress={() => pickPhoto("cover", i)}><Ionicons name="image-outline" size={19} color={colors.primaryBlue} /></TouchableOpacity><TouchableOpacity style={styles.photoControl} accessibilityLabel="Remove photo" onPress={() => setCovers((p) => p.filter((_, j) => j !== i))}><Ionicons name="trash-outline" size={18} color="#C84C55" /></TouchableOpacity><TouchableOpacity style={styles.photoControl} accessibilityLabel="Move photo later" onPress={() => move(i, 1)} disabled={i === covers.length - 1}><Ionicons name="chevron-forward" size={19} color={i < covers.length - 1 ? colors.primaryBlue : "#B6C6D6"} /></TouchableOpacity></View></View>)}
          {covers.length < 3 && <TouchableOpacity style={styles.addPhoto} accessibilityRole="button" onPress={() => pickPhoto("cover")}><Ionicons name="add-circle-outline" size={27} color={colors.primaryBlue} /><Text style={styles.addText}>Add cover photo</Text><Text style={styles.addHint}>{covers.length} of 3 added</Text></TouchableOpacity>}</View>
        <View style={styles.avatarSection}><Text style={styles.label}>Account avatar</Text><Text style={styles.helper}>Shown over your resort photos and on the public listing.</Text><View style={styles.avatarLine}><View style={styles.avatar}>{avatar?.uri ? <Image source={{ uri: avatar.uri }} style={styles.avatarImage} /> : <Ionicons name="person" size={25} color="#fff" />}</View><TouchableOpacity style={styles.secondaryAction} onPress={() => pickPhoto("avatar")}><Ionicons name="image-outline" size={16} color="#087BFF" /><Text style={styles.secondaryActionText}>{avatar ? "Change avatar" : "Add avatar"}</Text></TouchableOpacity>{avatar && <TouchableOpacity style={styles.removeAvatar} onPress={() => setAvatar(null)}><Ionicons name="trash-outline" size={17} color="#C84C55" /></TouchableOpacity>}</View></View>
      </View>}
      {activeTab === "resort" && (
        <>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}><Ionicons name="business-outline" size={19} color="#087BFF" /></View>
              <View><Text style={styles.section}>Resort details</Text><Text style={styles.helper}>Information shown to divers</Text></View>
            </View>
            {field("Resort name", "resortName")}
            {field("Location", "location")}
            {field("Description", "description", { multiline: true })}
            {field("Resort phone", "resortPhone", { keyboardType: "phone-pad", prefix: "+63", maxLength: 10 })}
            {field("Resort email", "resortEmail", { keyboardType: "email-address", autoCapitalize: "none" })}
            {field("Website link", "website", { autoCapitalize: "none" })}
            {field("Facebook link", "facebook", { autoCapitalize: "none" })}
          </View>

                    {/* Dynamic Booking Links Manager */}
          <View style={[styles.card, { marginTop: 4 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}><Ionicons name="calendar-outline" size={19} color="#087BFF" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.section}>Booking & Channels</Text>
                <Text style={styles.helper}>Add channels where divers can book (Agoda, Messenger, WhatsApp, etc.)</Text>
              </View>
            </View>

            {bookingLinks.map((item) => (
              <View key={item.id} style={styles.linkItemCard}>
                <View style={styles.linkItemHeader}>
                  <View style={styles.linkPlatformTag}>
                    <Ionicons name="link-outline" size={13} color="#087BFF" />
                    <Text style={styles.linkPlatformText}>
                      {(PLATFORM_NAMES[item.platform] || item.platform).toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeBookingLink(item.id)}
                    style={styles.deleteLinkBtn}
                    accessibilityLabel="Remove booking link"
                  >
                    <Ionicons name="trash-outline" size={16} color="#C84C55" />
                  </TouchableOpacity>
                </View>

                <Dropdown
                  label="Platform Channel"
                  options={PLATFORM_OPTIONS}
                  value={item.platform}
                  onSelect={(val) => updateBookingLink(item.id, { platform: val as BookingPlatformType })}
                  placeholder="Select Platform"
                />

                <TextInput
                  label="Button Display Label"
                  value={item.label}
                  onChangeText={(val) => updateBookingLink(item.id, { label: val })}
                  placeholder={`e.g. ${PLATFORM_NAMES[item.platform] || "Agoda"}`}
                />

                <TextInput
                  label="Booking / Profile Link URL"
                  value={item.url}
                  onChangeText={(val) => updateBookingLink(item.id, { url: val })}
                  placeholder={
                    item.platform === "agoda"
                      ? "https://www.agoda.com/your-resort"
                      : item.platform === "messenger"
                      ? "https://m.me/your-resort"
                      : item.platform === "whatsapp"
                      ? "https://wa.me/639XXXXXXXXX"
                      : item.platform === "booking"
                      ? "https://www.booking.com/hotel/ph/..."
                      : item.platform === "instagram"
                      ? "https://instagram.com/your-resort"
                      : "https://your-link.com"
                  }
                  autoCapitalize="none"
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.addLinkButton}
              onPress={addBookingLink}
              accessibilityRole="button"
              accessibilityLabel="Add another booking link"
            >
              <Ionicons name="add-circle-outline" size={18} color="#087BFF" />
              <Text style={styles.addLinkButtonText}>Add Booking Link</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {activeTab === "account" && <View style={styles.card}><View style={styles.sectionHeader}><View style={styles.sectionIcon}><Ionicons name="person-outline" size={19} color="#087BFF" /></View><View><Text style={styles.section}>Your account</Text><Text style={styles.helper}>Personal contact details</Text></View></View>{field("Full name", "fullName")}{field("Personal phone", "phone", { keyboardType: "phone-pad", prefix: "+63", maxLength: 10 })}{field("Email address", "email", { keyboardType: "email-address", autoCapitalize: "none" })}<Text style={styles.emailHint}>Changing your email requires confirmation from your inbox.</Text></View>}
      <View style={{ height: 18 }} />
    </ContentContainer></ScrollView>
    <View style={styles.footer}>{!!error && <Text style={styles.error}>{error}</Text>}<View style={styles.actions}><TouchableOpacity style={styles.cancel} onPress={handleBack}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity><TouchableOpacity style={[styles.save, busy && { opacity: .65 }]} disabled={busy} onPress={save}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save changes</Text>}</TouchableOpacity></View></View>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  linkItemCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  linkItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  linkPlatformTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EBF3FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  linkPlatformText: {
    fontSize: 10,
    fontFamily: "Quicksand_700Bold",
    color: "#087BFF",
  },
  deleteLinkBtn: {
    padding: 4,
  },
  addLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#087BFF",
    borderStyle: "dashed",
    backgroundColor: "#F0F7FF",
    marginTop: 12,
  },
  addLinkButtonText: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: "#087BFF",
  },

  safe: { flex: 1, backgroundColor: "#f1f9ff" },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, backgroundColor: "#f1f9ff" },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2edf8" },
  headerText: { flex: 1 }, eyebrow: { color: "#087BFF", fontSize: 9, letterSpacing: 1.2, fontFamily: "Quicksand_700Bold" },
  title: { fontSize: 18, lineHeight: 23, color: "#07156c", fontFamily: "Quicksand_700Bold" },
  tabBar: { flexDirection: "row", gap: 6, marginTop: 3, marginBottom: 5, padding: 4, borderRadius: 15, backgroundColor: "#e6f1fb", borderWidth: 1, borderColor: "#dceaf7" },
  tabButton: { flex: 1, minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 11, paddingHorizontal: 4 },
  tabButtonActive: { backgroundColor: "#087BFF", shadowColor: "#087BFF", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabText: { fontSize: 10, color: "#647797", fontFamily: "Quicksand_700Bold" },
  tabTextActive: { color: "#fff" },
  scroll: { paddingHorizontal: 0, paddingTop: 4, paddingBottom: 16 },
  intro: { color: "#647797", marginBottom: 13, fontSize: 12, fontFamily: "Quicksand_500Medium" },
  card: { backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 19, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e4effa", shadowColor: "#07156c", shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  sectionIcon: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#e7f3ff" },
  section: { fontSize: 14, color: "#07156c", fontFamily: "Quicksand_700Bold" },
  helper: { color: "#7183a4", fontSize: 10, lineHeight: 15, fontFamily: "Quicksand_500Medium", marginTop: 2 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 13 },
  photoCard: { flex: 1, flexBasis: 145, minWidth: 132, borderRadius: 14, overflow: "hidden", backgroundColor: "#edf4fa", borderWidth: 1, borderColor: "#e1ebf4" },
  photo: { width: "100%", height: 112 },
  coverIndex: { position: "absolute", top: 8, left: 8, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#07156cbf" },
  coverIndexText: { color: "#fff", fontSize: 8, letterSpacing: .5, fontFamily: "Quicksand_700Bold" },
  photoControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", minHeight: 46, paddingHorizontal: 3 },
  photoControl: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  addPhoto: { flex: 1, flexBasis: 145, minWidth: 132, minHeight: 160, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#a9c9e8", alignItems: "center", justifyContent: "center", backgroundColor: "#f6fbff", gap: 5 },
  addText: { color: "#087BFF", fontSize: 11, fontFamily: "Quicksand_700Bold" },
  addHint: { color: "#7183a4", fontSize: 9, fontFamily: "Quicksand_500Medium" },
  avatarSection: { borderTopWidth: 1, borderTopColor: "#edf3fa", marginTop: 15, paddingTop: 14 },
  avatarLine: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 3, borderColor: "#fff", backgroundColor: "#087BFF", overflow: "hidden", alignItems: "center", justifyContent: "center", elevation: 2 },
  avatarImage: { width: "100%", height: "100%" },
  secondaryAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 42, borderRadius: 12, paddingHorizontal: 13, backgroundColor: "#edf6ff" },
  secondaryActionText: { color: "#087BFF", fontSize: 11, fontFamily: "Quicksand_700Bold" },
  removeAvatar: { marginLeft: "auto", width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#fff2f2" },
  field: { marginTop: 13 }, label: { fontSize: 10, color: "#47627d", fontFamily: "Quicksand_700Bold", marginBottom: 6 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: "#dce7f1", backgroundColor: "#fbfdff", paddingHorizontal: 12, paddingVertical: 10, color: "#07156c", fontSize: 12, fontFamily: "Quicksand_600SemiBold", outlineStyle: "none" as any },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  emailHint: { fontSize: 10, lineHeight: 15, marginTop: 10, color: "#7183a4", fontFamily: "Quicksand_500Medium" },
  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: "#e2edf8", backgroundColor: "rgba(255,255,255,0.98)" },
  actions: { flexDirection: "row", gap: 10 },
  cancel: { flex: 1, minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: "#c9d8e6", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  cancelText: { color: "#526789", fontSize: 12, fontFamily: "Quicksand_700Bold" },
  save: { flex: 1.45, minHeight: 48, borderRadius: 13, backgroundColor: "#087BFF", alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontSize: 12, fontFamily: "Quicksand_700Bold" },
  error: { color: "#B4232C", fontSize: 11, lineHeight: 16, fontFamily: "Quicksand_600SemiBold", marginBottom: 7 },
});
