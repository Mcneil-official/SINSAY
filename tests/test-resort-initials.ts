import { getResortInitials } from "../src/lib/resortInitials";

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

// 1. Two-word names
check("extracts initials from Solitude Acacia Resort", () => {
  assertEqual(getResortInitials("Solitude Acacia Resort"), "SA");
});

check("extracts initials from Arthur's Place Dive Resort", () => {
  assertEqual(getResortInitials("Arthur's Place Dive Resort"), "AP");
});

check("extracts initials from Sea Spring Resort", () => {
  assertEqual(getResortInitials("Sea Spring Resort"), "SS");
});

check("extracts initials from Camp Netanya Resort & Spa", () => {
  assertEqual(getResortInitials("Camp Netanya Resort & Spa"), "CN");
});

check("extracts initials from Eagle Point Beach and Dive Resort", () => {
  assertEqual(getResortInitials("Eagle Point Beach and Dive Resort"), "EP");
});

// 2. Ignores stopwords like "The", "and", "&", "of"
check("ignores 'The' prefix in The Philip Ann Resort", () => {
  assertEqual(getResortInitials("The Philip Ann Resort"), "PA");
});

// 3. Single-word names
check("extracts first two letters from a single word resort name", () => {
  assertEqual(getResortInitials("Solitude"), "SO");
  assertEqual(getResortInitials("Altamare"), "AL");
});

// 4. Edge cases
check("handles empty or whitespace strings cleanly", () => {
  assertEqual(getResortInitials(""), "");
  assertEqual(getResortInitials("   "), "");
});

if (failures > 0) {
  throw new Error(`${failures} resort initials test(s) failed`);
}
console.log("all resort initials tests passed");
