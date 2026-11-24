import { describe, expect, it } from "vitest";
import { parseVoiceIntent } from "./voice.ts";

describe("parseVoiceIntent", () => {
  it("maps short navigation commands", () => {
    expect(parseVoiceIntent("next")).toEqual({ type: "next" });
    expect(parseVoiceIntent("go back")).toEqual({ type: "back" });
    expect(parseVoiceIntent("send")).toEqual({ type: "send" });
    expect(parseVoiceIntent("yes")).toEqual({ type: "send" });
    expect(parseVoiceIntent("open")).toEqual({ type: "open" });
    expect(parseVoiceIntent("exit")).toEqual({ type: "exit" });
  });

  it("treats 'draft …' as an instruction, not a dump of dictation", () => {
    expect(parseVoiceIntent("draft")).toEqual({ type: "draft" });
    expect(parseVoiceIntent("tell them I'm running late")).toEqual({
      type: "draft",
      instruction: "I'm running late",
    });
  });

  it("falls back to dictate for free-form speech", () => {
    expect(parseVoiceIntent("I will bring the deck")).toEqual({
      type: "dictate",
      text: "I will bring the deck",
    });
  });

  it("ignores silence", () => {
    expect(parseVoiceIntent("   ")).toBeNull();
  });
});
