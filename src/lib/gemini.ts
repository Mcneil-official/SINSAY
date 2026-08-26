import { supabase } from "./supabase";

export async function chatWithGemini(
  history: { role: "user" | "assistant"; text: string }[],
  userMessage: string
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("gemini-proxy", {
      body: { type: "chat", history, userMessage },
    });
    if (error) throw error;
    if (data?.reply) return data.reply;
    throw new Error("No reply");
  } catch (e) {
    console.warn("Gemini proxy error, falling back to mock", e);
    return getMockChatReply(userMessage);
  }
}

export async function generateDivePlan(params: {
  destination: string;
  startDate: string;
  endDate: string;
  divers: string;
  diveType: string;
  interests: string;
}): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("gemini-proxy", {
      body: { type: "planner", params },
    });
    if (error) throw error;
    if (data?.reply) return data.reply;
    throw new Error("No reply");
  } catch (e) {
    console.warn("Gemini proxy error, falling back to mock", e);
    return getMockPlan(params);
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
}): string {
  return (
    `🌊 Dive Plan for ${params.destination}\n\n` +
    `📅 ${params.startDate} - ${params.endDate}\n` +
    `👤 ${params.divers} diver(s)\n` +
    `🏊 ${params.diveType}\n\n` +
    `Day 1:\n` +
    `  • 08:00 - Morning dive at Anilao Cove\n` +
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
