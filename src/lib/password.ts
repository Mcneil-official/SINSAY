// Pure password/email validators for signup, account creation, and reset flows.
// Dependency-free on purpose: unit-tested with tsc + node, no runner.

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: string): boolean {
  const v = email.trim();
  if (!v || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export interface PasswordRulesState {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

/**
 * Checks which of the 3 required password rules are accomplished.
 */
export function checkPasswordRules(password: string): PasswordRulesState {
  const p = password || "";
  const hasMinLength = p.length >= MIN_PASSWORD_LENGTH;
  const hasUppercase = /[A-Z]/.test(p);
  const hasNumber = /[0-9]/.test(p);
  return {
    hasMinLength,
    hasUppercase,
    hasNumber,
    isValid: hasMinLength && hasUppercase && hasNumber,
  };
}

/**
 * Validates password for creating a new account.
 * Returns an actionable error message if invalid, or null if all rules are satisfied.
 */
export function validatePasswordForSignup(password: string): string | null {
  if (!password) return "Enter your password";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Min. ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Must include 1 capital letter (A-Z)";
  }
  if (!/[0-9]/.test(password)) {
    return "Must include 1 number (0-9)";
  }
  return null;
}

export function validateNewPassword(
  password: string,
  confirm: string
): string | null {
  if (!password) return "Please enter a new password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least 1 capital letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include at least 1 number.";
  }
  if (!confirm) return "Please confirm your new password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}
