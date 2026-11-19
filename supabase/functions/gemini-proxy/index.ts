// eslint-disable-next-line import/no-unresolved
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";
const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const CHAT_SYSTEM = `You are a friendly dive assistant for SINSAY, the official eco-dive tourism app for the Municipality of Mabini, Batangas, Philippines (Anilao).
Answer questions concisely about:
- Dive sites in Mabini (Cathedral Rock, Twin Rocks, Arthur's Rock, Kirby's Rock, Mainit Point, Secret Bay, Koala, Ligpo Island, Eagle Point, Bethlehem, etc.)
- Dive safety tips and best practices
- Marine life in the area (nudibranchs, turtles, frogfish, reef sharks)
- The Eco-Dive ID process and requirements for diving in Mabini
- Weather and diving conditions
- Getting to Mabini (bus/jeepney routes from Manila and Batangas City, tricycles, terminals)
- Restaurants and food spots near dive sites and around Mabini
- Visitor practicalities: stays, ATMs, clinics/emergency contacts
GOVERNANCE RULE:
- SINSAY is dedicated solely to the Municipality of Mabini.
- Tingloy is an island municipality with its own separate local government unit (LGU) and separate governance.
- If a tourist asks about Tingloy, Sombrero Island, or Sepoc Beach, politely clarify that SINSAY covers the Municipality of Mabini, which operates under different governance from Tingloy, and enthusiastically recommend Mabini's top dive sites instead.
Keep answers under 3 paragraphs. Use a warm, helpful tone.
Freshness rule: fares, schedules, opening hours, and prices change often and
your knowledge may be stale — never state a specific fare, schedule, or hour
as fact (give ranges or "typically"), and end such answers with one line
advising the visitor to verify locally or with their operator.`;

const PLANNER_SYSTEM = `You are a dive trip planner for SINSAY in the Municipality of Mabini, Batangas, Philippines.
Return ONLY valid JSON. Do not wrap it in markdown fences and do not add commentary.
Use exactly this shape:
{
  "summary": {
    "experienceLevel": "Beginner|Intermediate|Advanced",
    "duration": "1-2 Days",
    "interest": "short label",
    "overview": "one concise sentence"
  },
  "days": [
    {
      "day": 1,
      "title": "short day theme",
      "activities": [
        {"period": "Morning|Afternoon|Evening", "time": "08:00", "title": "activity", "details": "short practical guidance"}
      ]
    }
  ],
  "sites": [
    {"name": "site name", "depth": "10-18m", "difficulty": "Beginner|Intermediate|Advanced", "description": "why it fits"}
  ],
  "ecoAlerts": ["specific conservation or safety rule"],
  "budgetBreakdown": [
    {"label": "Sanctuary fees", "amount": 500}
  ],
  "budgetTotal": 5000
}
CRITICAL DURATION RULE:
- The 'days' array MUST contain EXACTLY the number of day objects requested (e.g., if a 1-day trip is requested, there must be exactly 1 day object; if 3 days are requested, there must be exactly 3 day objects; if 5 days are requested, exactly 5 day objects). Do NOT output more or fewer days.

STRICT MABINI GEOGRAPHIC BOUNDARY:
- SINSAY is strictly for the Municipality of Mabini (Anilao), Batangas, Philippines.
- Every single dive site in 'sites' and throughout the daily itinerary activities MUST be strictly within the Municipality of Mabini.
- NEVER include dive sites in Tingloy (including Maricaban Island, Sombrero Island, Sepoc Beach, Caban Island, Beatrice Rock, Mapating Rock, or Batalang Bato) because Tingloy is a separate municipality under separate governance.
- NEVER include dive sites in Puerto Galera, Mindoro, Coron, El Nido, Boracay, Cebu, Moalboal, Malapascua, Apo Reef, Subic, or Tubbataha.
- Recognized authentic Mabini dive sites include: Cathedral Rock, Twin Rocks, Arthur's Rock, Kirby's Rock, Mainit Point, Secret Bay (Amphitheater), Koala, Ligpo Island, Cabancal, Bethlehem, Bahura, Eagle Point, Dive-and-Trek, Balanoy, Red Rock, Dead Rock, Dario Sea Garden.
Create a useful day-by-day plan, include realistic timing, and keep estimated paid activities within the stated budget when one is provided. Never invent exact business prices or schedules; use estimates and advise confirming locally.`;

