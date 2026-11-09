// Date-aware expiration utility for SINSAY Eco-Dive IDs.
// Prevents expired One-Day passes from falsely showing "ACTIVE" after the dive date has passed.

export type DerivedEcoStatus = "incomplete" | "complete" | "active" | "expired";

export interface DeriveEcoStatusOptions {
  dbStatus?: string | null;
  passType?: string | null;
  latestManifestDiveDate?: string | null;
  annualValidUntil?: string | null;
  hasActiveManifest?: boolean;
  hasActiveAnnual?: boolean;
  referenceDate?: Date;
}

/**
 * UTC-safe local date parser (avoids 1-day back shift from UTC midnight).
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/**
 * Evaluates the real-time effective status of an Eco-Dive ID.
 */
export function deriveEffectiveEcoStatus(opts: DeriveEcoStatusOptions): DerivedEcoStatus {
  const {
    dbStatus,
    passType,
    latestManifestDiveDate,
    annualValidUntil,
    hasActiveManifest,
    hasActiveAnnual,
    referenceDate = new Date(),
  } = opts;

  // If incomplete, it hasn't reached full registration / readiness
  if (dbStatus === "incomplete") return "incomplete";
  if (dbStatus === "expired") return "expired";
  if (dbStatus === "complete") return "complete";

  // If status is active, verify date coverage
  if (dbStatus === "active") {
    const today = new Date(referenceDate);
    today.setHours(0, 0, 0, 0);

    const isAnnual = passType?.trim().toLowerCase() === "annual";

    if (isAnnual) {
      if (annualValidUntil) {
        const untilDate = parseLocalDate(annualValidUntil);
        if (untilDate) {
          untilDate.setHours(0, 0, 0, 0);
          if (untilDate < today) return "expired";
          return "active";
        }
      }
      if (hasActiveAnnual === false && hasActiveManifest === false) {
        return "expired";
      }
      return "active";
    }

    // One-Day Tourist Dive Pass: valid strictly on the manifest dive_date
    if (latestManifestDiveDate) {
      const diveDate = parseLocalDate(latestManifestDiveDate);
      if (diveDate) {
        diveDate.setHours(0, 0, 0, 0);
        if (diveDate < today) {
          return "expired";
        }
        return "active";
      }
    }

    if (hasActiveManifest === false && hasActiveAnnual === false) {
      return "expired";
    }

    return "active";
  }

  return (dbStatus as DerivedEcoStatus) || "incomplete";
}

/**
 * Quick helper returning true if the pass is effectively expired.
 */
export function isPassExpired(opts: DeriveEcoStatusOptions): boolean {
  return deriveEffectiveEcoStatus(opts) === "expired";
}
