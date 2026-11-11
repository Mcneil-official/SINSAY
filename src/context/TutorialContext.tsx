import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../hooks/useAuth";
import {
  clearFirstTimeOperatorTutorialPending,
  clearFirstTimeTutorialPending,
  isFirstTimeOperatorTutorialPending,
  isFirstTimeTutorialPending,
  isOperatorApprovalModalOpen,
  subscribeTutorialTrigger,
} from "../lib/onboarding";
import { supabase } from "../lib/supabase";

export type TutorialRole = "tourist" | "operator";

const TUTORIAL_ROLE_STORAGE_PREFIX = "@sinsay_tutorial_v3_";

const shownTutorialKeys = new Set<string>();

export interface TutorialContextType {
  isTutorialActive: boolean;
  hasCompletedTutorial: boolean;
  startTutorial: () => void;
  dismissTutorial: () => void;
  resetTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

function getStorageKey(role: TutorialRole, userId: string): string {
  return `${TUTORIAL_ROLE_STORAGE_PREFIX}${role}_${userId}`;
}

function getMetaKey(role: TutorialRole): string {
  return role === "operator"
    ? "operator_tutorial_completed"
    : "tourist_tutorial_completed";
}

function checkCompletedSync(
  role: TutorialRole,
  userId?: string | null,
  userMetadata?: Record<string, unknown>,
): boolean {
  if (!userId) return false;
  const memKey = `${role}:${userId}`;
  if (shownTutorialKeys.has(memKey)) {
    return true;
  }
  const metaKey = getMetaKey(role);
  if (userMetadata?.[metaKey] === true) {
    shownTutorialKeys.add(memKey);
    return true;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const storageKey = getStorageKey(role, userId);
      if (window.localStorage.getItem(storageKey) === "true") {
        shownTutorialKeys.add(memKey);
        return true;
      }
    } catch {
      return false;
    }
  }
  return false;
}

function persistCompletedForUser(
  role: TutorialRole,
  userId?: string | null,
  syncRemote = true,
): void {
  if (!userId) return;
  const memKey = `${role}:${userId}`;
  shownTutorialKeys.add(memKey);
  if (role === "operator") {
    clearFirstTimeOperatorTutorialPending(userId);
  } else {
    clearFirstTimeTutorialPending(userId);
  }

  const storageKey = getStorageKey(role, userId);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(storageKey, "true");
    } catch {}
  }
  AsyncStorage.setItem(storageKey, "true").catch(() => {});

  if (syncRemote) {
    const metaKey = getMetaKey(role);
    supabase.auth
      .updateUser({
        data: { [metaKey]: true },
      })
      .catch(() => {});
  }
}

export function TutorialProvider({
  children,
  autoPrompt = true,
  role = "tourist",
}: {
  children: React.ReactNode;
  autoPrompt?: boolean;
  role?: TutorialRole;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const userMetaRef = useRef<Record<string, unknown> | undefined>(
    user?.user_metadata as Record<string, unknown> | undefined,
  );
  userMetaRef.current = user?.user_metadata as
    | Record<string, unknown>
    | undefined;

  const [hasCompleted, setHasCompleted] = useState<boolean>(() =>
    checkCompletedSync(role, userId, userMetaRef.current),
  );
  const [isTutorialActive, setIsTutorialActive] = useState<boolean>(false);
  const [triggerTick, setTriggerTick] = useState(0);

  useEffect(() => {
    return subscribeTutorialTrigger(() => {
      setTriggerTick((t) => t + 1);
    });
  }, []);

  // Auto-prompt once after first-time tourist onboarding or first-time operator approval
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const evaluateTutorial = async () => {
      const isPending =
        role === "operator"
          ? isFirstTimeOperatorTutorialPending(userId)
          : isFirstTimeTutorialPending(userId);

      // While OperatorApprovalModal is still open on screen, wait until the user closes it
      if (role === "operator" && isOperatorApprovalModalOpen()) {
        return;
      }

      const syncDone = checkCompletedSync(role, userId, userMetaRef.current);
      if (syncDone && !isPending) {
        if (!cancelled) setHasCompleted(true);
        return;
      }

      if (!isPending) {
        try {
          const storageKey = getStorageKey(role, userId);
          const asyncVal = await AsyncStorage.getItem(storageKey);
          if (cancelled) return;
          if (asyncVal === "true") {
            shownTutorialKeys.add(`${role}:${userId}`);
            setHasCompleted(true);
            return;
          }
        } catch {}
        return;
      }

      if (autoPrompt && isPending) {
        timer = setTimeout(() => {
          if (!cancelled) {
            // Mark completed locally & remotely only once the tutorial actually opens
            persistCompletedForUser(role, userId, true);
            setHasCompleted(true);
            setIsTutorialActive(true);
          }
        }, 650);
      }
    };

    void evaluateTutorial();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [autoPrompt, role, userId, triggerTick]);

  const startTutorial = useCallback(() => {
    setIsTutorialActive(true);
  }, []);

  const dismissTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setHasCompleted(true);
    persistCompletedForUser(role, userId, true);
  }, [role, userId]);

  const resetTutorial = useCallback(() => {
    if (userId) {
      const memKey = `${role}:${userId}`;
      const storageKey = getStorageKey(role, userId);
      shownTutorialKeys.delete(memKey);
      AsyncStorage.removeItem(storageKey).catch(() => {});
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          window.localStorage.removeItem(storageKey);
        } catch {}
      }
    }
    setHasCompleted(false);
    setIsTutorialActive(true);
  }, [role, userId]);

  return (
    <TutorialContext.Provider
      value={{
        isTutorialActive,
        hasCompletedTutorial: hasCompleted,
        startTutorial,
        dismissTutorial,
        resetTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
