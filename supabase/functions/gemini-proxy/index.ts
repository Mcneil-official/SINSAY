import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = "gemini-2.0-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CHAT_SYSTEM = `You are a friendly dive assistant for SINSAY, an eco-dive tourism app in Mabini, Batangas, Philippines.
Answer questions concisely about:
- Dive sites (Anilao, Sombrero Island, Sepoc Beach, Mainit, Tingloy, etc.)
- Dive safety tips and best practices
- Marine life in the area (nudibranchs, turtles, frogfish, whale sharks)
- The Eco-Dive ID process and requirements
- Weather and diving conditions
Keep answers under 3 paragraphs. Use a warm, helpful tone.`;

const PLANNER_SYSTEM = `You are a dive trip planner for SINSAY in Mabini, Batangas, Philippines.
Generate a detailed dive itinerary based on the user's preferences. Include:
- Recommended dive sites
- Suggested schedule/timing for each day
- Safety tips specific to the dive type
- Equipment recommendations
- Marine life to look out for
Format the response with clear day-by-day sections using emoji headers.`;

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMITS: Record<string, number> = {
  chat: 10,
  planner: 5,
};
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

const ALLOWED_TOPICS = [
  "dive", "diving", "snorkel", "marine", "ocean", "sea", "beach",
  "anilao", "mabini", "batangas", "sombrero", "sepoc", "mainit",
  "tingloy", "eco-dive", "certification", "safety", "equipment",
  "current", "visibility", "weather", "nudibranch", "turtle",
  "frogfish", "whale shark", "coral", "reef", "sin say",
];

function isDiveRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return ALLOWED_TOPICS.some((t) => lower.includes(t));
}

async function callGemini(contents: unknown, systemInstruction: string): Promise<string> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      systemInstruction: { role: "user", parts: [{ text: systemInstruction }] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "*";
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Gemini API key not configured" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { type } = body;

    const authHeader = req.headers.get("Authorization") || "";
    const userId = authHeader.replace("Bearer ", "").slice(0, 20) || "anonymous";
    const rateLimit = RATE_LIMITS[type as string] || 10;

    if (!checkRateLimit(`${type}:${userId}`, rateLimit)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (type === "chat") {
      const { history = [], userMessage = "" } = body;

      if (!isDiveRelated(userMessage)) {
        return new Response(
          JSON.stringify({
            reply: "I can only answer questions related to diving, marine life, and SINSAY Eco-Dive tourism in Mabini, Batangas. Please ask a dive-related question!",
          }),
          { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
        );
      }

      const contents = [
        ...history.map((m: { role: string; text: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ];

      const reply = await callGemini(contents, CHAT_SYSTEM);
      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (type === "planner") {
      const { params } = body;
      const prompt = `Create a dive trip plan with the following details:
- Destination: ${params.destination}
- Dates: ${params.startDate} to ${params.endDate}
- Number of divers: ${params.divers}
- Dive type: ${params.diveType}
- Special interests: ${params.interests || "None"}

Generate a complete day-by-day itinerary.`;

      const contents = [{ role: "user", parts: [{ text: prompt }] }];
      const reply = await callGemini(contents, PLANNER_SYSTEM);
      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type. Use 'chat' or 'planner'." }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
