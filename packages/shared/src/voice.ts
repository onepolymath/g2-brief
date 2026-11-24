import type { VoiceIntent } from "./types.ts";

const COMMANDS: Array<{ type: Exclude<VoiceIntent["type"], "dictate" | "draft">; patterns: RegExp[] }> = [
  { type: "next", patterns: [/^(next|skip|down|forward)$/i, /\bnext (one|chat|message)\b/i] },
  { type: "back", patterns: [/^(back|previous|up|go back)$/i] },
  { type: "open", patterns: [/^(open|show|read|enter)$/i] },
  { type: "send", patterns: [/^(send|approve|yes send|ship it)$/i] },
  { type: "listen", patterns: [/^(listen|start listening|voice)$/i] },
  { type: "exit", patterns: [/^(exit|close|quit|leave)$/i] },
];

/**
 * Map a short transcript to a glasses action.
 * "draft …" and free-form phrases become draft instructions rather than raw dictation dumps.
 */
export function parseVoiceIntent(transcript: string): VoiceIntent | null {
  const text = transcript.replace(/\s+/g, " ").trim();
  if (!text) return null;

  const draft = text.match(/^(draft|reply|say|tell them|write)\s*[:\-]?\s*(.*)$/i);
  if (draft) {
    const instruction = draft[2].trim();
    return instruction ? { type: "draft", instruction } : { type: "draft" };
  }

  for (const cmd of COMMANDS) {
    if (cmd.patterns.some((re) => re.test(text))) return { type: cmd.type };
  }

  if (text.split(" ").length <= 2 && /^(yes|ok|okay|sure)$/i.test(text)) {
    return { type: "send" };
  }

  return { type: "dictate", text };
}
