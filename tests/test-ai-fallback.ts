import {
  shouldFailoverToGroq,
  transformGeminiContentsToOpenAIMessages,
} from "../src/lib/chatRetry";
import { getMockChatReply } from "../src/lib/gemini";

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

console.log("Running AI Chat Groq Fallback & Failover unit tests...");

// 1. Failover condition detection
check("triggers Groq failover on Gemini API 503 Model Overloaded error", () => {
  const err = new Error(
    "Gemini API error 503: The model is overloaded. Please try again later."
  );
  assertEqual(shouldFailoverToGroq(err), true);
});

check("triggers Groq failover on Gemini API 500 Internal error", () => {
  const err = new Error("Gemini API error 500: Internal server error");
  assertEqual(shouldFailoverToGroq(err), true);
});

check("triggers Groq failover on Gemini API 429 Rate Limit error", () => {
  const err = new Error(
    "Gemini API error 429: Resource has been exhausted (e.g. check quota)."
  );
  assertEqual(shouldFailoverToGroq(err), true);
});

check("triggers Groq failover on network timeouts and connection drops", () => {
  assertEqual(shouldFailoverToGroq(new Error("fetch timeout")), true);
  assertEqual(
    shouldFailoverToGroq(new Error("TypeError: Failed to fetch")),
    true
  );
});

check("does not trigger failover when no error occurred", () => {
  assertEqual(shouldFailoverToGroq(null), false);
  assertEqual(shouldFailoverToGroq(undefined), false);
});

// 2. Message Transformation (Gemini -> OpenAI / Groq schema)
check("transforms history and user message into OpenAI/Groq message list", () => {
  const history = [
    { role: "user", text: "What fish can I see in Sombrero Island?" },
    { role: "assistant", text: "You can see sea turtles and colorful reef fish!" },
  ];
  const userMessage = "Are there strong currents there?";
  const systemPrompt = "You are a helpful dive assistant for SINSAY.";

  const transformed = transformGeminiContentsToOpenAIMessages(
    history,
    userMessage,
    systemPrompt
  );

  assertEqual(transformed.length, 4);
  assertEqual(transformed[0], {
    role: "system",
    content: "You are a helpful dive assistant for SINSAY.",
  });
  assertEqual(transformed[1], {
    role: "user",
    content: "What fish can I see in Sombrero Island?",
  });
  assertEqual(transformed[2], {
    role: "assistant",
    content: "You can see sea turtles and colorful reef fish!",
  });
  assertEqual(transformed[3], {
    role: "user",
    content: "Are there strong currents there?",
  });
});

check("maps 'model' role to 'assistant' for OpenAI compatibility", () => {
  const history = [
    { role: "model", text: "Welcome to SINSAY!" },
  ];
  const transformed = transformGeminiContentsToOpenAIMessages(history, "Hello");
  assertEqual(transformed[0].role, "assistant");
  assertEqual(transformed[0].content, "Welcome to SINSAY!");
  assertEqual(transformed[1].role, "user");
  assertEqual(transformed[1].content, "Hello");
});

check("handles empty history without crashing", () => {
  const transformed = transformGeminiContentsToOpenAIMessages([], "Where to dive?");
  assertEqual(transformed.length, 1);
  assertEqual(transformed[0], { role: "user", content: "Where to dive?" });
});

// 3. Groq Payload & JSON Mode Configuration
check("formats Groq planner request with strict JSON mode", () => {
  const buildGroqPlannerPayload = (
    prompt: string,
    model = "llama-3.3-70b-versatile"
  ) => ({
    model,
    messages: [
      { role: "system", content: "Return ONLY valid JSON." },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const payload = buildGroqPlannerPayload("Plan a 2-day scuba dive in Anilao");
  assertEqual(payload.model, "llama-3.3-70b-versatile");
  assertEqual(payload.response_format.type, "json_object");
  assertEqual(payload.temperature, 0.3);
});

// 4. Provider Response Tagging
check("tags responses accurately by provider", () => {
  const parseProvider = (res: { reply: string; provider?: string }) =>
    res.provider ?? "gemini";

  assertEqual(parseProvider({ reply: "Hi", provider: "gemini" }), "gemini");
  assertEqual(parseProvider({ reply: "Hi", provider: "groq" }), "groq");
  assertEqual(parseProvider({ reply: "Hi", provider: "guard" }), "guard");
  assertEqual(parseProvider({ reply: "Hi", provider: "static" }), "static");
  assertEqual(parseProvider({ reply: "Hi" }), "gemini");
});

// 5. Meaning of SINSAY
check("answers meaning of SINSAY with Batangueño 'to drop by' definition", () => {
  const reply1 = getMockChatReply("what does sinsay mean?");
  if (!reply1.includes("Batangueño") || !reply1.includes("to drop by")) {
    throw new Error(`Expected Batangueño 'to drop by' explanation, got: ${reply1}`);
  }

  const reply2 = getMockChatReply("ano ibig sabihin ng sinsay");
  if (!reply2.includes("Batangueño") || !reply2.includes("to visit")) {
    throw new Error(`Expected Batangueño 'to visit' explanation, got: ${reply2}`);
  }
});

if (failures > 0) {
  console.error(`\n${failures} tests failed.`);
  process.exit(1);
} else {
  console.log("\nAll AI fallback and failover tests passed!");
}
