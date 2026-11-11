import { Session, User } from "@supabase/supabase-js";
import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { deleteAvatarBlob, loadAvatarBlob, saveAvatarBlob } from "../lib/avatarStore";
import { isGoogleGisConfigured, triggerGoogleGisSignIn } from "../lib/googleAuth";
import { markFirstTimeTutorialPending } from "../lib/onboarding";
import { supabase } from "../lib/supabase";
import { EcoDiveIDRow, NotificationRow, OperatorApplicationRow, TouristRow, TouristUpdate } from "../types/supabase";


export function resolveAvatarUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return supabase.storage.from("operator_media").getPublicUrl(trimmed).data.publicUrl;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: TouristRow | null;
  ecoId: EcoDiveIDRow | null;
  operatorApplication: OperatorApplicationRow | null;
  isOperator: boolean;
  avatarUri: string | null;
  // Web: pass the picker's File/Blob as `blob` — persisted raw in IndexedDB
  // (survives reloads, no base64/quota issues) and exposed as an object URL.
  // Native/legacy: uri alone is kept in memory.
  setAvatarUri: (uri: string | null, blob?: Blob | null) => void;
  clearAvatarOverride: (userId?: string) => void;
  // Lets an approved operator browse the tourist stack (the FAQ promises a
  // "switch back" from the Operator Profile tab). Gates respect it — without
  // this, TouristGate would bounce them straight back to operator tabs.
  viewAsTourist: boolean;
  setViewAsTourist: (v: boolean) => void;
  isLoading: boolean;
  // True once role data (profile + operatorApplication) has settled for the
  // current user (or immediately when logged out). Gates must wait for this —
  // isLoading alone is one-shot at boot and goes false while fetchProfile is
  // still in flight, which caused the operator ping-pong flash.
  roleReady: boolean;
  unreadCount: number;
  notifications: NotificationRow[];
  fetchNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string; isOperator?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  // Google Sign-In (web PWA): when EXPO_PUBLIC_GOOGLE_CLIENT_ID is set, uses
  // Google Identity Services + supabase.auth.signInWithIdToken() directly from
  // the app's origin (showing "SINSAY" instead of .supabase.co); otherwise
  // falls back to full-page OAuth redirect.
  signInWithGoogle: () => Promise<{ error?: string; isOperator?: boolean }>;
  signInWithGoogleIdToken: (
    idToken: string,
    rawNonce?: string
  ) => Promise<{ error?: string; isOperator?: boolean }>;
  signOut: () => Promise<void>;
  // Password reset (email link flow): request sends the Supabase recovery
  // email (redirects to /auth/reset-password — must be allowlisted in
  // Supabase Auth → URL Configuration); confirm sets the new password on
  // the recovery session. Never throw — return { error }.
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: TouristUpdate) => Promise<{ error?: string }>;
}

const defaultAuthState: AuthState = {
  user: null,
  session: null,
  profile: null,
  ecoId: null,
  operatorApplication: null,
  isOperator: false,
  avatarUri: null,
  setAvatarUri: () => {},
  clearAvatarOverride: () => {},
  viewAsTourist: false,
  setViewAsTourist: () => {},
  isLoading: true,
  roleReady: false,
  unreadCount: 0,
  notifications: [],
  fetchNotifications: async () => {},
  markAllNotificationsRead: async () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
  signInWithGoogle: async () => ({}),
  signInWithGoogleIdToken: async () => ({}),
  signOut: async () => {},
  requestPasswordReset: async () => ({}),
  updatePassword: async () => ({}),
  refreshProfile: async () => {},
  updateProfile: async () => ({}),
};

