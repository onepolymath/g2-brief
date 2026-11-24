import type { Briefing, ChatSummary } from "./types.ts";
import { GLANCE_COLUMNS, fitLines, kindLabel, truncate, wrapLine } from "./layout.ts";

export function buildBriefing(chats: ChatSummary[], now = new Date()): Briefing {
  const open = chats
    .filter((c) => c.unread > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return {
    generatedAt: now.toISOString(),
    unreadTotal: open.reduce((sum, c) => sum + c.unread, 0),
    highlights: open.slice(0, 5),
  };
}

export function formatClock(iso: string, timeZone = "Africa/Lagos"): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function formatBriefBody(brief: Briefing, selectedIndex = 0): string[] {
  if (brief.highlights.length === 0) {
    return wrapLine("Caught up. No unread Telegram.");
  }
  const lines: string[] = [];
  brief.highlights.forEach((chat, index) => {
    const cursor = index === selectedIndex ? "▶" : " ";
    const title = truncate(chat.title, 12).padEnd(12, " ");
    const preview = truncate(chat.preview, 18);
    const row = `${cursor}${title}  ${preview}`;
    lines.push(row.length > GLANCE_COLUMNS ? `${row.slice(0, GLANCE_COLUMNS - 1)}…` : row);
  });
  return fitLines(lines, 6);
}

export function formatBriefHeader(brief: Briefing, clock: string): string {
  const unread = brief.unreadTotal === 1 ? "1 unread" : `${brief.unreadTotal} unread`;
  return `BRIEF                    ${clock}\n${unread} · Telegram`;
}

export function formatBriefFooter(hasUnread: boolean): string {
  return hasUnread ? "tap open  ·  swipe next  ·  hold menu" : "double-tap to leave";
}

export function formatThreadBody(title: string, kind: ChatSummary["kind"], messages: { author: string; isSelf: boolean; text: string }[]): string[] {
  const heading = truncate(`${title}  ·  ${kindLabel(kind)}`, GLANCE_COLUMNS);
  const recent = messages.slice(-3);
  const body = recent.flatMap((m) => {
    const who = m.isSelf ? "you" : truncate(m.author, 14);
    return wrapLine(`${who}: ${m.text}`);
  });
  return fitLines([heading, ...body], 8);
}

export function formatDraftBody(title: string, draftText: string, index: number, total: number): string[] {
  const heading = truncate(`SEND TO ${title.toUpperCase()}?  ${index + 1}/${total}`, GLANCE_COLUMNS);
  const quoted = wrapLine(`"${draftText}"`);
  return fitLines([heading, ...quoted], 8);
}

export function formatSentBody(title: string): string[] {
  return wrapLine(`Sent to ${title}.`);
}
