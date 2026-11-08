import { supabase } from "./supabase";
import { TouristRow } from "../types/supabase";

const STORAGE_PREFIX = "sinsay_onboarding_completed_";

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
