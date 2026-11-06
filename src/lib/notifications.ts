export function resolveNotificationRoute(
  notif: {
    type: string;
    title?: string;
    deep_link?: string | null;
  },
  activeAnnouncements?: { id: string; title: string }[]
): string {
  if (notif.deep_link && notif.deep_link !== "/(tabs)") {
    return notif.deep_link;
  }
  switch (notif.type) {
    case "eco_dive_activated":
      return "/(tabs)/eco-dive-id/complete";
    case "announcement_published": {
      // 1. If active announcements provided, find matching ID by title
      if (activeAnnouncements && notif.title) {
        const match = activeAnnouncements.find(
          (a) => a.title.trim().toLowerCase() === notif.title!.trim().toLowerCase()
        );
        if (match) return `/announcement/${match.id}`;
      }
      // 2. If no direct match in memory, pass the title as route param for dynamic lookup
      if (notif.title && notif.title.trim()) {
        return `/announcement/${encodeURIComponent(notif.title.trim())}`;
      }
      return "/announcement/default-conservation";
    }
    case "dive_plan_ready":
      return "/(tabs)/dive-assistant/planner";
    case "operator_application_approved":
      return "/(operator-tabs)";
    case "operator_application_rejected":
      return "/(tabs)/profile/apply-operator";
    case "pass_purchase_verified":
      return "/(operator-tabs)/buy-pass";
    case "manifest_submitted":
      return "/(operator-tabs)/manifests";
    default:
      return "/(tabs)";
  }
}
