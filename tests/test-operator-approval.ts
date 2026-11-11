import {
  getOperatorApprovalMessage,
  getOperatorApprovalSeenKey,
  shouldShowOperatorApprovalModal,
} from "../src/lib/operatorApproval.js";

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
    getOperatorApprovalSeenKey("app-1234"),
    "@sinsay_operator_approved_seen_app-1234"
  );
  assertEqual(
    getOperatorApprovalSeenKey("  app-trim  "),
    "@sinsay_operator_approved_seen_app-trim"
  );
});

// 2. Decision logic when approved and not yet acknowledged
check("shows modal when application is approved and unacknowledged", () => {
  const result = shouldShowOperatorApprovalModal({
    applicationId: "app-abc-1",
    applicationStatus: "approved",
    isAcknowledged: false,
  });
  assertEqual(result, true);
});

check("supports case-insensitive status 'Approved'", () => {
  const result = shouldShowOperatorApprovalModal({
    applicationId: "app-abc-2",
    applicationStatus: "Approved",
    isAcknowledged: false,
  });
  assertEqual(result, true);
});

// 3. Suppression when already acknowledged
check("suppresses modal when application was already acknowledged", () => {
  const result = shouldShowOperatorApprovalModal({
    applicationId: "app-abc-1",
    applicationStatus: "approved",
    isAcknowledged: true,
  });
  assertEqual(result, false);
});

// 4. Suppression for non-approved statuses
check("suppresses modal when application is pending", () => {
  const result = shouldShowOperatorApprovalModal({
    applicationId: "app-abc-3",
    applicationStatus: "pending",
    isAcknowledged: false,
  });
  assertEqual(result, false);
});

check("suppresses modal when application is rejected", () => {
  const result = shouldShowOperatorApprovalModal({
    applicationId: "app-abc-4",
    applicationStatus: "rejected",
    isAcknowledged: false,
  });
  assertEqual(result, false);
});

// 5. Suppression on missing or empty params
check("suppresses modal when application ID is missing or empty", () => {
  assertEqual(
    shouldShowOperatorApprovalModal({
      applicationId: null,
      applicationStatus: "approved",
      isAcknowledged: false,
    }),
    false
  );
  assertEqual(
    shouldShowOperatorApprovalModal({
      applicationId: "",
      applicationStatus: "approved",
      isAcknowledged: false,
    }),
    false
  );
});

// 6. Message generation
check("generates friendly approval message with resort name", () => {
  const msg = getOperatorApprovalMessage("Arthur's Place Dive Resort");
  if (!msg.includes("Arthur's Place Dive Resort")) {
    throw new Error("Message missing resort name");
  }
  if (!msg.includes("manage dive manifests")) {
    throw new Error("Message missing manifest capability");
  }
});

check("handles fallback resort name cleanly", () => {
  const msg = getOperatorApprovalMessage(null);
  if (!msg.includes("your establishment")) {
    throw new Error("Message missing fallback name");
  }
});

if (failures > 0) {
  throw new Error(`${failures} operator approval test(s) failed`);
}
console.log("all operator approval tests passed");
