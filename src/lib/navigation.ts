import { useRouter } from "expo-router";

export type AppRouter = ReturnType<typeof useRouter>;

/**
 * Safely navigates back if a previous route exists in the navigation stack,
 * otherwise falls back to the specified route to avoid unhandled GO_BACK warnings
 * and prevent users from getting stuck when deep-linking or refreshing a page.
 */
export function safeBack(router: AppRouter, fallbackPath: string = "/"): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackPath as any);
  }
}
