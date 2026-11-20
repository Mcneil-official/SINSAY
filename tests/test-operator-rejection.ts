import {
  getOperatorRejectionMessage,
  getOperatorRejectionSeenKey,
  shouldShowOperatorRejectionModal,
} from "../src/lib/operatorRejection.js";

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
    throw new Error(
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

// 1. Storage key formatting
check("generates canonical seen storage key with app ID", () => {
  assertEqual(
    getOperatorRejectionSeenKey("app-1234"),
    "@sinsay_operator_rejected_seen_app-1234"
  );
  assertEqual(
    getOperatorRejectionSeenKey("  app-trim  "),
    "@sinsay_operator_rejected_seen_app-trim"
  );
});

// 2. Decision logic when rejected and not yet acknowledged
check("shows modal when application is rejected and unacknowledged", () => {
  const result = shouldShowOperatorRejectionModal({
    applicationId: "app-abc-1",
    applicationStatus: "rejected",
    isAcknowledged: false,
  });
  assertEqual(result, true);
});

check("supports case-insensitive status 'Rejected'", () => {
  const result = shouldShowOperatorRejectionModal({
    applicationId: "app-abc-2",
    applicationStatus: "Rejected",
    isAcknowledged: false,
  });
  assertEqual(result, true);
});

// 3. Suppression when already acknowledged
check("suppresses modal when application was already acknowledged", () => {
  const result = shouldShowOperatorRejectionModal({
    applicationId: "app-abc-3",
    applicationStatus: "rejected",
    isAcknowledged: true,
  });
  assertEqual(result, false);
});

// 4. Suppression for non-rejected statuses
check("does not show modal when status is pending", () => {
  const result = shouldShowOperatorRejectionModal({
    applicationId: "app-abc-4",
    applicationStatus: "pending",
    isAcknowledged: false,
  });
  assertEqual(result, false);
});

check("does not show modal when status is approved", () => {
  const result = shouldShowOperatorRejectionModal({
    applicationId: "app-abc-5",
    applicationStatus: "approved",
    isAcknowledged: false,
  });
  assertEqual(result, false);
});

check("handles null or missing application ID / status gracefully", () => {
  assertEqual(
    shouldShowOperatorRejectionModal({
      applicationId: null,
      applicationStatus: "rejected",
      isAcknowledged: false,
    }),
    false
  );
  assertEqual(
    shouldShowOperatorRejectionModal({
      applicationId: "app-abc-6",
      applicationStatus: null,
      isAcknowledged: false,
    }),
    false
  );
});

// 5. Rejection message format
check("generates custom message using establishment name", () => {
  assertEqual(
    getOperatorRejectionMessage("Anilao Reef Divers"),
    "Your application to register Anilao Reef Divers as a dive establishment was not approved by the Tourism Office."
  );
});

check("falls back to generic label when establishment name is blank", () => {
  assertEqual(
    getOperatorRejectionMessage("   "),
    "Your application to register your establishment as a dive establishment was not approved by the Tourism Office."
  );
  assertEqual(
    getOperatorRejectionMessage(null),
    "Your application to register your establishment as a dive establishment was not approved by the Tourism Office."
  );
});

if (failures > 0) {
  process.exit(1);
}
