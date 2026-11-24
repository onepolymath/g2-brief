import { describe, expect, it } from "vitest";
import { concatPcm, isSilentPcm, pcmDurationMs } from "./pcm.ts";

describe("pcm helpers", () => {
  it("computes duration at 16 kHz, 16-bit mono", () => {
    const oneSecond = new Uint8Array(16_000 * 2);
    expect(pcmDurationMs(oneSecond)).toBe(1000);
  });

  it("concatenates chunks", () => {
    const out = concatPcm([Uint8Array.from([1, 2]), Uint8Array.from([3, 4])]);
    expect(Array.from(out)).toEqual([1, 2, 3, 4]);
  });

  it("detects silence", () => {
    expect(isSilentPcm(new Uint8Array(32))).toBe(true);
    const loud = new Uint8Array(4);
    new DataView(loud.buffer).setInt16(0, 400, true);
    expect(isSilentPcm(loud)).toBe(false);
  });
});
