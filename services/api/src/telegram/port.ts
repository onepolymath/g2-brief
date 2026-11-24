import type { ChatMessage, ChatSummary, Thread } from "@brief/shared";

export interface TelegramSource {
  readonly mode: "demo" | "telegram";
  listChats(): Promise<ChatSummary[]>;
  getThread(chatId: string): Promise<Thread>;
  send(chatId: string, text: string): Promise<ChatMessage>;
  markSeen(chatId: string): Promise<void>;
}