const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMITS: Record<string, number> = {
  chat: 10,
  planner: 5,
};
const rateMap = new Map<string, { count: number; resetAt: number }>();

// Per-user rate keys: the old code sliced the first 20 chars of the JWT,
// but every Supabase JWT shares the same header prefix — so the "per-user"
// bucket was effectively GLOBAL (one busy user starved everyone). Hash the
// full credential instead.
async function rateKey(type: string, authHeader: string): Promise<string> {
  const bytes = new TextEncoder().encode(authHeader || "anonymous");
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
  return `${type}:${hex}`;
}

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
    // supabase-js functions.invoke sends apikey + X-Client-Info alongside
    // Content-Type/Authorization — all four must be allow-listed or browser
    // preflights fail and the real request is never sent (curl bypasses
    // preflight, which is why direct calls worked while the app failed).
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info",
  };
}

const ALLOWED_TOPICS = [
  "dive", "diving", "snorkel", "marine", "ocean", "sea", "beach",
  "anilao", "mabini", "batangas", "sombrero", "sepoc", "mainit",
  "tingloy", "eco-dive", "certification", "safety", "equipment",
  "current", "visibility", "weather", "nudibranch", "turtle",
  "frogfish", "whale shark", "coral", "reef", "sin say",
  // Tourist-practical questions the gate used to refuse (looked broken):
  "price", "cost", "fee", "pass", "passes", "booking", "book",
  "resort", "payment", "gcash", "itinerary", "trip", "plan",
  // Transport to/around Mabini:
  "commute", "transport", "bus", "jeep", "jeepney", "tricycle",
  "terminal", "directions", "going to", "getting to", "fare",
  // Dining near dive sites:
  "eat", "eating", "food", "restaurant", "resto", "lomi", "bulalo", "dining",
  // Visitor practicalities:
  "hotel", "accommodation", "stay", "staying", "atm", "hospital", "clinic",
  "emergency", "island hopping", "church", "market",
];

function isDiveRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return ALLOWED_TOPICS.some((t) => lower.includes(t));
}

// Standalone greetings ("hello", "hi", "kumusta"…) match no topic keyword,
// so without this the bot refuses to say hi back. Answered statically —
// no Gemini call needed.
const GREETING_ONLY_RE =
  /^(hi+|hello+|hey+|yo|kumusta|kamusta|good\s?(morning|afternoon|evening|day)|magandang\s?(umaga|hapon|gabi))[\s!.?]*$/i;
const LEADING_GREETING_RE =
  /^(hi+|hello+|hey+|yo|kumusta|kamusta|good\s?(morning|afternoon|evening|day)|magandang\s?(umaga|hapon|gabi))[\s,!.?]+/i;

const GREETING_REPLY =
  "Hello! I'm Sinsay, your Mabini dive assistant. Ask me about dive sites, safety, marine life, commuting here, food spots, or stays — or tap Plan Your Trip and I'll build you a day-by-day itinerary!";

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

