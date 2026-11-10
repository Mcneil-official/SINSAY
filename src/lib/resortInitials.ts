/**
 * Generates clean, consistent 2-letter resort initials for branding and avatar badges
 * when an official logo image is not provided.
 */
export function getResortInitials(name: string): string {
  if (!name) return "";
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => !["and", "&", "the", "of"].includes(w.toLowerCase()));

  if (words.length === 0) return "";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}
