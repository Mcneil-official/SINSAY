import { isValidEmail, validateNewPassword } from "../src/lib/password";

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

// --- new password (min 8 + confirmation match) ---
check("accepts 8+ chars with match", () =>
  assertEqual(validateNewPassword("sinsay01", "sinsay01"), null)
);
check("rejects empty password", () =>
  assertEqual(validateNewPassword("", ""), "Please enter a new password.")
);
check("rejects short password", () =>
  assertEqual(
    validateNewPassword("abc123", "abc123"),
    "Password must be at least 8 characters."
  )
);
check("rejects missing confirmation", () =>
  assertEqual(validateNewPassword("sinsay01", ""), "Please confirm your new password.")
);
check("rejects mismatch", () =>
  assertEqual(validateNewPassword("sinsay01", "sinsay02"), "Passwords do not match.")
);

if (failures > 0) {
  throw new Error(`${failures} test(s) failed`);
}
console.log("all password tests passed");