async function callGroq(
  messages: { role: string; content: string }[],
  temperature = 0.6,
  responseFormat?: { type: "json_object" }
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured");
  }

  const body: Record<string, unknown> = {
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens: 1024,
  };
  if (responseFormat) {
    body.response_format = responseFormat;
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
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

  if (!GEMINI_API_KEY && !GROQ_API_KEY) {
    return new Response(JSON.stringify({ error: "AI API keys not configured" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { type } = body;

    const authHeader = req.headers.get("Authorization") || "";
    const key = await rateKey(type, authHeader);
    const rateLimit = RATE_LIMITS[type as string] || 10;

    if (!checkRateLimit(key, rateLimit)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (type === "chat") {
      const { history = [], userMessage = "" } = body;
      const trimmed = userMessage.trim();

      // "hello" alone → warm greeting, no model call, no refusal.
      if (GREETING_ONLY_RE.test(trimmed)) {
        return new Response(JSON.stringify({ reply: GREETING_REPLY, provider: "static" }), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
      // "hi, where to eat?" → gate the remainder, not the greeting.
      const effective = trimmed.replace(LEADING_GREETING_RE, "").trim() || trimmed;

      if (!isDiveRelated(effective)) {
        return new Response(
          JSON.stringify({
            reply: "I can only answer questions related to diving, marine life, and SINSAY Eco-Dive tourism in Mabini, Batangas. Please ask a dive-related question!",
            provider: "guard",
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

      let reply = "";
      let provider = "gemini";

      if (GEMINI_API_KEY) {
        try {
          reply = await callGemini(contents, CHAT_SYSTEM);
        } catch (geminiErr) {
          console.warn("Primary provider (Gemini) failed, checking Groq fallback:", geminiErr);
          if (GROQ_API_KEY) {
            const groqMessages = [
              { role: "system", content: CHAT_SYSTEM },
              ...history.map((m: { role: string; text: string }) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.text,
              })),
              { role: "user", content: userMessage },
            ];
            reply = await callGroq(groqMessages, 0.6);
            provider = "groq";
          } else {
            throw geminiErr;
          }
        }
      } else if (GROQ_API_KEY) {
        const groqMessages = [
          { role: "system", content: CHAT_SYSTEM },
          ...history.map((m: { role: string; text: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.text,
          })),
          { role: "user", content: userMessage },
        ];
        reply = await callGroq(groqMessages, 0.6);
        provider = "groq";
      }

      return new Response(JSON.stringify({ reply, provider }), {
        status: 200,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (type === "planner") {
      const { params } = body;
      const targetDays = Number(params.targetDays) || (
        params.lengthOfStay?.includes("1") ? 1 :
        params.lengthOfStay?.includes("2") ? 2 :
        params.lengthOfStay?.includes("3") ? 3 :
        params.lengthOfStay?.includes("4") || params.lengthOfStay?.includes("5") ? 5 :
        params.lengthOfStay?.includes("7") || params.lengthOfStay?.toLowerCase().includes("week") ? 7 :
        params.lengthOfStay?.toLowerCase().includes("extended") ? 10 : 2
      );
      const prompt = `Create the JSON dive trip plan requested by your instructions using these details:
- Destination: ${params.destination} (Strictly within the Municipality of Mabini / Anilao, Batangas)
- Duration: ${params.lengthOfStay || `${params.startDate} to ${params.endDate}`} (EXACTLY ${targetDays} day(s))
- Number of divers: ${params.divers}
- Dive type: ${params.diveType}
- Budget (PHP): ₱${params.budget || "5000"} (Minimum realistic budget is ₱1,000 for Mabini sanctuary pass and basic dive expenses)
- Special interests: ${params.interests || "None"}

CRITICAL REQUIREMENTS:
1. EXACT DURATION: Your JSON 'days' array MUST contain EXACTLY ${targetDays} day object(s) (Day 1 through Day ${targetDays}). Do NOT produce more or fewer days.
2. MABINI GOVERNANCE: All dive sites and activities must be located strictly within the Municipality of Mabini, Batangas. Do NOT select dive sites in Tingloy (e.g. Sombrero Island, Sepoc Beach, Maricaban Island, Caban Island, Beatrice Rock, Mapating Rock) as Tingloy is under separate municipal governance from Mabini. Do NOT select dive sites in Puerto Galera or elsewhere.
Choose exclusively from authentic Mabini dive sites: Cathedral Rock, Twin Rocks, Arthur's Rock, Kirby's Rock, Mainit Point, Secret Bay, Koala, Ligpo Island, Cabancal, Bethlehem, Bahura, Eagle Point, Dive-and-Trek, Balanoy, Red Rock.

Generate a complete day-by-day itinerary. Keep paid activities within the stated budget where one is given.`;

      const contents = [{ role: "user", parts: [{ text: prompt }] }];
      let reply = "";
      let provider = "gemini";

      if (GEMINI_API_KEY) {
        try {
          reply = await callGemini(contents, PLANNER_SYSTEM);
        } catch (geminiErr) {
          console.warn("Primary provider (Gemini) failed on planner, checking Groq fallback:", geminiErr);
          if (GROQ_API_KEY) {
            const groqMessages = [
              { role: "system", content: PLANNER_SYSTEM },
              { role: "user", content: prompt },
            ];
            reply = await callGroq(groqMessages, 0.3, { type: "json_object" });
            provider = "groq";
          } else {
            throw geminiErr;
          }
        }
      } else if (GROQ_API_KEY) {
        const groqMessages = [
          { role: "system", content: PLANNER_SYSTEM },
          { role: "user", content: prompt },
        ];
        reply = await callGroq(groqMessages, 0.3, { type: "json_object" });
        provider = "groq";
      }

      return new Response(JSON.stringify({ reply, provider }), {
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
