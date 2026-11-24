import { describe, expect, it } from "vitest";
import { fitLines, truncate, wrapLine } from "./layout.ts";

describe("wrapLine", () => {
  it("wraps on word boundaries", () => {
    expect(wrapLine("are we still on for four o'clock today", 12)).toEqual([
      "are we still",
      "on for four",
      "o'clock",
      "today",
    ]);
  });

  it("breaks an oversized token", () => {
    expect(wrapLine("abcdefghijklmnopqrstuvwxyz", 10)).toEqual([
      "abcdefghij",
      "klmnopqrst",
      "uvwxyz",
    ]);
  });

  it("returns no lines for empty input", () => {
    expect(wrapLine("   ")).toEqual([]);
  });
});

describe("fitLines", () => {
  it("leaves short bodies alone", () => {
    expect(fitLines(["a", "b"], 3)).toEqual(["a", "b"]);
  });

  it("ellipsizes when truncated", () => {
    const out = fitLines(["alpha", "bravo", "charlie"], 2);
    expect(out).toHaveLength(2);
    expect(out[1].endsWith("…")).toBe(true);
  });
});

describe("truncate", () => {
  it("keeps short strings", () => {
    expect(truncate("hello", 8)).toBe("hello");
  });

  it("adds an ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });
});
