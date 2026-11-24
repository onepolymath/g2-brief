import type { ChatMessage, ChatSummary, Thread } from "@brief/shared";
import type { TelegramSource } from "./port.ts";
import { NotFoundError } from "./demo.ts";

interface TelegramApiResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  chat: { id: number; type: string; title?: string; first_name?: string; username?: string };
  from?: { first_name?: string; username?: string; is_bot?: boolean };
}

/**
 * Optional live path. Uses the official Telegram Bot API only.
 * A bot can see DMs sent to it, and channel posts if it is an admin.
 * Personal Telegram inboxes are not readable through Bot API, which is why
 * demo mode is the default for the hackathon walkthrough.
 */
export class TelegramBotSource implements TelegramSource {
  readonly mode = "telegram" as const;
  private chats = new Map<string, ChatSummary>();
  private messages = new Map<string, ChatMessage[]>();
  private offset = 0;

  constructor(
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async refresh(): Promise<void> {
    const updates = await this.call<TelegramUpdate[]>("getUpdates", {
      offset: this.offset,
      timeout: 0,
      allowed_updates: ["message", "channel_post"],
    });
    for (const update of updates) {
      this.offset = update.update_id + 1;
      const payload = update.message ?? update.channel_post;
      if (payload) this.ingest(payload);
    }
  }

  async listChats(): Promise<ChatSummary[]> {
    await this.refresh();
    return [...this.chats.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getThread(chatId: string): Promise<Thread> {
    await this.refresh();
    const chat = this.chats.get(chatId);
    const messages = this.messages.get(chatId);
    if (!chat || !messages) throw new NotFoundError(`unknown chat: ${chatId}`);
    return { chat: { ...chat }, messages: [...messages] };
  }

  async send(chatId: string, text: string): Promise<ChatMessage> {
    const numericId = Number(chatId);
    if (!Number.isFinite(numericId)) throw new NotFoundError(`unknown chat: ${chatId}`);
    const sent = await this.call<TelegramMessage>("sendMessage", { chat_id: numericId, text });
    const message = this.ingest(sent, true);
    return message;
  }

  async markSeen(chatId: string): Promise<void> {
    const chat = this.chats.get(chatId);
    if (!chat) throw new NotFoundError(`unknown chat: ${chatId}`);
    chat.unread = 0;
  }

  private ingest(payload: TelegramMessage, isSelf = false): ChatMessage {
    const chatId = String(payload.chat.id);
    const text = (payload.text ?? payload.caption ?? "").trim() || "(no text)";
    const title =
      payload.chat.title ?? payload.chat.first_name ?? payload.chat.username ?? chatId;
    const kind = payload.chat.type === "channel" ? "channel" : payload.chat.type === "private" ? "dm" : "group";
    const message: ChatMessage = {
      id: `${chatId}-${payload.message_id}`,
      chatId,
      author: isSelf ? "you" : payload.from?.first_name ?? payload.from?.username ?? title,
      isSelf,
      text,
      sentAt: new Date(payload.date * 1000).toISOString(),
    };
    const history = this.messages.get(chatId) ?? [];
    if (!history.some((m) => m.id === message.id)) history.push(message);
    this.messages.set(chatId, history);
    const unread = history.filter((m) => !m.isSelf).length;
    this.chats.set(chatId, {
      id: chatId,
      title,
      kind,
      unread: isSelf ? 0 : unread,
      preview: text,
      updatedAt: message.sentAt,
    });
    return message;
  }

  private async call<T>(method: string, body: Record<string, unknown> = {}): Promise<T> {
    const url = `https://api.telegram.org/bot${this.token}/${method}`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as TelegramApiResult<T>;
    if (!json.ok || json.result === undefined) {
      throw new Error(`Telegram ${method} failed: ${json.description ?? res.status}`);
    }
    return json.result;
  }
}
