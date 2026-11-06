import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  ContentContainer,
  CardRailSkeleton,
  DiveSiteCard,
  EmptyState,
  ErrorState,
  EstablishmentCard,
  resolveEstablishmentMedia,
  HeroCarousel,
  SearchBar,
  Skeleton,
} from "../../components";
import { SearchResult } from "../../components/SearchBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";
import {
  AnnouncementRow,
  DiveSiteRow,
  EstablishmentRow,
} from "../../types/supabase";

const categoryOptions: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  matches: (site: DiveSiteRow) => boolean;
}[] = [
  {
    key: "all",
    label: "All Dives",
    icon: "compass-outline",
    matches: () => true,
  },
  {
    key: "Beginner",
    label: "Beginner",
    icon: "sunny-outline",
    matches: (s) =>
      s.difficulty === "Beginner" || s.difficulty === "Open Water",
  },
  {
    key: "Intermediate",
    label: "Intermediate",
    icon: "water-outline",
    matches: (s) =>
      s.difficulty === "Intermediate" || s.difficulty === "Rescue",
  },
  {
    key: "Advanced",
    label: "Advanced",
    icon: "flash-outline",
    matches: (s) =>
      s.difficulty === "Advanced" ||
      s.difficulty === "Divemaster" ||
      s.difficulty === "Instructor",
  },
];

const notifIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  eco_dive_activated: "checkmark-circle",
  dive_plan_ready: "map",
  operator_application_approved: "checkmark-done",
  operator_application_rejected: "close-circle",
  pass_purchase_verified: "wallet",
  manifest_submitted: "document-text",
  announcement_published: "megaphone",
};

