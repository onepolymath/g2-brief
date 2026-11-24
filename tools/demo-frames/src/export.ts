import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBriefing,
  type ChatMessage,
  type ChatSummary,
  proposeDrafts,
} from "@brief/shared";
import {
  briefPage,
  draftPage,
  listeningPage,
  pairingPage,
  sentPage,
  threadPage,
} from "../../../apps/glass/src/screens.ts";
import type { PageSpec } from "../../../apps/glass/src/host.ts";

const ada: ChatSummary = {
  id: "ada",
  title: "Ada",
  kind: "dm",
  unread: 1,
  preview: "are we still on for 4?",
  updatedAt: "2026-11-24T16:40:00.000Z",
};
const ton: ChatSummary = {
  id: "ton",
  title: "#ton research",
  kind: "channel",
  unread: 2,
  preview: "mainnet window slips 20 min",
  updatedAt: "2026-11-24T16:18:00.000Z",
};
const guild: ChatSummary = {
  id: "guild",
  title: "Design Guild",
  kind: "group",
  unread: 1,
  preview: "can you review the doc today?",
  updatedAt: "2026-11-24T15:55:00.000Z",
};

const messages: ChatMessage[] = [
  { id: "1", chatId: "ada", author: "Ada", isSelf: false, text: "I'll bring the printed agenda.", sentAt: "2026-11-24T15:12:00.000Z" },
  { id: "2", chatId: "ada", author: "you", isSelf: true, text: "should be", sentAt: "2026-11-24T15:14:00.000Z" },
  { id: "3", chatId: "ada", author: "Ada", isSelf: false, text: "are we still on for 4?", sentAt: ada.updatedAt },
];

const briefing = buildBriefing([ada, ton, guild], new Date("2026-11-24T17:05:00.000Z"));
const drafts = proposeDrafts(messages).map((d, i) => ({ ...d, id: `d${i}`, chatId: "ada" }));
const thread = { chat: ada, messages };

const frames: Record<string, PageSpec> = {
  "01-pair": pairingPage("AB2K", "http://127.0.0.1:8787"),
  "02-brief": briefPage(briefing, 0, "2026-11-24T17:05:00.000Z"),
  "03-brief-next": briefPage(briefing, 1, "2026-11-24T17:05:00.000Z"),
  "04-thread": threadPage(thread),
  "05-draft": draftPage("Ada", drafts, 0),
  "06-draft-alt": draftPage("Ada", drafts, 1),
  "07-listen": listeningPage("say a command, or how to reply"),
  "08-sent": sentPage("Ada"),
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../../../demo");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "frames.json"), JSON.stringify(frames, null, 2));
console.log(`wrote ${Object.keys(frames).length} frames to demo/frames.json`);
