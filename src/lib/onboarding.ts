import { supabase } from "./supabase";
import { TouristRow } from "../types/supabase";

const STORAGE_PREFIX = "sinsay_onboarding_completed_";
const FIRST_TIME_TUTORIAL_PENDING_PREFIX =
  "sinsay_first_time_tutorial_pending_";
const FIRST_TIME_OPERATOR_TUTORIAL_PENDING_PREFIX =
  "sinsay_first_time_operator_tutorial_pending_";

const pendingFirstTimeTutorialUsers = new Set<string>();
const pendingFirstTimeOperatorTutorialUsers = new Set<string>();
const tutorialTriggerListeners = new Set<() => void>();
let operatorApprovalModalOpen = false;

export function setOperatorApprovalModalOpen(isOpen: boolean): void {
  operatorApprovalModalOpen = isOpen;
}

export function isOperatorApprovalModalOpen(): boolean {
  return operatorApprovalModalOpen;
}

export function subscribeTutorialTrigger(listener: () => void): () => void {
  tutorialTriggerListeners.add(listener);
  return () => {
    tutorialTriggerListeners.delete(listener);
  };
}

export function notifyTutorialTrigger(): void {
  tutorialTriggerListeners.forEach((listener) => {
    try {
      listener();
    } catch {}
  });
}

export function markFirstTimeTutorialPending(userId?: string | null): void {
  if (!userId) return;
  pendingFirstTimeTutorialUsers.add(userId);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(
        FIRST_TIME_TUTORIAL_PENDING_PREFIX + userId,
        "true",
      );
    } catch {}
  }
  notifyTutorialTrigger();
}

export function isFirstTimeTutorialPending(userId?: string | null): boolean {
  if (!userId) return false;
  if (pendingFirstTimeTutorialUsers.has(userId)) return true;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return (
        window.localStorage.getItem(
          FIRST_TIME_TUTORIAL_PENDING_PREFIX + userId,
        ) === "true"
      );
    } catch {
      return false;
    }
  }
  return false;
}

export function clearFirstTimeTutorialPending(userId?: string | null): void {
  if (!userId) return;
  pendingFirstTimeTutorialUsers.delete(userId);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(
        FIRST_TIME_TUTORIAL_PENDING_PREFIX + userId,
      );
    } catch {}
  }
}

export function markFirstTimeOperatorTutorialPending(
  userId?: string | null,
): void {
  if (!userId) return;
  pendingFirstTimeOperatorTutorialUsers.add(userId);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(
        FIRST_TIME_OPERATOR_TUTORIAL_PENDING_PREFIX + userId,
        "true",
      );
    } catch {}
  }
}

export function isFirstTimeOperatorTutorialPending(
  userId?: string | null,
): boolean {
  if (!userId) return false;
  if (pendingFirstTimeOperatorTutorialUsers.has(userId)) return true;
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return (
        window.localStorage.getItem(
          FIRST_TIME_OPERATOR_TUTORIAL_PENDING_PREFIX + userId,
        ) === "true"
      );
    } catch {
      return false;
    }
  }
  return false;
}

export function clearFirstTimeOperatorTutorialPending(
  userId?: string | null,
): void {
  if (!userId) return;
  pendingFirstTimeOperatorTutorialUsers.delete(userId);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(
        FIRST_TIME_OPERATOR_TUTORIAL_PENDING_PREFIX + userId,
      );
    } catch {}
  }
}

export function hasUserCompletedOnboarding(
  userId?: string | null,
  profile?: TouristRow | null
): boolean {
  if (!userId) return false;

  // 1. Check profile from database
  if (profile?.onboarding_completed === true) {
    return true;
  }

  // 2. Check local storage cache
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      if (window.localStorage.getItem(STORAGE_PREFIX + userId) === "true") {
        return true;
      }
    } catch {}
  }

  return false;
}

export async function markUserOnboardingCompleted(
  userId: string
): Promise<void> {
  if (!userId) return;

  // Queue the one-time in-app tutorial for this newly onboarded account
  markFirstTimeTutorialPending(userId);

  // 1. Immediately cache in localStorage for instant offline checks
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + userId, "true");
    } catch {}
  }

  // 2. Persist to database
  try {
    await supabase
      .from("tourists")
      .update({ onboarding_completed: true })
      .eq("id", userId);
  } catch (err) {
    console.error("Failed to persist onboarding status:", err);
  }
}
