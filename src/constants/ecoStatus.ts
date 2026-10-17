// Canonical Eco-Dive ID statuses (system design).
// Single source of truth for labels + badge variants + tracker order.

export type EcoStatus = "incomplete" | "complete" | "active" | "expired";

export type EcoStatusVariant = "incomplete" | "ready" | "active" | "expired";

export const ECO_STATUS_LIFECYCLE: { status: EcoStatus; label: string }[] = [
  { status: "incomplete", label: "Not Ready" },
  { status: "complete", label: "Ready" },
  { status: "active", label: "Active" },
  { status: "expired", label: "Expired" },
];

const LABELS: Record<EcoStatus, string> = {
  incomplete: "Not Ready",
  complete: "Ready",
  active: "Active",
  expired: "Expired",
};

export function ecoStatusLabel(status: string | null | undefined): string {
  if (status && status in LABELS) return LABELS[status as EcoStatus];
  return LABELS.incomplete;
}

export function ecoStatusVariant(
  status: string | null | undefined,
): EcoStatusVariant {
  if (status === "complete") return "ready";
  if (status === "active") return "active";
  if (status === "expired") return "expired";
  return "incomplete";
}

export function ecoStatusIndex(status: string | null | undefined): number {
  const i = ECO_STATUS_LIFECYCLE.findIndex((s) => s.status === status);
  return i === -1 ? 0 : i;
}
