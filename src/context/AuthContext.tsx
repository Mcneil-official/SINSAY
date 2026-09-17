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
  isLoading: boolean;
  unreadCount: number;
  notifications: NotificationRow[];
  fetchNotifications: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error?: string; isOperator?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
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
  isLoading: true,
  unreadCount: 0,
  notifications: [],
  fetchNotifications: async () => {},
  markAllNotificationsRead: async () => {},
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
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
  const [isLoading, setIsLoading] = useState(true);
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
    setNotifications([]);
    setUnreadCount(0);
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
    await supabase.auth.signOut();
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
      const fullName = authUser?.user?.user_metadata?.full_name || "Diver";
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
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
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
        fetchSeqRef.current += 1;
        setSession(null);
        setUser(null);
        clearLocalAuthState();
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
              } catch (e) {
                // Stale/rotated refresh token (HTTP 400 invalid_grant):
                // purge the poisoned stored session so gates route cleanly
                // to /loginpage instead of retrying a dead token.
                console.warn("Post-approval session refresh failed, signing out:", e);
                await signOut();
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
  }, [user, fetchNotifications, fetchUnreadCount, signOut]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      let isOperator = false;
      if (data.user) {
        isOperator = await fetchProfile(data.user.id);
      }
      return { isOperator };
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        ecoId,
        operatorApplication,
        isOperator,
        isLoading,
        unreadCount,
        notifications,
        fetchNotifications,
        markAllNotificationsRead,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
