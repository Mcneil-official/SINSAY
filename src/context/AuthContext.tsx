import React, { createContext, useEffect, useRef, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { TouristRow, EcoDiveIDRow, OperatorApplicationRow, NotificationRow, TouristUpdate } from "../types/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: TouristRow | null;
  ecoId: EcoDiveIDRow | null;
  operatorApplication: OperatorApplicationRow | null;
  isOperator: boolean;
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
  // Google OAuth (web PWA): triggers a full-page redirect to Google; the
  // session is picked up by getSession/onAuthStateChange on return and the
  // gates route by role. Never throws — returns { error } (e.g. provider
  // not enabled) when the redirect can't start.
  signInWithGoogle: () => Promise<{ error?: string }>;
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

  const clearLocalAuthState = useCallback(() => {
    setProfile(null);
    setEcoId(null);
    setOperatorApplication(null);
    setViewAsTourist(false);
    setNotifications([]);
    setUnreadCount(0);
    setRoleReady(false);
  }, []);

  const signOut = useCallback(async () => {
    // Clear local state BEFORE awaiting Supabase so gates see a consistent
    // logged-out snapshot immediately; onAuthStateChange else-branch keeps
    // this idempotent. Navigation is gate-owned (no router here).
    // Declared above the subscription effects: the operator-app channel
    // calls it on refresh failure, so it must be initialized before the
    // effect dependency arrays are evaluated (TDZ).
    fetchSeqRef.current += 1;
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

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("tourist_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("tourist_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count ?? 0);
  }, [user]);

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
      .single();

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
        .single();
      if (retry) data = retry;
    }

    if (!isLatest()) return false;

    if (data) setProfile(data);

    const { data: ecoData } = await supabase
      .from("eco_dive_ids")
      .select("*")
      .eq("tourist_id", userId)
      .single();
    if (!isLatest()) return false;
    if (ecoData) setEcoId(ecoData);
    else setEcoId(null);

    const { data: opApp } = await supabase
      .from("operator_applications")
      .select("*")
      .eq("tourist_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
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
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        // Anonymous: nothing to resolve — gates may redirect immediately.
        setRoleReady(true);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // New identity arriving: role is stale until fetchProfile lands.
        setRoleReady(false);
        fetchProfile(session.user.id);
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("tourist_id", session.user.id)
          .eq("is_read", false)
          .then(({ count }) => setUnreadCount(count ?? 0));
      } else {
        // SIGNED_OUT (or expired session): clear role-derived state
        // synchronously so gates never see user=null + isOperator=true stale.
        // Logged-out is a definitive state — mark ready so gates redirect now.
        fetchSeqRef.current += 1;
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
    fetchNotifications();
    fetchUnreadCount();

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
          if (payload.new) setEcoId(payload.new as EcoDiveIDRow);
        }
      )
      .subscribe();

    const notifChannel = supabase
      .channel("notification-inserts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
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
    };
  }, [user, fetchNotifications, fetchUnreadCount, fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setRoleReady(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Failed login: nothing is resolving — unblock gates immediately.
        setRoleReady(true);
        return { error: error.message };
      }
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          ...(emailRedirectTo ? { emailRedirectTo } : {}),
        },
      });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signInWithGoogle = useCallback(async () => {
    // Web PWA: full-page redirect to /auth/callback; this promise only
    // resolves when the redirect can't start (otherwise the page navigates
    // away). The callback URL must be allowlisted in Supabase Auth → URL
    // Configuration.
    const redirectTo =
      typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : undefined,
    });
    if (error) return { error: error.message };
    return {};
  }, []);

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
