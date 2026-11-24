/** Even G2 / Even App microphone format: 16 kHz, signed 16-bit little-endian, mono. */
export const PCM_SAMPLE_RATE = 16_000;
export const PCM_BYTES_PER_SAMPLE = 2;

export function pcmDurationMs(pcm: Uint8Array): number {
  return Math.round((pcm.byteLength / PCM_BYTES_PER_SAMPLE / PCM_SAMPLE_RATE) * 1000);
}

export function concatPcm(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

export function isSilentPcm(pcm: Uint8Array, threshold = 64): boolean {
  if (pcm.byteLength < 2) return true;
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let peak = 0;
  for (let i = 0; i + 1 < pcm.byteLength; i += 2) {
    peak = Math.max(peak, Math.abs(view.getInt16(i, true)));
    if (peak >= threshold) return false;
  }
  return true;
}
