"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LENGTH_OF_STAY_OPTIONS = exports.ACTIVITY_OPTIONS = void 0;
exports.chatWithGemini = chatWithGemini;
exports.generateDivePlan = generateDivePlan;
exports.getMockChatReply = getMockChatReply;
const supabase_1 = require("./supabase");
const plannerSites_1 = require("./plannerSites");
// Mock replies exist ONLY for explicit offline demos:
// set EXPO_PUBLIC_USE_MOCK_AI=1 to use them. Otherwise backend failures
// throw (the chat UI renders its error bubble + Retry) instead of silently
// answering with a random canned reply that ignores the question.
const USE_MOCK_AI = process.env.EXPO_PUBLIC_USE_MOCK_AI === "1";
async function invokeProxy(body) {
    const { data, error } = await supabase_1.supabase.functions.invoke("gemini-proxy", {
        body,
    });
    if (!error)
        return data;
    // Best-effort: surface the edge function's own error body (rate-limit
    // text, config errors) instead of the generic non-2xx wrapper.
    let edgeMessage = "";
    try {
        const ctx = error.context;
        if (ctx instanceof Response) {
            const parsed = (await ctx.clone().json());
            if (parsed?.error)
                edgeMessage = parsed.error;
        }
    }
    catch {
        // Fall through to status-based mapping below.
    }
    const status = error.status;
    const errName = error.name ?? "";
    const combined = `${status ?? ""} ${errName} ${edgeMessage} ${error.message}`;
    if (/429|rate limit/i.test(combined)) {
        throw new Error("Too many requests right now. Try again in a minute.");
    }
    const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
    if (isOffline ||
        /failed to fetch|network|offline|functionsfetcherror|failed to send a request|load failed|timeout/i.test(combined)) {
        throw new Error("Network connection lost. Please check your internet connection and tap Retry.");
    }
    console.warn("Gemini proxy error:", edgeMessage || error.message);
    throw new Error(edgeMessage || "The dive assistant is unavailable right now. Please try again.");
}
async function chatWithGemini(history, userMessage) {
    try {
        const data = await invokeProxy({
            type: "chat",
            history,
            userMessage,
        });
        if (data?.provider && data.provider !== "gemini") {
            console.info(`[SINSAY AI] Handled by provider: ${data.provider}`);
        }
        if (data?.reply)
            return data.reply;
        throw new Error("Empty reply from dive assistant.");
    }
    catch (e) {
        if (USE_MOCK_AI) {
            console.warn("Mock AI fallback (EXPO_PUBLIC_USE_MOCK_AI=1):", e);
            return getMockChatReply(userMessage);
        }
        throw e instanceof Error ? e : new Error("Chat request failed.");
    }
}
exports.ACTIVITY_OPTIONS = [
    { label: "Fun / Reef Diving", value: "fun-reef" },
    { label: "Macro & Muck Photography", value: "macro-photo" },
    { label: "Introductory / Discover Scuba", value: "intro-discover" },
    { label: "Night Diving", value: "night" },
    { label: "Wreck & Deep Diving", value: "wreck-deep" },
    { label: "Snorkeling & Freediving", value: "snorkeling-freedive" },
    { label: "Marine Life & Turtles", value: "marine-life" },
    { label: "Coral Conservation / Eco-Dive", value: "coral-conservation" },
];
exports.LENGTH_OF_STAY_OPTIONS = [
    { label: "Day Trip (1 Day)", value: "1-day", days: 1 },
    { label: "2 Days (Weekend)", value: "2-days", days: 2 },
    { label: "3 Days (Long Weekend)", value: "3-days", days: 3 },
    { label: "4–5 Days", value: "4-5-days", days: 5 },
    { label: "1 Week (7 Days)", value: "1-week", days: 7 },
    { label: "Extended Stay (8+ Days)", value: "extended", days: 10 },
];
async function generateDivePlan(params) {
    const destination = params.destination?.trim() || "Anilao, Mabini, Batangas";
    const divers = String(params.divers || params.groupSize || "2").trim();
    const diveType = params.activities?.trim() || params.diveType?.trim() || "Recreational Diving";
    const interests = params.interests?.trim() || params.activities?.trim() || "Reef exploration";
    const budget = params.budget?.trim() || "";
    const startDate = params.startDate?.trim() || "Day 1";
    const endDate = params.endDate?.trim() || (params.lengthOfStay ? params.lengthOfStay.trim() : "Day 2");
    const targetDays = params.targetDays ||
        exports.LENGTH_OF_STAY_OPTIONS.find((o) => o.value === params.lengthOfStay || o.label === params.lengthOfStay)?.days ||
        (0, plannerSites_1.parseLengthOfStayDays)(params.lengthOfStay || "") ||
        2;
    const normalizedParams = {
        destination,
        startDate,
        endDate,
        divers,
        diveType,
        interests,
        budget,
        lengthOfStay: params.lengthOfStay || `${startDate} - ${endDate}`,
        targetDays,
        activities: diveType,
        groupSize: divers,
    };
    try {
        const data = await invokeProxy({
            type: "planner",
            params: normalizedParams,
        });
        if (data?.provider && data.provider !== "gemini") {
            console.info(`[SINSAY Planner] Handled by provider: ${data.provider}`);
        }
        if (data?.reply)
            return data.reply;
        throw new Error("Empty reply from dive planner.");
    }
    catch (e) {
        if (USE_MOCK_AI) {
            console.warn("Mock AI fallback (EXPO_PUBLIC_USE_MOCK_AI=1):", e);
            return getMockPlan(normalizedParams);
        }
        throw e instanceof Error ? e : new Error("Plan request failed.");
    }
}
function getMockChatReply(userMessage) {
    if (/sinsay.*(mean|meaning|ibig sabihin|ano)|(mean|meaning|ibig sabihin).*sinsay/i.test(userMessage)) {
        return "SINSAY is a traditional Batangueño word that means 'to drop by' or 'to visit'. It invites divers and tourists to drop by Mabini, Batangas and experience its world-class dive sites and marine sanctuaries!";
    }
    const replies = [
        "Great question! Anilao is one of the best dive spots in Mabini with excellent coral reefs and macro life. The best time to dive is early morning when visibility is at its peak.",
        "For safety tips: always check your equipment before diving, never dive alone, and make sure to ascend slowly. The maximum recommended depth for recreational divers is 18-30 meters depending on your certification level.",
        "The marine life in Mabini includes sea turtles, nudibranchs, frogfish, and vibrant reef fish. Premier coral reefs can be found at Cathedral Rock, Twin Rocks, and Arthur's Rock.",
        "To get your Eco-Dive ID, you'll need to complete your diver profile on the SINSAY app. You'll need to provide your personal details, emergency contact, and certification proof if you're a certified diver.",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
}
function getMockPlan(params) {
    return (`🌊 Dive Plan for ${params.destination}\n\n` +
        `📅 ${params.startDate} - ${params.endDate}\n` +
        `👤 ${params.divers} diver(s)\n` +
        `🏊 ${params.diveType}\n` +
        (params.budget?.trim() ? `💰 Budget: ₱${params.budget.trim()}\n` : "") +
        `\n` +
        `Day 1:\n` +
        `  • 08:00 - Morning dive at Cathedral Rock\n` +
        `  • 12:00 - Lunch break at resort\n` +
        `  • 14:00 - Reef exploration at Twin Rocks\n\n` +
        `Day 2:\n` +
        `  • 07:00 - Sunrise dive at Arthur's Rock\n` +
        `  • 11:00 - Marine life photography session\n` +
        `  • 15:00 - Departure\n\n` +
        (params.interests.trim() ? `Special interests noted: ${params.interests}\n\n` : "") +
        `⚠️ Always check weather conditions and dive with a certified buddy.`);
}
