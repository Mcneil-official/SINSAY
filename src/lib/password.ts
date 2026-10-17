// Pure password/email validators for the reset flow (and reuse anywhere).
// Dependency-free on purpose: unit-tested with tsc + node --test, no runner.

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  const v = email.trim();
  if (!v || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function validateNewPassword(
  password: string,
  confirm: string
): string | null {
  if (!password) return "Please enter a new password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!confirm) return "Please confirm your new password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}
