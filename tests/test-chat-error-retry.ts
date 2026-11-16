import {
  buildSanitizedChatHistory,
  ChatMessageItem,
  classifyChatError,
  consumeRetryTarget,
} from "../src/lib/chatRetry";

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
      throw new Error(
        `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
    return;
  }
  if (actual !== expected) {
    throw new Error(
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

console.log("Running AI Chat Error Bubble & Retry unit tests...");

check("classifies browser offline state as network error", () => {
  const res = classifyChatError(new Error("The dive assistant is unavailable"), true);
  assertEqual(res.kind, "network");
  assertEqual(res.title, "Network Connection Lost");
});

check("classifies Failed to fetch / FunctionsFetchError as network error", () => {
  const res1 = classifyChatError(new TypeError("Failed to fetch"), false);
  assertEqual(res1.kind, "network");
  assertEqual(res1.title, "Network Connection Lost");

  const res2 = classifyChatError(
    new Error("FunctionsFetchError: Failed to send a request to the Edge Function"),
    false
  );
  assertEqual(res2.kind, "network");
});

check("classifies 429 rate limit errors as rate_limit", () => {
  const res = classifyChatError(
    new Error("Too many requests right now. Try again in a minute."),
    false
  );
  assertEqual(res.kind, "rate_limit");
  assertEqual(res.title, "Busy Right Now");
});

check("classifies AI service / backend errors as service error", () => {
  const res = classifyChatError(
    new Error("The dive assistant is unavailable right now. Please try again."),
    false
  );
  assertEqual(res.kind, "service");
  assertEqual(res.title, "AI Service Unavailable");
  assertEqual(
    res.message,
    "The dive assistant is unavailable right now. Please try again."
  );
});

check("buildSanitizedChatHistory strips failed user messages and error bubbles", () => {
  const messages: ChatMessageItem[] = [
    {
      id: "0",
      role: "assistant",
      text: "Hi! I'm your SINSAY dive assistant.",
      time: "10:00 AM",
    },
    {
      id: "msg-1",
      role: "user",
      text: "What is the depth of Cathedral Rock?",
      time: "10:01 AM",
    },
    {
      id: "msg-2",
      role: "assistant",
      text: "Cathedral Rock ranges from 5 to 25 meters.",
      time: "10:01 AM",
    },
    {
      id: "msg-3",
      role: "user",
      text: "Are there sea turtles at Twin Rocks?",
      time: "10:02 AM",
      failed: true,
    },
    {
      id: "msg-4",
      role: "assistant",
      text: "Unable to reach SINSAY AI.",
      time: "10:02 AM",
      isError: true,
      errorKind: "network",
      errorTitle: "Network Connection Lost",
      retryPrompt: "Are there sea turtles at Twin Rocks?",
      failedUserMsgId: "msg-3",
    },
  ];

  const history = buildSanitizedChatHistory(messages);
  assertEqual(history.length, 3);
  assertEqual(history[2].text, "Cathedral Rock ranges from 5 to 25 meters.");
});

check("consumeRetryTarget removes error bubble and paired failed user message when clicking Retry on Error Bubble", () => {
  const messages: ChatMessageItem[] = [
    { id: "0", role: "assistant", text: "Welcome!", time: "10:00 AM" },
    {
      id: "msg-10",
      role: "user",
      text: "Best macro spot in Anilao?",
      time: "10:05 AM",
      failed: true,
    },
    {
      id: "msg-11",
      role: "assistant",
      text: "Unable to reach SINSAY AI.",
      time: "10:05 AM",
      isError: true,
      errorKind: "network",
      errorTitle: "Network Connection Lost",
      retryPrompt: "Best macro spot in Anilao?",
      failedUserMsgId: "msg-10",
    },
  ];

  const result = consumeRetryTarget(messages, "msg-11");
  assertEqual(result.promptToRetry, "Best macro spot in Anilao?");
  assertEqual(result.remainingMessages.length, 1);
  assertEqual(result.remainingMessages[0].id, "0");
});

check("consumeRetryTarget removes failed user message and paired error bubble when clicking Retry on User Bubble", () => {
  const messages: ChatMessageItem[] = [
    { id: "0", role: "assistant", text: "Welcome!", time: "10:00 AM" },
    {
      id: "msg-20",
      role: "user",
      text: "How do I activate my Eco-Dive ID?",
      time: "10:06 AM",
      failed: true,
    },
    {
      id: "msg-21",
      role: "assistant",
      text: "The dive assistant is unavailable right now.",
      time: "10:06 AM",
      isError: true,
      errorKind: "service",
      errorTitle: "AI Service Unavailable",
      retryPrompt: "How do I activate my Eco-Dive ID?",
      failedUserMsgId: "msg-20",
    },
  ];

  const result = consumeRetryTarget(messages, "msg-20");
  assertEqual(result.promptToRetry, "How do I activate my Eco-Dive ID?");
  assertEqual(result.remainingMessages.length, 1);
  assertEqual(result.remainingMessages[0].id, "0");
});

if (failures > 0) {
  console.error(`${failures} chat error retry test(s) failed`);
  process.exit(1);
}
console.log("all chat error retry tests passed");
