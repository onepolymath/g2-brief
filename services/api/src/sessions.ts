import { randomBytes } from "node:crypto";
import {
  generatePairingCode,
  isValidPairingCode,
  normalizePairingCode,
  type SessionInfo,
} from "@brief/shared";
import type { TelegramSource } from "./telegram/port.ts";
import { DemoTelegramSource } from "./telegram/demo.ts";
import { TelegramBotSource } from "./telegram/bot.ts";

const PAIR_TTL_MS = 10 * 60 * 1000;

interface PendingPair {
  code: string;
  expiresAt: number;
}

interface Session {
  info: SessionInfo;
  source: TelegramSource;
}

export class SessionStore {
  private pending = new Map<string, PendingPair>();
  private sessions = new Map<string, Session>();
  private claimable = new Map<string, string>();

  constructor(
    private readonly telegramToken?: string,
    private readonly now: () => number = Date.now,
  ) {}

  startPairing(): { code: string; expiresAt: string } {
    const code = generatePairingCode(randomBytes(3));
    const expiresAt = this.now() + PAIR_TTL_MS;
    this.pending.set(code, { code, expiresAt });
    return { code, expiresAt: new Date(expiresAt).toISOString() };
  }

  completePairing(rawCode: string, mode: "demo" | "telegram" = "demo"): SessionInfo {
    const code = normalizePairingCode(rawCode);
    if (!isValidPairingCode(code)) {
      throw new PairError("invalid pairing code");
    }
    const pending = this.pending.get(code);
    if (!pending || pending.expiresAt <= this.now()) {
      this.pending.delete(code);
      throw new PairError("expired or unknown pairing code");
    }
    this.pending.delete(code);

    if (mode === "telegram" && !this.telegramToken) {
      throw new PairError("live Telegram is not configured on this server");
    }

    const token = randomBytes(24).toString("hex");
    const info: SessionInfo = {
      token,
      mode: mode === "telegram" ? "telegram" : "demo",
      createdAt: new Date(this.now()).toISOString(),
    };
    const source =
      info.mode === "telegram" && this.telegramToken
        ? new TelegramBotSource(this.telegramToken)
        : new DemoTelegramSource();
    this.sessions.set(token, { info, source });
    this.claimable.set(code, token);
    return info;
  }

  get(token: string | undefined): Session {
    if (!token) throw new AuthError("missing session");
    const session = this.sessions.get(token);
    if (!session) throw new AuthError("unknown session");
    return session;
  }

  claim(rawCode: string): SessionInfo {
    const code = normalizePairingCode(rawCode);
    const token = this.claimable.get(code);
    if (!token) throw new PairError("pairing is not complete yet");
    this.claimable.delete(code);
    return this.get(token).info;
  }
}

export class PairError extends Error {}
export class AuthError extends Error {}
