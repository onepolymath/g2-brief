import { describe, expect, it } from "vitest";
import {
  buildBriefing,
  formatBriefBody,
  formatBriefHeader,
  formatDraftBody,
  formatThreadBody,
} from "./digest.ts";
import type { ChatSummary } from "./types.ts";

const chats: ChatSummary[] = [
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
    unread: 3,
    preview: "mainnet delay, 20 min",
    updatedAt: "2026-11-24T16:10:00.000Z",
  },
  {
    id: "done",
    title: "Archive",
    kind: "group",
    unread: 0,
    preview: "all clear",
    updatedAt: "2026-11-24T12:00:00.000Z",
  },
];

describe("buildBriefing", () => {
  it("keeps only unread chats, newest first", () => {
    const brief = buildBriefing(chats, new Date("2026-11-24T17:00:00.000Z"));
    expect(brief.unreadTotal).toBe(4);
    expect(brief.highlights.map((c) => c.id)).toEqual(["ada", "ton"]);
  });
});

describe("formatters", () => {
  it("marks the selected highlight", () => {
    const brief = buildBriefing(chats);
    const lines = formatBriefBody(brief, 1);
    expect(lines[0].startsWith(" ")).toBe(true);
    expect(lines[1].startsWith("▶")).toBe(true);
    expect(lines.some((l) => l.length > 36)).toBe(false);
  });

  it("renders a quiet inbox", () => {
    const brief = buildBriefing([]);
    expect(formatBriefBody(brief).join(" ")).toMatch(/caught up/i);
  });

  it("keeps the header glanceable", () => {
    const brief = buildBriefing(chats, new Date("2026-11-24T17:00:00.000Z"));
    const header = formatBriefHeader(brief, "18:00");
    expect(header).toContain("BRIEF");
    expect(header).toContain("18:00");
    expect(header).toContain("4 unread");
  });

  it("shows the latest thread lines and a draft quote", () => {
    const thread = formatThreadBody("Ada", "dm", [
      { author: "Ada", isSelf: false, text: "are we still on for 4?" },
      { author: "you", isSelf: true, text: "should be" },
    ]);
    expect(thread[0]).toMatch(/Ada/);
    expect(thread.join("\n")).toMatch(/are we still on/);

    const draft = formatDraftBody("Ada", "Yes — I'll be there.", 0, 3);
    expect(draft[0]).toMatch(/SEND TO ADA/);
    expect(draft.join("\n")).toContain('"Yes — I\'ll be there."');
  });
});
