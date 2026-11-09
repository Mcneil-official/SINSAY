import { deriveEffectiveEcoStatus, isPassExpired, parseLocalDate } from "../src/lib/ecoIdExpiry";

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

// Fixed reference date: 2026-11-09T10:00:00
const nov9 = new Date(2026, 10, 9, 10, 0, 0);

// 1. One-Day Tourist Dive Pass on same day
check("one-day pass active on the manifest dive date", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "active",
      passType: "one-day",
      latestManifestDiveDate: "2026-11-09",
      referenceDate: nov9,
    }),
    "active"
  );
  assertEqual(
    isPassExpired({
      dbStatus: "active",
      passType: "one-day",
      latestManifestDiveDate: "2026-11-09",
      referenceDate: nov9,
    }),
    false
  );
});

// 2. One-Day Tourist Dive Pass created for yesterday (Nov 8) evaluated on Nov 9
check("one-day pass expired when manifest dive date was yesterday", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "active",
      passType: "one-day",
      latestManifestDiveDate: "2026-11-08",
      referenceDate: nov9,
    }),
    "expired"
  );
  assertEqual(
    isPassExpired({
      dbStatus: "active",
      passType: "one-day",
      latestManifestDiveDate: "2026-11-08",
      referenceDate: nov9,
    }),
    true
  );
});

// 3. Annual Pass valid for 1 year
check("annual pass active while within valid_until", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "active",
      passType: "annual",
      annualValidUntil: "2027-11-08",
      referenceDate: nov9,
    }),
    "active"
  );
});

// 4. Annual Pass expired past valid_until
check("annual pass expired when valid_until is past", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "active",
      passType: "annual",
      annualValidUntil: "2026-11-08",
      referenceDate: nov9,
    }),
    "expired"
  );
});

// 5. Incomplete or Complete statuses preserved
check("incomplete status preserved", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "incomplete",
      referenceDate: nov9,
    }),
    "incomplete"
  );
});

check("complete status preserved", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "complete",
      referenceDate: nov9,
    }),
    "complete"
  );
});

// 6. DB status already expired preserved
check("already expired status preserved", () => {
  assertEqual(
    deriveEffectiveEcoStatus({
      dbStatus: "expired",
      referenceDate: nov9,
    }),
    "expired"
  );
});

if (failures > 0) {
  throw new Error(`${failures} eco-dive expiry test(s) failed`);
}
console.log("all eco-dive expiry tests passed");
