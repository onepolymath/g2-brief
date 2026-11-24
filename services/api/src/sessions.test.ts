import { describe, expect, it } from "vitest";
import { PairError, SessionStore } from "./sessions.ts";

describe("SessionStore", () => {
  it("expires unused pairing codes", () => {
    let now = 1_000;
    const store = new SessionStore(undefined, () => now);
    const { code } = store.startPairing();
    now += 11 * 60 * 1000;
    expect(() => store.completePairing(code)).toThrow(PairError);
  });

  it("refuses live Telegram when no bot token is configured", () => {
    const store = new SessionStore();
    const { code } = store.startPairing();
    expect(() => store.completePairing(code, "telegram")).toThrow(/not configured/);
  });
});
