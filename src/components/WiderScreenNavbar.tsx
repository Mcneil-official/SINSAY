import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export interface SearchResultItem {
  id: string;
  type: "dive-site" | "establishment";
  title: string;
  subtitle?: string;
}

interface CachedSite {
  id: string;
  name: string;
  rating?: string;
}

interface CachedEst {
  id: string;
  name: string;
}

export interface WiderScreenNavbarProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export default function WiderScreenNavbar({
  onSearch,
  searchQuery,
  setSearchQuery,
}: WiderScreenNavbarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { unreadCount } = useAuth();

  // Search state
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [cachedSites, setCachedSites] = useState<CachedSite[]>([]);
  const [cachedEsts, setCachedEsts] = useState<CachedEst[]>([]);

  const activeQuery = searchQuery !== undefined ? searchQuery : localQuery;

  // Load searchable data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadSearchData() {
      try {
        const [{ data: sites }, { data: ests }] = await Promise.all([
          supabase.from("dive_sites").select("id, name, rating").limit(50),
          supabase.from("establishments").select("id, name").eq("accredited", true).limit(50),
        ]);
        if (isMounted) {
          if (sites) setCachedSites(sites);
          if (ests) setCachedEsts(ests);
        }
      } catch (err) {
        console.warn("Failed to load search index for navbar:", err);
      }
    }
    loadSearchData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute search results purely via useMemo without cascading render states
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const q = activeQuery.trim().toLowerCase();
    if (q.length < 2) return [];

    const matchedSites: SearchResultItem[] = cachedSites
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        type: "dive-site",
        title: s.name,
        subtitle: s.rating ? `Rating: ${s.rating} ★` : "Dive Site",
      }));

    const matchedEsts: SearchResultItem[] = cachedEsts
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map((e) => ({
        id: e.id,
        type: "establishment",
        title: e.name,
        subtitle: "Accredited Dive Center",
      }));

    return [...matchedSites, ...matchedEsts];
  }, [activeQuery, cachedSites, cachedEsts]);

  const handleQueryChange = (text: string) => {
    if (setSearchQuery) {
      setSearchQuery(text);
    } else {
      setLocalQuery(text);
    }
    if (onSearch) {
      onSearch(text);
    }
  };

  const handleClearSearch = () => {
    if (setSearchQuery) {
      setSearchQuery("");
    } else {
      setLocalQuery("");
    }
    if (onSearch) {
      onSearch("");
    }
  };

  const handleSelectResult = (item: SearchResultItem) => {
    setIsSearchFocused(false);
    handleClearSearch();
    if (item.type === "dive-site") {
      router.push({ pathname: "/dive-site/[id]", params: { id: item.id } });
    } else {
      router.push({ pathname: "/establishment/[id]", params: { id: item.id } });
    }
  };

  const handleSubmitSearch = () => {
    if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    } else if (activeQuery.trim()) {
      setIsSearchFocused(false);
      router.push("/dive-sites");
    }
  };

  // Active state determination for nav links
  const isHomeActive =
    pathname === "/(tabs)" ||
    pathname === "/" ||
    pathname === "/(tabs)/index" ||
    pathname === "/index";

  const isEcoDiveActive =
    pathname.includes("eco-dive-id") ||
    pathname.startsWith("/(tabs)/eco-dive-id");

  const isAssistantActive =
    pathname.includes("dive-assistant") ||
    pathname.startsWith("/(tabs)/dive-assistant");

  const isProfileActive =
    pathname.includes("profile") ||
    pathname.startsWith("/(tabs)/profile");

  return (
    <View style={styles.wrapper}>
      <View style={styles.navbar}>
        {/* Left Side: Home, Eco-Dive ID, and Dive Assistant */}
        <View style={styles.navGroupLeft}>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(tabs)")}
            accessibilityRole="link"
            accessibilityState={{ selected: isHomeActive }}
            accessibilityLabel="Home"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isHomeActive && styles.navTextActive,
              ]}
            >
              Home
            </Text>
            {isHomeActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(tabs)/eco-dive-id")}
            accessibilityRole="link"
            accessibilityState={{ selected: isEcoDiveActive }}
            accessibilityLabel="Eco-Dive ID"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isEcoDiveActive && styles.navTextActive,
              ]}
            >
              Eco-Dive ID
            </Text>
            {isEcoDiveActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(tabs)/dive-assistant")}
            accessibilityRole="link"
            accessibilityState={{ selected: isAssistantActive }}
            accessibilityLabel="Dive Assistant"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isAssistantActive && styles.navTextActive,
              ]}
            >
              Dive Assistant
            </Text>
            {isAssistantActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Center: Real SINSAY Logo */}
        <TouchableOpacity
          style={styles.logoBtn}
          onPress={() => router.push("/(tabs)")}
          accessibilityRole="button"
          accessibilityLabel="SINSAY Home"
          activeOpacity={0.8}
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
            contentFit="contain"
            accessibilityLabel="SINSAY"
          />
        </TouchableOpacity>

        {/* Right Side: Profile, Search Input, and Notification Bell */}
        <View style={styles.navGroupRight}>
          <TouchableOpacity
            style={styles.navLink}
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="link"
            accessibilityState={{ selected: isProfileActive }}
            accessibilityLabel="Profile"
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.navText,
                isProfileActive && styles.navTextActive,
              ]}
            >
              Profile
            </Text>
            {isProfileActive && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Search bar positioned before notification icon */}
          <View style={styles.searchWrapper}>
            <View
              style={[
                styles.searchCapsule,
                isSearchFocused && styles.searchCapsuleFocused,
              ]}
            >
              <Ionicons
                name="search"
                size={15}
                color={isSearchFocused ? colors.primaryBlue : "#94A3B8"}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search dive sites, shops..."
                placeholderTextColor="#94A3B8"
                value={activeQuery}
                onChangeText={handleQueryChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Slight delay to allow clicking on dropdown results
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                returnKeyType="search"
                onSubmitEditing={handleSubmitSearch}
              />
              {activeQuery.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Clear search"
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={14} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown search results */}
            {isSearchFocused && activeQuery.trim().length >= 2 && (
              <View style={styles.searchDropdown}>
                {searchResults.length === 0 ? (
                  <View style={styles.dropdownEmpty}>
                    <Text style={styles.dropdownEmptyText}>
                      No sites or shops match &ldquo;{activeQuery}&rdquo;
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    style={styles.dropdownList}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {searchResults.map((item) => (
                      <TouchableOpacity
                        key={`${item.type}-${item.id}`}
                        style={styles.dropdownItem}
                        onPress={() => handleSelectResult(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownItemIconWrap}>
                          <Ionicons
                            name={item.type === "dive-site" ? "water" : "business"}
                            size={14}
                            color={colors.primaryBlue}
                          />
                        </View>
                        <View style={styles.dropdownItemTextCol}>
                          <Text style={styles.dropdownItemTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.subtitle && (
                            <Text style={styles.dropdownItemSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={12} color="#CBD5E1" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Far Right: Notification Bell */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => router.push("/notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={18} color="#334155" />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    alignItems: "center",
    zIndex: 100,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 12,
  },
  navbar: {
    width: "94%",
    maxWidth: 1200,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    position: "relative",
  },
  navGroupLeft: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    flex: 1,
  },
  navGroupRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    flex: 1,
  },
  navLink: {
    height: 44,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    letterSpacing: 0.1,
  },
  navTextActive: {
    color: "#005EEC",
    fontWeight: "700",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 2,
    left: 8,
    right: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#005EEC",
  },
  logoBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
  },
  logoImage: {
    width: 140,
    height: 32,
  },
  searchWrapper: {
    position: "relative",
    zIndex: 200,
  },
  searchCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 19,
    height: 38,
    width: 230,
    paddingHorizontal: 12,
  },
  searchCapsuleFocused: {
    borderColor: "#005EEC",
    shadowColor: "#005EEC",
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    paddingVertical: 0,
    outlineStyle: "none" as any,
  },
  clearBtn: {
    padding: 3,
  },
  searchDropdown: {
    position: "absolute",
    top: 46,
    right: 0,
    width: 280,
    maxHeight: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    overflow: "hidden",
    zIndex: 999,
  },
  dropdownEmpty: {
    padding: 14,
    alignItems: "center",
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
  },
  dropdownList: {
    maxHeight: 270,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  dropdownItemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dropdownItemTextCol: {
    flex: 1,
    marginRight: 6,
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  dropdownItemSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: colors.red || "#EF4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
