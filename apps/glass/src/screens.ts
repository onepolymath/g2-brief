import {
  formatBriefBody,
  formatBriefFooter,
  formatBriefHeader,
  formatClock,
  formatDraftBody,
  formatPairingCode,
  formatSentBody,
  formatThreadBody,
  type Briefing,
  type Draft,
  type Thread,
} from "@brief/shared";
import type { MenuItem, PageSpec, TextBlock } from "./host.ts";

export const MENU = {
  draft: 1,
  listen: 2,
  next: 3,
  seen: 4,
} as const;

const MENU_ITEMS: MenuItem[] = [
  { id: MENU.draft, name: "Draft reply" },
  { id: MENU.listen, name: "Listen" },
  { id: MENU.next, name: "Next" },
  { id: MENU.seen, name: "Mark seen" },
];

export function pageFromRegions(header: string, body: string[], footer: string, menu = MENU_ITEMS): PageSpec {
  return {
    menu,
    texts: [
      region(1, "header", 0, 0, 576, 56, header, 3, false),
      region(2, "body", 0, 56, 576, 188, body.join("\n"), 4, true),
      region(3, "footer", 0, 244, 576, 44, footer, 2, false),
    ],
  };
}

function region(
  id: number,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  content: string,
  textColor: number,
  capture: boolean,
): TextBlock {
  return { id, name, x, y, width, height, content, textColor, capture };
}

export function pairingPage(code: string, companionUrl: string): PageSpec {
  const host = companionUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return pageFromRegions(
    "BRIEF",
    ["Open this on your phone", host, "", formatPairingCode(code), "", "then start the demo inbox"],
    "waiting for pair",
    [],
  );
}

export function briefPage(brief: Briefing, selected: number, clockIso = brief.generatedAt): PageSpec {
  return pageFromRegions(
    formatBriefHeader(brief, formatClock(clockIso)),
    formatBriefBody(brief, selected),
    formatBriefFooter(brief.highlights.length > 0),
  );
}

export function threadPage(thread: Thread): PageSpec {
  return pageFromRegions(
    "THREAD",
    formatThreadBody(thread.chat.title, thread.chat.kind, thread.messages),
    "tap draft  ·  swipe next  ·  hold listen",
  );
}

export function draftPage(title: string, drafts: Draft[], index: number): PageSpec {
  const draft = drafts[index];
  return pageFromRegions(
    "DRAFT",
    formatDraftBody(title, draft?.text ?? "", index, drafts.length),
    "tap send  ·  swipe other  ·  hold listen",
  );
}

export function listeningPage(hint = "say a command, or how to reply"): PageSpec {
  return pageFromRegions("LISTEN", [hint, "", "tap to stop"], "voice stays on this phone / glasses");
}

export function sentPage(title: string): PageSpec {
  return pageFromRegions("SENT", formatSentBody(title), "returning to briefing");
}

export function errorPage(message: string): PageSpec {
  return pageFromRegions("BRIEF", [message], "double-tap to leave");
}

export function bootPage(): PageSpec {
  return pageFromRegions("BRIEF", ["Looking up your inbox…"], "one glance, then a tap");
}
