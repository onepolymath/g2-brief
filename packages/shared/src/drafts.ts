import type { ChatMessage, Draft } from "./types.ts";

function lastIncoming(messages: ChatMessage[]): ChatMessage | undefined {
  return [...messages].reverse().find((m) => !m.isSelf);
}

function tidy(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function short(text: string, max = 140): string {
  const t = tidy(text);
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Deterministic, glanceable reply drafts. No network and no API key required. */
export function proposeDrafts(
  messages: ChatMessage[],
  instruction?: string,
): Omit<Draft, "id" | "chatId">[] {
  const incoming = lastIncoming(messages);
  const prompt = tidy(instruction ?? "");
  if (prompt) {
    return [
      { text: short(prompt), source: "heuristic", instruction: prompt },
      { text: short(`Thanks — ${decapitalize(prompt)}`), source: "heuristic", instruction: prompt },
      { text: "I'll come back to this in a bit.", source: "heuristic", instruction: prompt },
    ];
  }
  if (!incoming) {
    return [
      { text: "Got it, thanks.", source: "heuristic" },
      { text: "On it.", source: "heuristic" },
    ];
  }
  const text = incoming.text;
  if (isQuestion(text)) {
    const topic = questionTopic(text);
    return [
      { text: short(`Yes — ${topic}`), source: "heuristic" },
      { text: short(`I can do that. ${topic}`), source: "heuristic" },
      { text: "Not today — I'll suggest another time.", source: "heuristic" },
    ];
  }
  if (isRequest(text)) {
    return [
      { text: "Yes, I'll take care of it.", source: "heuristic" },
      { text: "I can do this today. I'll send it over when it's ready.", source: "heuristic" },
      { text: "I need a little more time — I'll update you later today.", source: "heuristic" },
    ];
  }
  return [
    { text: "Thanks, noted.", source: "heuristic" },
    { text: "Sounds good.", source: "heuristic" },
    { text: "I'll reply properly in a moment.", source: "heuristic" },
  ];
}

function isQuestion(text: string): boolean {
  return /\?/.test(text) || /^(can|could|would|will|are|is|do|did|shall|should)\b/i.test(text);
}

function isRequest(text: string): boolean {
  return /\b(please|review|send|can you|could you|need you to|asap)\b/i.test(text);
}

function questionTopic(text: string): string {
  const lowered = tidy(text);
  if (/still on|are we on|see you|meet/i.test(lowered)) return "I'll be there.";
  if (/review|look at|take a look/i.test(lowered)) return "I'll review it today.";
  if (/call|free/i.test(lowered)) return "I'll call when I'm free.";
  return "happy to.";
}

function decapitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toLowerCase() + text.slice(1);
}
