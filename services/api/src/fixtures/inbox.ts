import type { ChatMessage, ChatSummary } from "@brief/shared";

export const demoChats: ChatSummary[] = [
  {
    id: "ada",
    title: "Ada",
    kind: "dm",
    unread: 1,
    preview: "are we still on for 4?",
    updatedAt: "2026-11-24T16:40:00.000Z",
  },
  {
    id: "ton",
    title: "#ton research",
    kind: "channel",
    unread: 2,
    preview: "mainnet window slips 20 min",
    updatedAt: "2026-11-24T16:18:00.000Z",
  },
  {
    id: "guild",
    title: "Design Guild",
    kind: "group",
    unread: 1,
    preview: "can you review the doc today?",
    updatedAt: "2026-11-24T15:55:00.000Z",
  },
  {
    id: "home",
    title: "Mum",
    kind: "dm",
    unread: 1,
    preview: "call me when you're free",
    updatedAt: "2026-11-24T15:10:00.000Z",
  },
];

export const demoMessages: Record<string, ChatMessage[]> = {
  ada: [
    {
      id: "ada-1",
      chatId: "ada",
      author: "Ada",
      isSelf: false,
      text: "I'll bring the printed agenda.",
      sentAt: "2026-11-24T15:12:00.000Z",
    },
    {
      id: "ada-2",
      chatId: "ada",
      author: "you",
      isSelf: true,
      text: "should be",
      sentAt: "2026-11-24T15:14:00.000Z",
    },
    {
      id: "ada-3",
      chatId: "ada",
      author: "Ada",
      isSelf: false,
      text: "are we still on for 4?",
      sentAt: "2026-11-24T16:40:00.000Z",
    },
  ],
  ton: [
    {
      id: "ton-1",
      chatId: "ton",
      author: "ton research",
      isSelf: false,
      text: "Release checklist is frozen at 18:00 UTC.",
      sentAt: "2026-11-24T16:05:00.000Z",
    },
    {
      id: "ton-2",
      chatId: "ton",
      author: "ton research",
      isSelf: false,
      text: "Mainnet window slips 20 minutes. No action needed if you already queued.",
      sentAt: "2026-11-24T16:18:00.000Z",
    },
  ],
  guild: [
    {
      id: "guild-1",
      chatId: "guild",
      author: "Priya",
      isSelf: false,
      text: "Draft v3 is in the shared folder.",
      sentAt: "2026-11-24T15:40:00.000Z",
    },
    {
      id: "guild-2",
      chatId: "guild",
      author: "Priya",
      isSelf: false,
      text: "can you review the doc today?",
      sentAt: "2026-11-24T15:55:00.000Z",
    },
  ],
  home: [
    {
      id: "home-1",
      chatId: "home",
      author: "Mum",
      isSelf: false,
      text: "call me when you're free",
      sentAt: "2026-11-24T15:10:00.000Z",
    },
  ],
};
