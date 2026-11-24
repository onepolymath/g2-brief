import type { ChatMessage, ChatSummary, Thread } from "@brief/shared";
import { demoChats, demoMessages } from "../fixtures/inbox.ts";
import type { TelegramSource } from "./port.ts";

export class DemoTelegramSource implements TelegramSource {
  readonly mode = "demo" as const;
  private chats: ChatSummary[];
  private messages: Record<string, ChatMessage[]>;
  private seq = 100;

  constructor() {
    this.chats = structuredClone(demoChats);
    this.messages = structuredClone(demoMessages);
  }

  async listChats(): Promise<ChatSummary[]> {
    return structuredClone(this.chats);
  }

  async getThread(chatId: string): Promise<Thread> {
    const chat = this.chats.find((c) => c.id === chatId);
    const messages = this.messages[chatId];
    if (!chat || !messages) {
      throw new NotFoundError(`unknown chat: ${chatId}`);
    }
    return { chat: structuredClone(chat), messages: structuredClone(messages) };
  }

  async send(chatId: string, text: string): Promise<ChatMessage> {
    const thread = await this.getThread(chatId);
    const message: ChatMessage = {
      id: `local-${this.seq++}`,
      chatId,
      author: "you",
      isSelf: true,
      text,
      sentAt: new Date().toISOString(),
    };
    this.messages[chatId] = [...thread.messages, message];
    const chat = this.chats.find((c) => c.id === chatId);
    if (chat) {
      chat.unread = 0;
      chat.preview = text;
      chat.updatedAt = message.sentAt;
    }
    return message;
  }

  async markSeen(chatId: string): Promise<void> {
    const chat = this.chats.find((c) => c.id === chatId);
    if (!chat) throw new NotFoundError(`unknown chat: ${chatId}`);
    chat.unread = 0;
  }
}

export class NotFoundError extends Error {}
