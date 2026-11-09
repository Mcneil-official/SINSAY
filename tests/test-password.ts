import {
  checkPasswordRules,
  isValidEmail,
  validateNewPassword,
  validatePasswordForSignup,
} from "../src/lib/password";

// Zero-dependency unit tests: compiled with tsc, run with plain node.
// No node: imports (no @types/node in the repo) — failures throw at the
// end, producing a non-zero exit code.

let failures = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failures += 1;
    console.error(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`);
  }
}

function assertEqual(actual: unknown, expected: unknown) {
  if (
    typeof actual === "object" &&
    actual !== null &&
    typeof expected === "object" &&
    expected !== null
  ) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    return;
  }
  if (actual !== expected) {
    throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// --- email ---
check("accepts a normal email", () => assertEqual(isValidEmail("juan@gmail.com"), true));
check("trims surrounding spaces", () => assertEqual(isValidEmail("  juan@gmail.com  "), true));
check("rejects missing @", () => assertEqual(isValidEmail("juangmail.com"), false));
check("rejects missing domain", () => assertEqual(isValidEmail("juan@"), false));
check("rejects empty", () => assertEqual(isValidEmail(""), false));
check("rejects spaces inside", () => assertEqual(isValidEmail("ju an@gmail.com"), false));

// --- password complexity rules check (checkPasswordRules) ---
check("evaluates rule accomplishment accurately", () => {
  // Empty
  assertEqual(checkPasswordRules(""), {
    hasMinLength: false,
    hasUppercase: false,
    hasNumber: false,
    isValid: false,
  });
  // Length only
  assertEqual(checkPasswordRules("abcdefgh"), {
    hasMinLength: true,
    hasUppercase: false,
    hasNumber: false,
    isValid: false,
  });
  // Length + Uppercase, missing number
  assertEqual(checkPasswordRules("Abcdefgh"), {
    hasMinLength: true,
    hasUppercase: true,
    hasNumber: false,
    isValid: false,
  });
  // Length + Number, missing uppercase
  assertEqual(checkPasswordRules("abcdefg1"), {
    hasMinLength: true,
    hasUppercase: false,
    hasNumber: true,
    isValid: false,
  });
  // All 3 satisfied: 8+ chars, uppercase, number
  assertEqual(checkPasswordRules("Sinsay2026"), {
    hasMinLength: true,
    hasUppercase: true,
    hasNumber: true,
    isValid: true,
  });
});

// --- signup password validation (validatePasswordForSignup) ---
check("signup rejects password shorter than 8 chars", () => {
  assertEqual(validatePasswordForSignup("Pass1"), "Min. 8 characters");
});

check("signup rejects password missing capital letter", () => {
  assertEqual(validatePasswordForSignup("sinsay2026"), "Must include 1 capital letter (A-Z)");
});

check("signup rejects password missing number", () => {
  assertEqual(validatePasswordForSignup("SinsayPassword"), "Must include 1 number (0-9)");
});

check("signup accepts valid password meeting all 3 criteria", () => {
  assertEqual(validatePasswordForSignup("Sinsay2026"), null);
});

// --- new password reset validation (validateNewPassword) ---
check("accepts compliant 8+ chars with uppercase, number and match", () =>
  assertEqual(validateNewPassword("Sinsay01", "Sinsay01"), null)
);
check("rejects empty password", () =>
  assertEqual(validateNewPassword("", ""), "Please enter a new password.")
);
check("rejects short password", () =>
  assertEqual(
    validateNewPassword("Ab1", "Ab1"),
    "Password must be at least 8 characters."
  )
);
check("rejects missing uppercase in reset", () =>
  assertEqual(
    validateNewPassword("sinsay01", "sinsay01"),
    "Password must include at least 1 capital letter."
  )
);
check("rejects missing number in reset", () =>
  assertEqual(
    validateNewPassword("SinsayPassword", "SinsayPassword"),
    "Password must include at least 1 number."
  )
);
check("rejects missing confirmation", () =>
  assertEqual(validateNewPassword("Sinsay01", ""), "Please confirm your new password.")
);
check("rejects mismatch", () =>
  assertEqual(validateNewPassword("Sinsay01", "Sinsay02"), "Passwords do not match.")
);

if (failures > 0) {
  throw new Error(`${failures} test(s) failed`);
}
console.log("all password tests passed");
