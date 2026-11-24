import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { AddressInfo } from "node:net";
import { createApiServer, createDraftEngine } from "./http.ts";
import { SessionStore } from "./sessions.ts";

async function start() {
  const store = new SessionStore();
  const server = createApiServer({
    store,
    drafts: createDraftEngine({}),
    publicUrl: "http://127.0.0.1",
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    store,
    server,
    url: `http://127.0.0.1:${port}`,
  };
}

async function request(url: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${url}${path}`, init);
  const body = await res.json();
  return { res, body };
}

describe("Brief API", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((s) => new Promise<void>((resolve) => s.close(() => resolve()))));
  });

  it("pairs a demo session and returns a briefing", async () => {
    const ctx = await start();
    servers.push(ctx.server);

    const started = await request(ctx.url, "/v1/pair/start", { method: "POST" });
    expect(started.res.status).toBe(200);
    expect(started.body.code).toHaveLength(4);

    const paired = await request(ctx.url, "/v1/pair/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: started.body.code, mode: "demo" }),
    });
    expect(paired.body.token).toBeTruthy();
    expect(paired.body.mode).toBe("demo");

    const claimed = await request(ctx.url, `/v1/pair/claim?code=${started.body.code}`);
    expect(claimed.body.token).toBe(paired.body.token);

    const auth = { authorization: `Bearer ${paired.body.token}` };
    const brief = await request(ctx.url, "/v1/brief", { headers: auth });
    expect(brief.body.briefing.unreadTotal).toBeGreaterThan(0);
    expect(brief.body.briefing.highlights[0].title).toBe("Ada");

    const thread = await request(ctx.url, "/v1/chats/ada", { headers: auth });
    expect(thread.body.messages.at(-1).text).toMatch(/still on for 4/);

    const drafts = await request(ctx.url, "/v1/chats/ada/drafts", {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(drafts.body.drafts[0].text).toMatch(/Yes/i);

    const sent = await request(ctx.url, "/v1/chats/ada/send", {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ text: drafts.body.drafts[0].text }),
    });
    expect(sent.body.ok).toBe(true);
    expect(sent.body.message.isSelf).toBe(true);

    const voice = await request(ctx.url, "/v1/voice", {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({ transcript: "tell them I'm running late" }),
    });
    expect(voice.body.intent).toEqual({ type: "draft", instruction: "I'm running late" });
  });

  it("rejects a bad pairing code and a missing session", async () => {
    const ctx = await start();
    servers.push(ctx.server);

    const bad = await request(ctx.url, "/v1/pair/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "ZZZZ" }),
    });
    expect(bad.res.status).toBe(400);

    const brief = await request(ctx.url, "/v1/brief");
    expect(brief.res.status).toBe(401);
  });

  it("answers CORS preflight", async () => {
    const ctx = await start();
    servers.push(ctx.server);
    const res = await fetch(`${ctx.url}/v1/brief`, {
      method: "OPTIONS",
      headers: { "access-control-request-method": "GET" },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});
