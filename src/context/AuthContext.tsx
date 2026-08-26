import React, { createContext, useEffect, useState, useCallback } from "react";
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
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
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

  const fetchProfile = useCallback(async (userId: string) => {
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

    if (data) setProfile(data);

    const { data: ecoData } = await supabase
      .from("eco_dive_ids")
      .select("*")
      .eq("tourist_id", userId)
      .single();
    if (ecoData) setEcoId(ecoData);
    else setEcoId(null);

    const { data: opApp } = await supabase
      .from("operator_applications")
      .select("*")
      .eq("tourist_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (opApp) setOperatorApplication(opApp);
    else setOperatorApplication(null);
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
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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
              await supabase.auth.refreshSession();
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
  }, [user, fetchNotifications, fetchUnreadCount]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }, []);

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

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
