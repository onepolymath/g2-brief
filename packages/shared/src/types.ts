export type ChatKind = "dm" | "group" | "channel";

export interface ChatSummary {
  id: string;
  title: string;
  kind: ChatKind;
  unread: number;
  preview: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  author: string;
  isSelf: boolean;
  text: string;
  sentAt: string;
}

export interface Thread {
  chat: ChatSummary;
  messages: ChatMessage[];
}

export interface Briefing {
  generatedAt: string;
  unreadTotal: number;
  highlights: ChatSummary[];
}

export interface Draft {
  id: string;
  chatId: string;
  text: string;
  source: "heuristic" | "model";
  instruction?: string;
}

export interface SendResult {
  ok: true;
  message: ChatMessage;
}

export type VoiceIntent =
  | { type: "next" }
  | { type: "back" }
  | { type: "open" }
  | { type: "draft"; instruction?: string }
  | { type: "send" }
  | { type: "listen" }
  | { type: "exit" }
  | { type: "dictate"; text: string };

export interface SessionInfo {
  token: string;
  mode: "demo" | "telegram";
  createdAt: string;
}
