import { describe, expect, it } from "vitest";
import { proposeDrafts } from "./drafts.ts";
import type { ChatMessage } from "./types.ts";

const msg = (text: string, isSelf = false): ChatMessage => ({
  id: text,
  chatId: "ada",
  author: isSelf ? "you" : "Ada",
  isSelf,
  text,
  sentAt: "2026-11-24T16:40:00.000Z",
});

describe("proposeDrafts", () => {
  it("answers a meeting question with a short yes", () => {
    const drafts = proposeDrafts([msg("are we still on for 4?")]);
    expect(drafts[0].text).toMatch(/Yes/i);
    expect(drafts[0].text.length).toBeLessThan(80);
    expect(drafts.length).toBeGreaterThanOrEqual(2);
  });

  it("offers an accept / delay pair for requests", () => {
    const drafts = proposeDrafts([msg("please review the doc by tomorrow")]);
    expect(drafts[0].text).toMatch(/I'll take care|review|today/i);
    expect(drafts.some((d) => /time|later/i.test(d.text))).toBe(true);
  });

  it("uses a spoken instruction when one is provided", () => {
    const drafts = proposeDrafts([msg("are we still on for 4?")], "tell them I'm running ten minutes late");
    expect(drafts[0].text.toLowerCase()).toContain("ten minutes late");
  });

  it("still drafts when the thread has no incoming message", () => {
    expect(proposeDrafts([msg("pinged earlier", true)])[0].text).toBeTruthy();
  });
});
