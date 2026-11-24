import { describe, expect, it } from "vitest";
import {
  PAIRING_ALPHABET,
  formatPairingCode,
  generatePairingCode,
  isValidPairingCode,
  normalizePairingCode,
} from "./pairing.ts";

describe("pairing codes", () => {
  it("builds a 4-character code from random bytes", () => {
    const code = generatePairingCode(Uint8Array.from([11, 22, 33]));
    expect(code).toHaveLength(4);
    expect([...code].every((ch) => PAIRING_ALPHABET.includes(ch))).toBe(true);
  });

  it("is deterministic for the same bytes", () => {
    const bytes = Uint8Array.from([200, 10, 7]);
    expect(generatePairingCode(bytes)).toBe(generatePairingCode(bytes));
  });

  it("rejects short entropy", () => {
    expect(() => generatePairingCode(Uint8Array.from([1, 2]))).toThrow(/3 random bytes/);
  });

  it("normalizes spacing and case", () => {
    expect(normalizePairingCode("  ab-cd ")).toBe("ABCD");
    expect(formatPairingCode("abcd")).toBe("A B C D");
  });

  it("validates alphabet membership", () => {
    expect(isValidPairingCode("AB2K")).toBe(true);
    expect(isValidPairingCode("AB0I")).toBe(false);
    expect(isValidPairingCode("ABC")).toBe(false);
  });
});