export const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<TouristRow | null>(null);
  const [ecoId, setEcoId] = useState<EcoDiveIDRow | null>(null);
  const [operatorApplication, setOperatorApplication] = useState<OperatorApplicationRow | null>(null);
  const [viewAsTourist, setViewAsTourist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [roleReady, setRoleReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  // Single-flight guard: concurrent fetchProfile calls (getSession +
  // INITIAL_SESSION + signIn) race and last-writer-wins with stale nulls.
  // Only the latest request may apply operatorApplication / profile state.
  const fetchSeqRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);
  const fetchNotifsRef = useRef<{ fetchNotifications?: () => Promise<void>; fetchUnreadCount?: () => Promise<void> }>({});

  const clearLocalAuthState = useCallback(() => {
    setProfile(null);
    setEcoId(null);
    setOperatorApplication(null);
    setViewAsTourist(false);
    setNotifications([]);
    setUnreadCount(0);
    setRoleReady(false);
    setAvatarOverrides({});
  }, []);

  const signOut = useCallback(async () => {
    // Clear local state BEFORE awaiting Supabase so gates see a consistent
    // logged-out snapshot immediately; onAuthStateChange else-branch keeps
    // this idempotent. Navigation is gate-owned (no router here).
    // Declared above the subscription effects: the operator-app channel
    // calls it on refresh failure, so it must be initialized before the
    // effect dependency arrays are evaluated (TDZ).
    fetchSeqRef.current += 1;
    currentUserIdRef.current = null;
    setUser(null);
    setSession(null);
    clearLocalAuthState();
    // Logged-out snapshot is definitive for gates.
    setRoleReady(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase auth signOut warning:", err);
    }
  }, [clearLocalAuthState]);

  const isOperator = operatorApplication?.status === "approved";

  // Per-user display URIs. On web these are object URLs created from the
  // IndexedDB-stored Blob (blob URLs die on reload, so they live only here).
  const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string | null>>({});
  const avatarObjectUrlsRef = useRef<Record<string, string>>({});

  const revokeAvatarObjectUrl = useCallback((userId: string) => {
    const url = avatarObjectUrlsRef.current[userId];
    if (url && typeof URL !== "undefined" && URL.revokeObjectURL) {
      URL.revokeObjectURL(url);
    }
    delete avatarObjectUrlsRef.current[userId];
  }, []);

  // Hydrate the avatar from IndexedDB when the signed-in user changes so the
  // photo survives full page reloads (object URLs cannot).
  useEffect(() => {
    if (!user || Platform.OS !== "web") return;
    let cancelled = false;
    loadAvatarBlob(user.id).then((blob) => {
      if (cancelled || !blob) return;
      if (typeof URL === "undefined" || !URL.createObjectURL) return;
      revokeAvatarObjectUrl(user.id);
      const url = URL.createObjectURL(blob);
      avatarObjectUrlsRef.current[user.id] = url;
      setAvatarOverrides((prev) => ({ ...prev, [user.id]: url }));
    }).catch(() => {
      // IndexedDB read failed — fall back to whatever the caller already has.
    });
    const announcementsChannel = supabase
      .channel("announcements-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          fetchNotifsRef.current.fetchNotifications?.();
          fetchNotifsRef.current.fetchUnreadCount?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
      cancelled = true;
    };
  }, [user, revokeAvatarObjectUrl]);

  // Revoke lingering object URLs on provider unmount (app teardown).
  useEffect(() => {
    const urls = avatarObjectUrlsRef.current;
    return () => {
      if (typeof URL === "undefined" || !URL.revokeObjectURL) return;
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const avatarUri = useMemo(() => {
    if (!user) return null;
    // 1. Explicit local session override (e.g. while actively previewing a newly picked avatar)
    if (avatarOverrides[user.id] !== undefined) {
      if (avatarOverrides[user.id] !== null) {
        return avatarOverrides[user.id];
      }
      // If override is explicitly null, but user has no cloud avatar, return null
      if (!profile?.avatar_path) {
        return null;
      }
      // If user has a cloud avatar and override was null (e.g. stale override), fall through to cloud avatar
    }
    // 2. Cloud-saved Supabase storage avatar path or full URL
    if (profile?.avatar_path) {
      return resolveAvatarUrl(profile.avatar_path);
    }
    // 3. Fallback to Google OAuth user avatar metadata
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    if (typeof meta?.avatar_url === "string" && meta.avatar_url.trim()) {
      return meta.avatar_url.trim();
    }
    if (typeof meta?.picture === "string" && meta.picture.trim()) {
      return meta.picture.trim();
    }
    return null;
  }, [user, avatarOverrides, profile?.avatar_path]);

  const setAvatarUri = useCallback(
    (uri: string | null, blob?: Blob | null) => {
      if (!user) return;
      const userId = user.id;
      revokeAvatarObjectUrl(userId);
      if (uri === null) {
        setAvatarOverrides((prev) => ({ ...prev, [userId]: null }));
        if (Platform.OS === "web") void deleteAvatarBlob(userId);
        return;
      }
      if (
        blob &&
        Platform.OS === "web" &&
        typeof URL !== "undefined" &&
        URL.createObjectURL
      ) {
        const url = URL.createObjectURL(blob);
        avatarObjectUrlsRef.current[userId] = url;
        setAvatarOverrides((prev) => ({ ...prev, [userId]: url }));
        void saveAvatarBlob(userId, blob);
        return;
      }
      // Native/legacy: keep the picker's file URI in memory (cache-dir path
      // survives app relaunch; no IndexedDB on native).
      setAvatarOverrides((prev) => ({ ...prev, [userId]: uri }));
    },
    [user, revokeAvatarObjectUrl],
  );

  
  const clearAvatarOverride = useCallback(
    (userId?: string) => {
      const id = userId || user?.id;
      if (!id) return;
      revokeAvatarObjectUrl(id);
      setAvatarOverrides((prev) => {
        if (prev[id] === undefined) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [user, revokeAvatarObjectUrl],
  );

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const [notifRes, announcementsRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .eq("tourist_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("announcements")
        .select("id, title")
        .eq("active", true),
    ]);

    const rawNotifs = notifRes.data ?? [];
    const activeAnnouncements = announcementsRes.data ?? [];
    const activeIds = new Set(activeAnnouncements.map((a) => a.id));

    const orphanNotifIds: string[] = [];

    const validNotifs = rawNotifs.filter((n) => {
      if (n.type !== "announcement_published") {
        return true;
      }
      const match = n.deep_link?.match(/^\/announcement\/(.+)$/);
      if (match && match[1]) {
        if (activeIds.has(match[1])) return true;
      } else {
        const found = activeAnnouncements.find(
          (a) => a.title.trim().toLowerCase() === n.title.trim().toLowerCase()
        );
        if (found) {
          n.deep_link = `/announcement/${found.id}`;
          supabase
            .from("notifications")
            .update({ deep_link: `/announcement/${found.id}` })
            .eq("id", n.id)
            .then(() => {});
          return true;
        }
      }
      orphanNotifIds.push(n.id);
      return false;
    });

    setNotifications(validNotifs);

    if (orphanNotifIds.length > 0) {
      supabase
        .from("notifications")
        .delete()
        .in("id", orphanNotifIds)
        .then(() => {});
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const [unreadRes, announcementsRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("id, type, title, deep_link")
        .eq("tourist_id", user.id)
        .eq("is_read", false),
      supabase
        .from("announcements")
        .select("id, title")
        .eq("active", true),
    ]);

    const unreads = unreadRes.data ?? [];
    const activeAnnouncements = announcementsRes.data ?? [];
    const activeIds = new Set(activeAnnouncements.map((a) => a.id));
    const activeTitles = new Set(activeAnnouncements.map((a) => a.title.trim()));

    const validUnreads = unreads.filter((n) => {
      if (n.type !== "announcement_published") return true;
      const match = n.deep_link?.match(/^\/announcement\/(.+)$/);
      if (match && match[1]) {
        return activeIds.has(match[1]);
      }
      return activeTitles.has(n.title.trim());
    });

    setUnreadCount(validUnreads.length);
  }, [user]);
  fetchNotifsRef.current = { fetchNotifications, fetchUnreadCount };

  const markAllNotificationsRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("tourist_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  const fetchProfile = useCallback(async (userId: string): Promise<boolean> => {
    const seq = ++fetchSeqRef.current;
    const isLatest = () => seq === fetchSeqRef.current;
    let { data } = await supabase
      .from("tourists")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!data) {
      const { data: authUser } = await supabase.auth.getUser();
      const meta = authUser?.user?.user_metadata as Record<string, unknown> | undefined;
      const fullName =
        (meta?.full_name as string | undefined) ||
        (meta?.name as string | undefined) ||
        "Diver";
      const email = authUser?.user?.email || "";
      const { error: insertError } = await supabase
        .from("tourists")
        .insert({ id: userId, email, full_name: fullName });
      if (insertError) console.error("Failed to auto-create tourists row:", insertError);
      const { data: retry } = await supabase
        .from("tourists")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (retry) data = retry;
    }

    if (!isLatest()) return false;

    if (data) setProfile(data);

    const { data: ecoData } = await supabase
      .from("eco_dive_ids")
      .select("*")
      .eq("tourist_id", userId)
      .maybeSingle();
    if (!isLatest()) return false;
    if (ecoData) {
      setEcoId(ecoData);
      if (ecoData.status === "active") {
        // Self-healing synchronization: check if active pass has expired by date
        Promise.resolve(supabase
          .rpc("sync_my_eco_dive_id_status"))
          .then(({ data: syncRes }) => {
            if (syncRes && typeof syncRes === "object" && (syncRes as any).expired) {
              setEcoId((prev) => (prev ? { ...prev, status: "expired" } : prev));
              setProfile((prev) => (prev ? { ...prev, status: "Expired" } : prev));
            }
          })
          .catch(() => {});
      }
    } else {
      // Auto-provisioning safety net: ensures every tourist account has an Eco-Dive ID
      const year = new Date().getFullYear();
      const fallbackNum = `ECO-${year}-${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: createdEco } = await supabase
        .from("eco_dive_ids")
        .insert({
          tourist_id: userId,
          eco_id_number: fallbackNum,
          status: "incomplete",
        })
        .select("*")
        .maybeSingle();
      if (createdEco && isLatest()) {
        setEcoId(createdEco);
      } else {
        setEcoId(null);
      }
    }

    const { data: opApp } = await supabase
      .from("operator_applications")
      .select("*")
      .eq("tourist_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!isLatest()) return false;
    if (opApp) setOperatorApplication(opApp);
    else setOperatorApplication(null);
    if (isLatest()) setRoleReady(true);
    return opApp?.status === "approved";
  }, []);

  const updateProfile = useCallback(async (updates: TouristUpdate) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("tourists")
      .update(updates)
      .eq("id", user.id);
    if (error) return { error: error.message };
    await fetchProfile(user.id);
    return {};
  }, [user, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      currentUserIdRef.current = session?.user?.id ?? null;
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        // Anonymous: nothing to resolve — gates may redirect immediately.
        setRoleReady(true);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const incomingUser = session?.user ?? null;
      setSession(session);
      setUser(incomingUser);
      if (incomingUser) {
        const isIdentityChange = incomingUser.id !== currentUserIdRef.current;
        currentUserIdRef.current = incomingUser.id;

        // Only mark roleReady false if a completely new identity arrived.
        // Same-user token refreshes on window focus must preserve roleReady
        // so active forms and navigation stacks do not unmount.
        if (isIdentityChange) {
          setRoleReady(false);
          setAvatarOverrides({});
        }
        fetchProfile(incomingUser.id);
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("tourist_id", incomingUser.id)
          .eq("is_read", false)
          .then(({ count }) => setUnreadCount(count ?? 0), () => setUnreadCount(0));
      } else {
        // SIGNED_OUT (or expired session): clear role-derived state
        // synchronously so gates never see user=null + isOperator=true stale.
        // Logged-out is a definitive state — mark ready so gates redirect now.
        fetchSeqRef.current += 1;
        currentUserIdRef.current = null;
        setSession(null);
        setUser(null);
        clearLocalAuthState();
        setRoleReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, clearLocalAuthState]);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => {
      fetchNotifications();
      fetchUnreadCount();
    });

    const ecoChannel = supabase
      .channel("eco-dive-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "eco_dive_ids",
          filter: `tourist_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setEcoId(payload.new as EcoDiveIDRow);
            fetchProfile(user.id);
          }
        }
      )
      .subscribe();

    const touristChannel = supabase
      .channel("tourist-profile-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tourists",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setProfile(payload.new as TouristRow);
          }
        }
      )
      .subscribe();

    const notifChannel = supabase
      .channel("notification-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `tourist_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
          fetchUnreadCount();
        }
      )
      .subscribe();

    const opAppChannel = supabase
      .channel("operator-app-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "operator_applications",
          filter: `tourist_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new) {
            const updated = payload.new as OperatorApplicationRow;
            setOperatorApplication(updated);
            if (updated.status === "approved") {
              try {
                const { error } = await supabase.auth.refreshSession();
                if (error) throw error;
                // Role comes from the table row, not JWT claims — re-read it
                // so isOperator flips even if the refresh changed nothing.
                await fetchProfile(updated.tourist_id);
              } catch (e) {
                // Transient refresh failure (HTTP 400 invalid_grant / blip):
                // do NOT log the user out right after approval — just re-read
                // the row; the next focus/restart picks up a fresh session.
                console.warn("Post-approval session refresh failed, re-reading role:", e);
                await fetchProfile(updated.tourist_id);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ecoChannel);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(opAppChannel);
      supabase.removeChannel(touristChannel);
    };
  }, [user, fetchNotifications, fetchUnreadCount, fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    setIsLoading(true);
    setRoleReady(false);
    setAvatarOverrides({});
    try {
      let isOperator = false;
      if (data.user) {
        isOperator = await fetchProfile(data.user.id);
      } else {
        setRoleReady(true);
      }
      return { isOperator };
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      });
      if (error) return { error: error.message };
      if (data.user?.id) {
        markFirstTimeTutorialPending(data.user.id);
        await supabase
          .from("tourists")
          .update({ onboarding_completed: false })
          .eq("id", data.user.id);
      }
      return {};
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signInWithGoogleIdToken = useCallback(
    async (idToken: string, rawNonce?: string) => {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
        ...(rawNonce ? { nonce: rawNonce } : {}),
      });
      if (error) {
        return { error: error.message };
      }
      setIsLoading(true);
      setRoleReady(false);
      try {
        let isOp = false;
        if (data.user) {
          isOp = await fetchProfile(data.user.id);
        } else {
          setRoleReady(true);
        }
        return { isOperator: isOp };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchProfile]
  );

  const signInWithGoogle = useCallback(async () => {
    // Prefer direct Google Identity Services + signInWithIdToken when
    // EXPO_PUBLIC_GOOGLE_CLIENT_ID is configured so Google displays "SINSAY"
    // instead of the .supabase.co callback domain.
    if (isGoogleGisConfigured) {
      const gisResult = await triggerGoogleGisSignIn();
      if (gisResult.cancelled) {
        return {};
      }
      if (gisResult.error) {
        return { error: gisResult.error };
      }
      if (gisResult.idToken) {
        return await signInWithGoogleIdToken(
          gisResult.idToken,
          gisResult.rawNonce
        );
      }
    }

    // Fallback: Web PWA full-page redirect to /auth/callback when
    // EXPO_PUBLIC_GOOGLE_CLIENT_ID is not yet configured.
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) return { error: error.message };
    return {};
  }, [signInWithGoogleIdToken]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      ...(redirectTo ? { redirectTo } : {}),
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return {};
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        ecoId,
        operatorApplication,
        isOperator,
        avatarUri,
        setAvatarUri,
        clearAvatarOverride,
        viewAsTourist,
        setViewAsTourist,
        isLoading,
        roleReady,
        unreadCount,
        notifications,
        fetchNotifications,
        markAllNotificationsRead,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGoogleIdToken,
        signOut,
        requestPasswordReset,
        updatePassword,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
