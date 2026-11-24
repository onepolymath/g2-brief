import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildBriefing, parseVoiceIntent } from "@brief/shared";
import { AuthError, PairError, SessionStore } from "./sessions.ts";
import { NotFoundError } from "./telegram/demo.ts";
import { createDraftEngine, type DraftEngine } from "./drafts/engine.ts";

const here = dirname(fileURLToPath(import.meta.url));
const companionHtml = readFileSync(join(here, "../public/companion.html"), "utf8");

export interface ApiOptions {
  store: SessionStore;
  drafts: DraftEngine;
  publicUrl: string;
}

export function createApiServer(options: ApiOptions) {
  const { store, drafts, publicUrl } = options;

  return createServer(async (req, res) => {
    try {
      applyCors(res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      const url = new URL(req.url ?? "/", "http://127.0.0.1");
      const path = url.pathname;
      const method = req.method ?? "GET";

      if (method === "GET" && (path === "/" || path === "/companion")) {
        html(res, companionHtml.replaceAll("{{PUBLIC_URL}}", publicUrl));
        return;
      }
      if (method === "GET" && path === "/health") {
        json(res, 200, { ok: true, service: "brief" });
        return;
      }
      if (method === "POST" && path === "/v1/pair/start") {
        json(res, 200, store.startPairing());
        return;
      }
      if (method === "POST" && path === "/v1/pair/complete") {
        const body = await readJson(req);
        const info = store.completePairing(String(body.code ?? ""), body.mode === "telegram" ? "telegram" : "demo");
        json(res, 200, info);
        return;
      }
      if (method === "GET" && path === "/v1/pair/claim") {
        const info = store.claim(url.searchParams.get("code") ?? "");
        json(res, 200, info);
        return;
      }

      const session = store.get(bearer(req));
      if (method === "GET" && path === "/v1/session") {
        json(res, 200, session.info);
        return;
      }
      if (method === "GET" && path === "/v1/brief") {
        const chats = await session.source.listChats();
        json(res, 200, { mode: session.source.mode, briefing: buildBriefing(chats) });
        return;
      }
      if (method === "GET" && path === "/v1/chats") {
        json(res, 200, { chats: await session.source.listChats() });
        return;
      }

      const threadMatch = path.match(/^\/v1\/chats\/([^/]+)$/);
      if (method === "GET" && threadMatch) {
        json(res, 200, await session.source.getThread(decodeURIComponent(threadMatch[1])));
        return;
      }

      const draftsMatch = path.match(/^\/v1\/chats\/([^/]+)\/drafts$/);
      if (method === "POST" && draftsMatch) {
        const chatId = decodeURIComponent(draftsMatch[1]);
        const body = await readJson(req);
        const thread = await session.source.getThread(chatId);
        const list = await drafts.propose(chatId, thread.messages, optionalString(body.instruction));
        json(res, 200, { drafts: list });
        return;
      }

      const sendMatch = path.match(/^\/v1\/chats\/([^/]+)\/send$/);
      if (method === "POST" && sendMatch) {
        const chatId = decodeURIComponent(sendMatch[1]);
        const body = await readJson(req);
        const text = optionalString(body.text);
        if (!text) {
          json(res, 400, { error: "text is required" });
          return;
        }
        const message = await session.source.send(chatId, text);
        json(res, 200, { ok: true, message });
        return;
      }

      const seenMatch = path.match(/^\/v1\/chats\/([^/]+)\/seen$/);
      if (method === "POST" && seenMatch) {
        await session.source.markSeen(decodeURIComponent(seenMatch[1]));
        json(res, 200, { ok: true });
        return;
      }

      if (method === "POST" && path === "/v1/voice") {
        const body = await readJson(req);
        const transcript = optionalString(body.transcript);
        if (!transcript) {
          json(res, 400, { error: "transcript is required in demo; PCM+Whisper is optional" });
          return;
        }
        json(res, 200, { transcript, intent: parseVoiceIntent(transcript) });
        return;
      }

      json(res, 404, { error: "not found" });
    } catch (err) {
      if (err instanceof PairError || err instanceof AuthError) {
        json(res, err instanceof AuthError ? 401 : 400, { error: err.message });
        return;
      }
      if (err instanceof NotFoundError) {
        json(res, 404, { error: err.message });
        return;
      }
      console.error(err);
      json(res, 500, { error: "internal error" });
    }
  });
}

function applyCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": payload.length,
  });
  res.end(payload);
}

function html(res: ServerResponse, body: string): void {
  const payload = Buffer.from(body);
  res.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "content-length": payload.length,
  });
  res.end(payload);
}

function bearer(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  return header.slice("Bearer ".length).trim();
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw) as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export { createDraftEngine };
