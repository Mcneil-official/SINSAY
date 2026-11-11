export interface FilterableOption {
  label: string;
  value: string;
  subtitle?: string;
  badge?: string;
}

export type FilterableSite = FilterableOption;

/**
 * Filters combobox options in real time by query string.
 * Performs case-insensitive matching across value, label, subtitle, and badge.
 */
export function filterComboboxOptions<T extends FilterableOption>(
  options: T[],
  query: string
): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((opt) => {
    const valMatch = opt.value.toLowerCase().includes(normalized);
    const labelMatch = opt.label.toLowerCase().includes(normalized);
    const subMatch = Boolean(opt.subtitle?.toLowerCase().includes(normalized));
    const badgeMatch = Boolean(opt.badge?.toLowerCase().includes(normalized));
    return valMatch || labelMatch || subMatch || badgeMatch;
  });
}

/**
 * Backwards-compatible alias for dive sites.
 */
export const filterDiveSites = filterComboboxOptions;

/**
 * Checks if a typed value matches any recognized option (by value or label).
 */
export function isRecognizedOption(
  options: FilterableOption[],
  candidate: string
): boolean {
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return false;
  return options.some(
    (s) =>
      s.value.toLowerCase() === normalized ||
      s.label.toLowerCase() === normalized
  );
}

/**
 * Backwards-compatible alias for dive sites.
 */
export const isRecognizedDiveSite = isRecognizedOption;

/**
 * Resolves the effective value to save on the manifest.
 * Allows custom names if not on the recognized list.
 */
export function resolveEffectiveComboboxValue(
  typedValue: string,
  selectedOptionValue?: string
): string {
  if (selectedOptionValue && selectedOptionValue.trim()) {
    return selectedOptionValue.trim();
  }
  return typedValue.trim();
}

/**
 * Backwards-compatible alias for dive sites.
 */
export const resolveEffectiveDiveLocation = resolveEffectiveComboboxValue;

