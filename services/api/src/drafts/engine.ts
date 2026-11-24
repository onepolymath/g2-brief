import { proposeDrafts, type ChatMessage, type Draft } from "@brief/shared";
import { randomBytes } from "node:crypto";

export interface DraftEngine {
  propose(chatId: string, messages: ChatMessage[], instruction?: string): Promise<Draft[]>;
}

export class HeuristicDraftEngine implements DraftEngine {
  async propose(chatId: string, messages: ChatMessage[], instruction?: string): Promise<Draft[]> {
    return proposeDrafts(messages, instruction).map((draft) => ({
      ...draft,
      chatId,
      id: randomBytes(6).toString("hex"),
    }));
  }
}

/** Optional OpenAI-compatible path. Unused unless OPENAI_API_KEY is set. */
export class ModelDraftEngine implements DraftEngine {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
    private readonly fallback = new HeuristicDraftEngine(),
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async propose(chatId: string, messages: ChatMessage[], instruction?: string): Promise<Draft[]> {
    try {
      const body = {
        model: this.model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "Write three alternative Telegram replies. Each must be at most two short sentences, no emoji unless the other person used one, no apology filler. Return a JSON array of strings.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction: instruction ?? null,
              thread: messages.slice(-6).map((m) => ({ from: m.isSelf ? "me" : m.author, text: m.text })),
            }),
          },
        ],
      };
      const res = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`model http ${res.status}`);
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = json.choices?.[0]?.message?.content ?? "[]";
      const parsed = JSON.parse(extractJson(content)) as unknown;
      if (!Array.isArray(parsed) || parsed.some((x) => typeof x !== "string")) {
        throw new Error("unexpected model shape");
      }
      return (parsed as string[]).slice(0, 3).map((text) => ({
        id: randomBytes(6).toString("hex"),
        chatId,
        text,
        source: "model" as const,
        instruction,
      }));
    } catch {
      return this.fallback.propose(chatId, messages, instruction);
    }
  }
}

function extractJson(content: string): string {
  const start = content.indexOf("[");
  const end = content.lastIndexOf("]");
  if (start >= 0 && end > start) return content.slice(start, end + 1);
  return "[]";
}

export function createDraftEngine(env: NodeJS.ProcessEnv = process.env): DraftEngine {
  if (env.OPENAI_API_KEY) {
    return new ModelDraftEngine(
      env.OPENAI_API_KEY,
      env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
      env.OPENAI_MODEL ?? "gpt-4o-mini",
    );
  }
  return new HeuristicDraftEngine();
}
