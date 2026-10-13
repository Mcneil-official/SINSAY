// Shared dive-date helpers (UTC-safe).
// dive_date is a Postgres DATE -> PostGIS "YYYY-MM-DD". new Date("YYYY-MM-DD")
// parses as UTC midnight, which shifts a day back on UTC-negative devices.
// Always split into local parts instead.

export type StatusDerived = "active" | "done";

function parseLocalDate(diveDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(diveDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function deriveStatus(diveDate: string): StatusDerived {
  const dd = parseLocalDate(diveDate);
  if (!dd) return "active";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dd.setHours(0, 0, 0, 0);
  return dd < today ? "done" : "active";
}

export function formatDiveDate(diveDate: string): string {
  const dd = parseLocalDate(diveDate);
  if (!dd) return "—";
  return dd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
