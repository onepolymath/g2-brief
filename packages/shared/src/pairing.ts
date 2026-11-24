/** Crockford-ish alphabet with visually ambiguous characters removed (I, L, O, 0, 1). */
export const PAIRING_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

export function generatePairingCode(bytes: Uint8Array): string {
  if (bytes.length < 3) {
    throw new Error("pairing code needs at least 3 random bytes");
  }
  let n = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) >>> 0;
  let out = "";
  for (let i = 0; i < 4; i += 1) {
    out = PAIRING_ALPHABET[n % PAIRING_ALPHABET.length] + out;
    n = Math.floor(n / PAIRING_ALPHABET.length);
  }
  return out;
}

/** Uppercase and strip spaces or dashes. Codes never contain I, L, O, 0 or 1. */
export function normalizePairingCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s\-]/g, "");
}

export function formatPairingCode(code: string): string {
  const c = normalizePairingCode(code);
  if (c.length !== 4) return c;
  return `${c[0]} ${c[1]} ${c[2]} ${c[3]}`;
}

export function isValidPairingCode(input: string): boolean {
  const c = normalizePairingCode(input);
  return c.length === 4 && [...c].every((ch) => PAIRING_ALPHABET.includes(ch));
}
