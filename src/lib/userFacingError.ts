export function getUserFacingError(
  error: unknown,
  fallback = "We couldn’t complete that. Please try again.",
): string {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("offline")
  ) {
    return "Connection dropped. Check your internet connection and try again.";
  }

  if (message.includes("permission") || message.includes("not authorized")) {
    return "You don’t have permission to do that. Please check your account and try again.";
  }

  return fallback;
}