const notifColors: Record<string, string> = {
  eco_dive_activated: colors.green,
  dive_plan_ready: colors.primaryBlue,
  operator_application_approved: colors.green,
  operator_application_rejected: colors.red,
  pass_purchase_verified: colors.amberDark,
  manifest_submitted: colors.primaryBlue,
  announcement_published: colors.amberDark,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, 40);
  const router = useRouter();
  const {
    profile,
    avatarUri,
    isLoading: authLoading,
    unreadCount,
    notifications,
    fetchNotifications,
    markAllNotificationsRead,
    user,
  } = useAuth();
  const { isDesktop } = useLayout();
  const { width: screenWidth } = useWindowDimensions();
  const notifWidth = Math.min(Math.max(screenWidth - 32, 220), 300);

  const firstName =
    profile?.full_name?.trim().split(" ")[0] ||
    user?.user_metadata?.full_name?.trim().split(" ")[0] ||
    "Diver";

  const [notifOpen, setNotifOpen] = useState(false);

  const handleToggleNotifications = useCallback(() => {
    setNotifOpen((prev) => {
      const next = !prev;
      if (next) {
        fetchNotifications();
        markAllNotificationsRead();
      }
      return next;
    });
  }, [fetchNotifications, markAllNotificationsRead]);

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [diveSites, setDiveSites] = useState<DiveSiteRow[]>([]);
  const [diveSitesLoading, setDiveSitesLoading] = useState(true);
  const [diveSitesError, setDiveSitesError] = useState(false);
  const [diveSitesReloadKey, setDiveSitesReloadKey] = useState(0);
  const [activeCategory, setActiveCategory] = useState("all");

  const [establishments, setEstablishments] = useState<EstablishmentRow[]>([]);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);
  const [establishmentsError, setEstablishmentsError] = useState(false);
  const [establishmentsReloadKey, setEstablishmentsReloadKey] = useState(0);

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);

  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const activeCategoryConfig =
    categoryOptions.find((c) => c.key === activeCategory) ?? categoryOptions[0];
  const filteredDiveSites = diveSites.filter((s) =>
    activeCategoryConfig.matches(s),
  );

  // Load dive sites from Tourism Office dashboard database
  useEffect(() => {
    let active = true;
    supabase
      .from("dive_sites")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        const rows = (data ?? [])
          .filter((row) => !row.status || row.status !== "Restricted")
          .sort((a, b) => {
            const aHasPhoto = Boolean(
              a.photo_url?.trim() || a.image_url?.trim(),
            );
            const bHasPhoto = Boolean(
              b.photo_url?.trim() || b.image_url?.trim(),
            );
            if (aHasPhoto !== bHasPhoto) return aHasPhoto ? -1 : 1;
            const aTime = new Date(
              a.updated_at || a.created_at || 0,
            ).getTime();
            const bTime = new Date(
              b.updated_at || b.created_at || 0,
            ).getTime();
            return bTime - aTime;
          });
        setDiveSites(rows);
        setDiveSitesError(!!error);
        setDiveSitesLoading(false);
      },
      () => {
        if (!active) return;
        setDiveSitesError(true);
        setDiveSitesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [diveSitesReloadKey]);

  const handleRetryDiveSites = useCallback(() => {
    setDiveSitesLoading(true);
    setDiveSitesError(false);
    setDiveSitesReloadKey((k) => k + 1);
  }, []);

  // Load accredited dive resorts / establishments
  useEffect(() => {
    let active = true;
    supabase
      .from("establishments")
      .select("*")
      .eq("accredited", true)
      .limit(10)
      .then(({ data, error }) => {
        if (!active) return;
        setEstablishments(data ?? []);
        setEstablishmentsError(!!error);
        setEstablishmentsLoading(false);
      },
      () => {
        if (!active) return;
        setEstablishmentsError(true);
        setEstablishmentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [establishmentsReloadKey]);

  const handleRetryEstablishments = useCallback(() => {
    setEstablishmentsLoading(true);
    setEstablishmentsError(false);
    setEstablishmentsReloadKey((k) => k + 1);
  }, []);

  // Load active announcements from Tourism Office dashboard
  useEffect(() => {
    let active = true;
    supabase
      .from("announcements")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setAnnouncements(data ?? []);
        setAnnouncementsLoading(false);
      },
      () => {
        if (!active) return;
        setAnnouncements([]);
        setAnnouncementsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

    // Load tourist favorites
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const { data } = await supabase
        .from("tourist_favorites")
        .select("dive_site_id")
        .eq("tourist_id", user.id);
      setFavoriteIds(new Set((data ?? []).map((f) => f.dive_site_id)));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  const handleToggleFavorite = useCallback(
    async (diveSiteId: string) => {
      if (!user) return;
      const isFav = favoriteIds.has(diveSiteId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) next.delete(diveSiteId);
        else next.add(diveSiteId);
        return next;
      });
      try {
        if (isFav) {
          const { error } = await supabase
            .from("tourist_favorites")
            .delete()
            .eq("tourist_id", user.id)
            .eq("dive_site_id", diveSiteId);
          if (error) {
            setFavoriteIds((prev) => new Set(prev).add(diveSiteId));
          }
        } else {
          const { error } = await supabase
            .from("tourist_favorites")
            .insert({ tourist_id: user.id, dive_site_id: diveSiteId });
          if (error) {
            setFavoriteIds((prev) => {
              const next = new Set(prev);
              next.delete(diveSiteId);
              return next;
            });
          }
        }
      } catch {
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(diveSiteId);
          else next.delete(diveSiteId);
          return next;
        });
      }
    },
    [user, favoriteIds],
  );

  const handleSearch = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      setSearchLoading(true);
      const sites: SearchResult[] = diveSites
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.barangay && s.barangay.toLowerCase().includes(q)) ||
            (s.site_type && s.site_type.toLowerCase().includes(q)) ||
            (s.difficulty && s.difficulty.toLowerCase().includes(q)) ||
            (s.description && s.description.toLowerCase().includes(q)),
        )
        .map((s) => ({
          id: s.id,
          type: "dive-site" as const,
          title: s.name,
          subtitle: [s.barangay || "Mabini, Batangas", s.difficulty]
            .filter(Boolean)
            .join(" • "),
        }));

      const ests: SearchResult[] = establishments
        .filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            (e.location && e.location.toLowerCase().includes(q)) ||
            (e.description && e.description.toLowerCase().includes(q)),
        )
        .map((e) => ({
          id: e.id,
          type: "establishment" as const,
          title: e.name,
          subtitle: e.location || "Accredited Dive Resort",
        }));

      setSearchResults([...sites, ...ests]);
      setSearchLoading(false);
    },
    [diveSites, establishments],
  );

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authLoading}>
          <View style={styles.authLoadingHeader}>
            <Skeleton width={132} height={28} radius={8} />
            <Skeleton width={40} height={40} radius={20} />
          </View>
          <Skeleton height={46} radius={14} />
          <Skeleton height={180} radius={18} />
          <CardRailSkeleton count={2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ContentContainer maxWidth={900} paddingH={20}>
          {/* Top Bar: SINSAY blue logo on upper left, Notification + Profile on upper right */}
          {!isDesktop && (
            <View style={[styles.topBar, { paddingTop: safeTop + 4 }]}>
              <Image
                source={require("../../../assets/sinsay-blue-home.webp")}
                style={styles.logoImage}
                contentFit="contain"
                priority="high"
                cachePolicy="memory-disk"
                accessibilityLabel="SINSAY"
              />

              <View style={styles.topBarActions}>
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    notifOpen && styles.iconButtonActive,
                  ]}
                  onPress={handleToggleNotifications}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Notifications"
                >
                  <Ionicons
                    name={
                      notifOpen ? "notifications" : "notifications-outline"
                    }
                    size={20}
                    color={notifOpen ? colors.primaryBlue : colors.darkText}
                  />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.avatarCircle}
                  onPress={() => router.push("/(tabs)/profile")}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="User profile"
                >
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={{ width: "100%", height: "100%", borderRadius: 19 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="person" size={18} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Greeting Section */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingTitle}>Hi {firstName}!</Text>
            <Text style={styles.greetingSubtitle}>
              Welcome to Mabini, Batangas
            </Text>
          </View>

          {/* Full-width rounded search bar underneath */}
          <SearchBar
            placeholder="Search dive sites, resorts, or activities..."
            results={searchResults}
            loading={searchLoading}
            onSearch={handleSearch}
            renderResult={(item) => (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
                style={styles.searchResultRow}
                onPress={() => {
                  if (item.type === "dive-site") {
                    router.push({
                      pathname: "/dive-site/[id]",
                      params: { id: item.id },
                    });
                  } else {
                    router.push({
                      pathname: "/establishment/[id]",
                      params: { id: item.id },
                    });
                  }
                }}
              >
                <View style={styles.searchResultIcon}>
                  <Ionicons
                    name={item.type === "dive-site" ? "water" : "business"}
                    size={16}
                    color={colors.primaryBlue}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultTitle}>{item.title}</Text>
                  {item.subtitle ? (
                    <Text style={styles.searchResultSub}>{item.subtitle}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.gray}
                />
              </TouchableOpacity>
            )}
          />

          {/* Category filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryRow}
          >
            {categoryOptions.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryPill,
                    isActive && styles.categoryPillActive,
                  ]}
                  onPress={() => setActiveCategory(cat.key)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={cat.label}
                >
                  <Ionicons
                    name={cat.icon}
                    size={14}
                    color={isActive ? colors.white : colors.primaryBlue}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      isActive && styles.categoryTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Hero Section: Announcements from the Tourism Office Dashboard */}
          {announcementsLoading ? (
            <View style={styles.heroPlaceholder} />
          ) : announcements.length > 0 ? (
            <HeroCarousel
              items={announcements.map((a) => ({
                image: a.image_url
                  ? { uri: a.image_url }
                  : require("../../../assets/hero-banner.jpg"),
                announcement: a.title,
                body: a.body,
              }))}
            />
          ) : (
            <HeroCarousel
              items={[
                {
                  image: require("../../../assets/hero-banner.jpg"),
                  announcement: "Protect Mabini's Vibrant Coral Reefs",
                  body: "Keep your Eco-Dive ID active before every dive.",
                },
              ]}
            />
          )}

          {diveSitesLoading && establishmentsLoading ? (
            <View style={styles.railPlaceholder}>
              <ActivityIndicator size="small" color={colors.primaryBlue} />
            </View>
          ) : (
            <>
              {/* Popular Dive Sites: Horizontal Carousel of Large Photographic Cards */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Popular Dive Sites</Text>
                <TouchableOpacity
                  onPress={() => router.push("/dive-sites")}
                  accessibilityRole="button"
                  accessibilityLabel="See all popular dive sites"
                >
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              {diveSitesLoading ? (
                <View style={styles.railPlaceholder}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                </View>
              ) : diveSitesError ? (
                <ErrorState
                  message="Failed to load dive sites."
                  onRetry={handleRetryDiveSites}
                />
              ) : diveSites.length === 0 ? (
                <EmptyState
                  icon="map-outline"
                  message="No dive sites available yet."
                />
              ) : filteredDiveSites.length === 0 ? (
                <EmptyState
                  icon="funnel-outline"
                  message="No dive sites match this filter."
                />
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.diveSitesScroll}
                  contentContainerStyle={styles.diveSitesCarousel}
                >
                  {filteredDiveSites.slice(0, 4).map((site, index) => (
                    <DiveSiteCard
                      key={site.id}
                      name={site.name}
                      location={site.barangay || "Mabini, Batangas"}
                      depthRange={site.depth_range}
                      difficulty={site.difficulty}
                      rating={site.rating}
                      imageUrl={site.image_url}
                      photoUrl={site.photo_url}
                      index={index}
                      liked={favoriteIds.has(site.id)}
                      onPress={() =>
                        router.push({
                          pathname: "/dive-site/[id]",
                          params: { id: site.id },
                        })
                      }
                      onLike={() => handleToggleFavorite(site.id)}
                    />
                  ))}
                </ScrollView>
              )}

              {/* Dive Resorts: Horizontal Information-Card Layout */}
              <View style={[styles.sectionHeaderRow, { marginTop: 26 }]}>
                <Text style={styles.sectionTitle}>Dive Resorts</Text>
                <TouchableOpacity
                  onPress={() => router.push("/establishments")}
                  accessibilityRole="button"
                  accessibilityLabel="See all dive resorts"
                >
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              </View>

              {establishmentsLoading ? (
                <View style={styles.railPlaceholder}>
                  <ActivityIndicator size="small" color={colors.primaryBlue} />
                </View>
              ) : establishmentsError ? (
                <ErrorState
                  message="Failed to load dive resorts."
                  onRetry={handleRetryEstablishments}
                />
              ) : establishments.length === 0 ? (
                <EmptyState
                  icon="business-outline"
                  message="No accredited dive resorts yet."
                />
              ) : (
                <View style={styles.resortsList}>
                  {establishments.slice(0, 6).map((item, idx) => {
                    const { imageUrl } = resolveEstablishmentMedia(item);
                    return (
                    <EstablishmentCard
                      key={item.id}
                      name={item.name}
                      location={item.location}
                      accreditation={item.accreditation}
                      accredited={item.accredited}
                      isPcssdAccredited={Boolean(item.pcssd_url && item.pcssd_url.trim().length > 0)}
                      isDotAccredited={Boolean(item.dot_url && item.dot_url.trim().length > 0)}
                      imageUrl={imageUrl}
                      index={idx}
                      onPress={() =>
                        router.push({
                          pathname: "/establishment/[id]",
                          params: { id: item.id },
                        })
                      }
                    />
                    );
                  })}
                </View>
              )}
            </>
          )}

          <View style={{ height: 24 }} />
        </ContentContainer>
      </ScrollView>

      {/* Floating Notifications Popover (rendered above ScrollView so it never clips) */}
      {notifOpen && (
        <>
          <Pressable
            style={styles.notifBackdrop}
            onPress={() => setNotifOpen(false)}
            accessibilityLabel="Close notifications"
          />
          <View style={[styles.notifPopover, { width: notifWidth }]}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.notifHeaderTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setNotifOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close notifications panel"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmptyWrap}>
                <Ionicons
                  name="notifications-off-outline"
                  size={28}
                  color="#94A3B8"
                />
                <Text style={styles.notifEmptyText}>
                  No notifications yet
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.notifListScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {notifications.map((notif) => {
                  const icon = notifIcons[notif.type] || "ellipse";
                  const iconColor = notifColors[notif.type] || colors.gray;
                  return (
                    <TouchableOpacity
                      key={notif.id}
                      style={[
                        styles.notifItemRow,
                        !notif.is_read && styles.notifItemUnread,
                      ]}
                      activeOpacity={0.75}
                      onPress={() => {
                        setNotifOpen(false);
                        if (notif.deep_link) {
                          router.push(notif.deep_link as any);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.notifItemIcon,
                          { backgroundColor: iconColor + "18" },
                        ]}
                      >
                        <Ionicons name={icon} size={16} color={iconColor} />
                      </View>
                      <View style={styles.notifItemBodyCol}>
                        <Text
                          style={styles.notifItemTitle}
                          numberOfLines={1}
                        >
                          {notif.title}
                        </Text>
                        <Text
                          style={styles.notifItemBody}
                          numberOfLines={2}
                        >
                          {notif.body}
                        </Text>
                        <Text style={styles.notifItemTime}>
                          {timeAgo(notif.created_at)}
                        </Text>
                      </View>
                      {!notif.is_read && (
                        <View style={styles.notifUnreadDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    gap: 18,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  authLoadingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
    position: "relative",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 116,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
    paddingTop: 0,
    zIndex: 120,
  },
  logoImage: {
    width: 152,
    height: 42,
  },
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F8FBFF",
    borderWidth: 1,
    borderColor: "#DBE8F4",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: {
    backgroundColor: "#EBF3FF",
    borderColor: colors.primaryBlue,
  },
  notifBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 200,
  },
  notifPopover: {
    position: "absolute",
    top: 72,
    right: 16,
    maxWidth: 300,
    maxHeight: 370,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    shadowColor: "#0F172A",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
    zIndex: 210,
    overflow: "hidden",
  },
  notifHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    backgroundColor: "#F8FBFF",
  },
  notifHeaderTitle: {
    fontSize: 15,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  notifEmptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
  },
  notifEmptyText: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#64748B",
  },
  notifListScroll: {
    maxHeight: 310,
  },
  notifItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  notifItemUnread: {
    backgroundColor: "#F0F7FF",
  },
  notifItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  notifItemBodyCol: {
    flex: 1,
    gap: 2,
  },
  notifItemTitle: {
    fontSize: 13,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  notifItemBody: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#475569",
    lineHeight: 16,
  },
  notifItemTime: {
    fontSize: 10.5,
    fontFamily: "Quicksand_500Medium",
    color: "#94A3B8",
    marginTop: 2,
  },
  notifUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryBlue,
    marginTop: 6,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontFamily: "Quicksand_700Bold",
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryBlue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  greetingBlock: {
    marginTop: 14,
    paddingLeft: 10,
  },
  greetingTitle: {
    fontSize: 22,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    lineHeight: 28,
  },
  greetingSubtitle: {
    fontSize: 13,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
    marginTop: 2,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EBF3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultTitle: {
    fontSize: 14,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
  },
  searchResultSub: {
    fontSize: 12,
    fontFamily: "Quicksand_500Medium",
    color: "#657C9B",
    marginTop: 1,
  },
  categoryScroll: {
    flexGrow: 0,
    marginTop: 12,
  },
  categoryRow: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "#DBE8F4",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  categoryPillActive: {
    backgroundColor: colors.primaryBlue,
    borderColor: colors.primaryBlue,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
  },
  categoryTextActive: {
    color: colors.white,
  },
  heroPlaceholder: {
    marginTop: 14,
    height: 176,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Quicksand_700Bold",
    color: colors.darkText,
    flexShrink: 1,
    paddingRight: 8,
  },
  seeAll: {
    fontSize: 12.5,
    fontFamily: "Quicksand_600SemiBold",
    color: colors.primaryBlue,
  },
  diveSitesScroll: {
    flexGrow: 0,
  },
  diveSitesCarousel: {
    paddingTop: 12,
    paddingBottom: 6,
    gap: 12,
  },
  resortsList: {
    marginTop: 12,
    gap: 12,
  },
  railPlaceholder: {
    marginTop: 16,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
  },
});
