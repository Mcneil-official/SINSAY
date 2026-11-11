import { supabase } from "./supabase";

// Mock replies exist ONLY for explicit offline demos:
// set EXPO_PUBLIC_USE_MOCK_AI=1 to use them. Otherwise backend failures
// throw (the chat UI renders its error bubble + Retry) instead of silently
// answering with a random canned reply that ignores the question.
const USE_MOCK_AI = process.env.EXPO_PUBLIC_USE_MOCK_AI === "1";

async function invokeProxy<T>(body: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("gemini-proxy", {
    body,
  });
  if (!error) return data as T;

  // Best-effort: surface the edge function's own error body (rate-limit
  // text, config errors) instead of the generic non-2xx wrapper.
  let edgeMessage = "";
  try {
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      const parsed = (await ctx.clone().json()) as { error?: string };
      if (parsed?.error) edgeMessage = parsed.error;
    }
  } catch {
    // Fall through to status-based mapping below.
  }
  const status = (error as { status?: number }).status;
  const combined = `${status ?? ""} ${edgeMessage} ${error.message}`;
  if (/429|rate limit/i.test(combined)) {
    throw new Error("Too many requests right now. Try again in a minute.");
  }
  console.warn("Gemini proxy error:", edgeMessage || error.message);
  throw new Error(
    edgeMessage || "The dive assistant is unavailable right now. Please try again."
  );
}

export async function chatWithGemini(
  history: { role: "user" | "assistant"; text: string }[],
  userMessage: string
): Promise<string> {
  try {
    const data = await invokeProxy<{ reply?: string }>({
      type: "chat",
      history,
      userMessage,
    });
    if (data?.reply) return data.reply;
    throw new Error("Empty reply from dive assistant.");
  } catch (e) {
    if (USE_MOCK_AI) {
      console.warn("Mock AI fallback (EXPO_PUBLIC_USE_MOCK_AI=1):", e);
      return getMockChatReply(userMessage);
    }
    throw e instanceof Error ? e : new Error("Chat request failed.");
  }
}

export const ACTIVITY_OPTIONS = [
  { label: "Fun / Reef Diving", value: "fun-reef" },
  { label: "Macro & Muck Photography", value: "macro-photo" },
  { label: "Introductory / Discover Scuba", value: "intro-discover" },
  { label: "Night Diving", value: "night" },
  { label: "Wreck & Deep Diving", value: "wreck-deep" },
  { label: "Snorkeling & Freediving", value: "snorkeling-freedive" },
  { label: "Marine Life & Turtles", value: "marine-life" },
  { label: "Coral Conservation / Eco-Dive", value: "coral-conservation" },
];

export const LENGTH_OF_STAY_OPTIONS = [
  { label: "Day Trip (1 Day)", value: "1-day", days: 1 },
  { label: "2 Days (Weekend)", value: "2-days", days: 2 },
  { label: "3 Days (Long Weekend)", value: "3-days", days: 3 },
  { label: "4–5 Days", value: "4-5-days", days: 5 },
  { label: "1 Week (7 Days)", value: "1-week", days: 7 },
  { label: "Extended Stay (8+ Days)", value: "extended", days: 10 },
];

export async function generateDivePlan(params: {
  destination?: string;
  startDate?: string;
  endDate?: string;
  divers?: string;
  groupSize?: string | number;
  diveType?: string;
  activities?: string;
  lengthOfStay?: string;
  interests?: string;
  budget?: string;
}): Promise<string> {
  const destination = params.destination?.trim() || "Anilao, Mabini, Batangas";
  const divers = String(params.divers || params.groupSize || "2").trim();
  const diveType = params.activities?.trim() || params.diveType?.trim() || "Recreational Diving";
  const interests = params.interests?.trim() || params.activities?.trim() || "Reef exploration";
  const budget = params.budget?.trim() || "";
  const startDate = params.startDate?.trim() || "Day 1";
  const endDate = params.endDate?.trim() || (params.lengthOfStay ? params.lengthOfStay.trim() : "Day 2");

  const normalizedParams = {
    destination,
    startDate,
    endDate,
    divers,
    diveType,
    interests,
    budget,
    lengthOfStay: params.lengthOfStay || `${startDate} - ${endDate}`,
    activities: diveType,
    groupSize: divers,
  };

  try {
    const data = await invokeProxy<{ reply?: string }>({
      type: "planner",
      params: normalizedParams,
    });
    if (data?.reply) return data.reply;
    throw new Error("Empty reply from dive planner.");
  } catch (e) {
    if (USE_MOCK_AI) {
      console.warn("Mock AI fallback (EXPO_PUBLIC_USE_MOCK_AI=1):", e);
      return getMockPlan(normalizedParams);
    }
    throw e instanceof Error ? e : new Error("Plan request failed.");
  }
}

function getMockChatReply(_userMessage: string): string {
  const replies = [
    "Great question! Anilao is one of the best dive spots in Mabini with excellent coral reefs and macro life. The best time to dive is early morning when visibility is at its peak.",
    "For safety tips: always check your equipment before diving, never dive alone, and make sure to ascend slowly. The maximum recommended depth for recreational divers is 18-30 meters depending on your certification level.",
    "The marine life in Mabini includes sea turtles, nudibranchs, frogfish, and occasional whale sharks during certain seasons. The healthiest coral reefs can be found at Sombrero Island and Sepoc Beach.",
    "To get your Eco-Dive ID, you'll need to complete your diver profile on the SINSAY app. You'll need to provide your personal details, emergency contact, and certification proof if you're a certified diver.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function getMockPlan(params: {
  destination: string;
  startDate: string;
  endDate: string;
  divers: string;
  diveType: string;
  interests: string;
  budget?: string;
}): string {
  return (
    `🌊 Dive Plan for ${params.destination}\n\n` +
    `📅 ${params.startDate} - ${params.endDate}\n` +
    `👤 ${params.divers} diver(s)\n` +
    `🏊 ${params.diveType}\n` +
    (params.budget?.trim() ? `💰 Budget: ₱${params.budget.trim()}\n` : "") +
    `\n` +
    `Day 1:\n` +
    `  • 08:00 - Morning dive at Cathedral Rock\n` +
    `  • 12:00 - Lunch break at resort\n` +
    `  • 14:00 - Reef exploration at Sombrero Island\n\n` +
    `Day 2:\n` +
    `  • 07:00 - Sunrise dive at Sepoc Beach\n` +
    `  • 11:00 - Marine life photography session\n` +
    `  • 15:00 - Departure\n\n` +
    (params.interests.trim() ? `Special interests noted: ${params.interests}\n\n` : "") +
    `⚠️ Always check weather conditions and dive with a certified buddy.`
  );
}
