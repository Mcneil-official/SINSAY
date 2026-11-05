import { toLocalPhDigits, toDbPhPhone, isValidPhDigits } from "../src/lib/phone";

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

// --- toLocalPhDigits ---
check("cleans leading 0 from 11-digit mobile", () =>
  assertEqual(toLocalPhDigits("09171234567"), "9171234567")
);
check("cleans +63 prefix with space", () =>
  assertEqual(toLocalPhDigits("+63 9171234567"), "9171234567")
);
check("cleans +63 prefix without space", () =>
  assertEqual(toLocalPhDigits("+639171234567"), "9171234567")
);
check("cleans 63 prefix without plus", () =>
  assertEqual(toLocalPhDigits("639171234567"), "9171234567")
);
check("accepts raw 10 digits starting with 9", () =>
  assertEqual(toLocalPhDigits("9171234567"), "9171234567")
);
check("handles punctuation and formatting dashes/parens", () =>
  assertEqual(toLocalPhDigits("+63 (917) 123-4567"), "9171234567")
);
check("handles empty / null", () => {
  assertEqual(toLocalPhDigits(""), "");
  assertEqual(toLocalPhDigits(null), "");
  assertEqual(toLocalPhDigits(undefined), "");
});

// --- toDbPhPhone ---
check("formats local digits to canonical DB format", () =>
  assertEqual(toDbPhPhone("9171234567"), "+63 9171234567")
);
check("formats uncleaned input to canonical DB format", () =>
  assertEqual(toDbPhPhone("09171234567"), "+63 9171234567")
);
check("returns null on empty input", () => {
  assertEqual(toDbPhPhone(""), null);
  assertEqual(toDbPhPhone(null), null);
});

// --- isValidPhDigits ---
check("accepts valid 10 digits starting with 9", () =>
  assertEqual(isValidPhDigits("9171234567"), true)
);
check("rejects 11 digits (e.g. still has 0)", () =>
  assertEqual(isValidPhDigits("09171234567"), false)
);
check("rejects numbers starting with digits other than 9", () => {
  assertEqual(isValidPhDigits("8171234567"), false);
  assertEqual(isValidPhDigits("2171234567"), false);
});
check("rejects short or long numbers", () => {
  assertEqual(isValidPhDigits("917123456"), false);
  assertEqual(isValidPhDigits("91712345678"), false);
});
check("rejects empty or whitespace", () => {
  assertEqual(isValidPhDigits(""), false);
  assertEqual(isValidPhDigits("   "), false);
});

if (failures > 0) {
  throw new Error(`${failures} phone test(s) failed`);
}
console.log("all phone tests passed");
