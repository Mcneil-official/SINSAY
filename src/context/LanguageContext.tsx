import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import {
  DEFAULT_LOCALE,
  LANGUAGE_STORAGE_KEY,
  Locale,
  t as translateKey,
} from "../lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (nextLocale: Locale) => Promise<void>;
  toggleLocale: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { profile, updateProfile, user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);

  // 1. Initialize from AsyncStorage on app mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (stored === "en" || stored === "fil") {
          if (isMounted) setLocaleState(stored);
        }
      } catch (err) {
        console.warn("Failed to load language preference from storage:", err);
      } finally {
        if (isMounted) setHasLoadedStorage(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Synchronize with profile if profile has a preference and storage didn't specify one
  useEffect(() => {
    if (!hasLoadedStorage) return;
    const profilePref = profile?.language_preference as Locale | undefined;
    if (profilePref === "en" || profilePref === "fil") {
      setLocaleState(profilePref);
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, profilePref).catch(() => {});
    }
  }, [profile?.language_preference, hasLoadedStorage]);

  const setLocale = useCallback(
    async (nextLocale: Locale) => {
      if (nextLocale !== "en" && nextLocale !== "fil") return;
      setLocaleState(nextLocale);
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
      } catch (err) {
        console.warn("Failed to persist language preference:", err);
      }

      if (user && updateProfile) {
        try {
          await updateProfile({ language_preference: nextLocale } as any);
        } catch (err) {
          console.warn("Failed to sync language preference to profile:", err);
        }
      }
    },
    [user, updateProfile]
  );

  const toggleLocale = useCallback(async () => {
    const next = locale === "fil" ? "en" : "fil";
    await setLocale(next);
  }, [locale, setLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translateKey(key, locale, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t]
  );

  // Hold the first paint until the stored preference is known so the app
  // never flashes English before switching to the saved locale.
  if (!hasLoadedStorage) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for non-provider renders/testing
    return {
      locale: DEFAULT_LOCALE,
      setLocale: async () => {},
      toggleLocale: async () => {},
      t: (key: string, params?: Record<string, string | number>) =>
        translateKey(key, DEFAULT_LOCALE, params),
    };
  }
  return context;
}
