"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyChatError = classifyChatError;
exports.buildSanitizedChatHistory = buildSanitizedChatHistory;
exports.consumeRetryTarget = consumeRetryTarget;
const NETWORK_ERROR_REGEX = /failed to fetch|network|offline|functionsfetcherror|failed to send a request|load failed|timeout|err_internet_disconnected|connection lost/i;
const RATE_LIMIT_REGEX = /429|rate limit|too many requests/i;
/**
 * Classifies a chat error into a specific category (`network`, `rate_limit`, or `service`)
 * with a user-friendly header title and actionable description.
 */
function classifyChatError(error, isOffline) {
    const rawMessage = error instanceof Error
        ? `${error.name} ${error.message}`
        : typeof error === "string"
            ? error
            : "";
    if (isOffline || NETWORK_ERROR_REGEX.test(rawMessage)) {
        return {
            kind: "network",
            title: "Network Connection Lost",
            message: "Unable to reach SINSAY AI. Please check your internet connection and tap Retry.",
        };
    }
    if (RATE_LIMIT_REGEX.test(rawMessage)) {
        return {
            kind: "rate_limit",
            title: "Busy Right Now",
            message: "Too many requests right now. Please wait a moment and tap Retry.",
        };
    }
    const cleanText = error instanceof Error && error.message.trim()
        ? error.message.trim()
        : "The dive assistant couldn't respond right now. Tap Retry to try again.";
    return {
        kind: "service",
        title: "AI Service Unavailable",
        message: cleanText,
    };
}
/**
 * Builds the conversation history sent to Gemini, excluding error bubbles
 * and failed user turns so failed requests never pollute the AI context.
 */
function buildSanitizedChatHistory(messages) {
    return messages
        .filter((m) => !m.isError && !m.failed)
        .map((m) => ({ role: m.role, text: m.text }));
}
/**
 * Removes the failed turn (both the Error Bubble and its paired failed user message)
 * and returns the prompt text to retry so retrying does not duplicate bubbles.
 */
function consumeRetryTarget(messages, targetMessageId) {
    const target = messages.find((m) => m.id === targetMessageId);
    if (!target) {
        return { remainingMessages: messages, promptToRetry: null };
    }
    if (target.isError) {
        const prompt = target.retryPrompt?.trim() || null;
        const pairedUserId = target.failedUserMsgId;
        const remainingMessages = messages.filter((m) => m.id !== target.id && (!pairedUserId || m.id !== pairedUserId));
        return { remainingMessages, promptToRetry: prompt };
    }
    if (target.role === "user" && target.failed) {
        const prompt = target.text.trim() || null;
        const remainingMessages = messages.filter((m) => m.id !== target.id && m.failedUserMsgId !== target.id);
        return { remainingMessages, promptToRetry: prompt };
    }
    return { remainingMessages: messages, promptToRetry: null };
}
