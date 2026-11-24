import { afterEach, describe, expect, it, vi } from "vitest";
import { proposeDrafts, type Briefing, type ChatSummary, type Draft, type SessionInfo, type Thread } from "@brief/shared";
import { BriefApp } from "./app.ts";
import { FakeHost } from "./fakeHost.ts";
import type { BriefApi } from "./api.ts";

const ada: ChatSummary = {
  id: "ada",
  title: "Ada",
  kind: "dm",
  unread: 1,
  preview: "are we still on for 4?",
  updatedAt: "2026-11-24T16:40:00.000Z",
};

const ton: ChatSummary = {
  id: "ton",
  title: "#ton research",
  kind: "channel",
  unread: 2,
  preview: "mainnet window slips 20 min",
  updatedAt: "2026-11-24T16:18:00.000Z",
};

const briefing: Briefing = {
  generatedAt: "2026-11-24T17:00:00.000Z",
  unreadTotal: 3,
  highlights: [ada, ton],
};

const thread: Thread = {
  chat: ada,
  messages: [
    {
      id: "1",
      chatId: "ada",
      author: "Ada",
      isSelf: false,
      text: "are we still on for 4?",
      sentAt: ada.updatedAt,
    },
  ],
};

class FakeApi {
  token: string | undefined;
  sent: Array<{ chatId: string; text: string }> = [];
  draftInstruction: string | undefined;

  setToken(token: string | undefined): void {
    this.token = token;
  }

  async startPairing(): Promise<{ code: string }> {
    return { code: "AB2K" };
  }

  async claimPairing(): Promise<SessionInfo> {
    throw new Error("not complete");
  }

  async session(): Promise<SessionInfo> {
    return { token: this.token ?? "tok", mode: "demo", createdAt: briefing.generatedAt };
  }

  async briefing(): Promise<{ mode: string; briefing: Briefing }> {
    return { mode: "demo", briefing };
  }

  async thread(chatId: string): Promise<Thread> {
    if (chatId !== "ada") throw new Error("unknown chat");
    return thread;
  }

  async drafts(_chatId: string, instruction?: string): Promise<{ drafts: Draft[] }> {
    this.draftInstruction = instruction;
    return {
      drafts: proposeDrafts(thread.messages, instruction).map((d, i) => ({
        ...d,
        id: `d${i}`,
        chatId: "ada",
      })),
    };
  }

  async send(chatId: string, text: string): Promise<void> {
    this.sent.push({ chatId, text });
  }

  async markSeen(): Promise<void> {}

  async voice(transcript: string) {
    const { parseVoiceIntent } = await import("@brief/shared");
    return { transcript, intent: parseVoiceIntent(transcript) };
  }
}

describe("BriefApp", () => {
  const timers: BriefApp[] = [];

  afterEach(() => {
    for (const app of timers.splice(0)) app.stop();
    vi.useRealTimers();
  });

  async function boot() {
    const host = new FakeHost();
    const api = new FakeApi();
    const app = new BriefApp(host, api as unknown as BriefApi, "http://127.0.0.1:8787", () => new Date("2026-11-24T17:05:00.000Z"));
    timers.push(app);
    await app.start();
    await app.claimSession("demo-token");
    return { host, api, app };
  }

  it("shows a pairing code, then a briefing after claim", async () => {
    const host = new FakeHost();
    const api = new FakeApi();
    const app = new BriefApp(host, api as unknown as BriefApi, "http://127.0.0.1:8787");
    timers.push(app);
    await app.start();
    expect(host.header()).toContain("BRIEF");
    expect(host.body()).toContain("A B 2 K");
    await app.claimSession("tok");
    expect(app.state.screen).toBe("brief");
    expect(host.body()).toContain("Ada");
    expect(host.body()).toContain("▶");
    expect(api.token).toBe("tok");
  });

  it("opens a thread, drafts a reply, swipes alternatives, and sends", async () => {
    const { host, api, app } = await boot();
    await app.onEvent({ type: "click" });
    expect(app.state.screen).toBe("thread");
    expect(host.body()).toMatch(/still on for 4/);

    await app.onEvent({ type: "click" });
    expect(app.state.screen).toBe("draft");
    expect(host.body()).toMatch(/SEND TO ADA/);
    expect(host.body()).toMatch(/Yes/i);
    const first = app.state.drafts[0].text;

    await app.onEvent({ type: "scroll-down" });
    expect(app.state.draftIndex).toBe(1);
    expect(host.body()).toContain(app.state.drafts[1].text);

    await app.onEvent({ type: "scroll-up" });
    await app.onEvent({ type: "click" });
    expect(api.sent).toEqual([{ chatId: "ada", text: first }]);
    expect(app.state.screen).toBe("sent");
    expect(host.body()).toMatch(/Sent to Ada/);
  });

  it("uses a spoken instruction to rewrite the draft", async () => {
    const { host, api, app } = await boot();
    await app.applyTranscript("tell them I'm running ten minutes late");
    expect(app.state.screen).toBe("draft");
    expect(api.draftInstruction).toBe("I'm running ten minutes late");
    expect(host.body().toLowerCase()).toContain("ten minutes late");
  });

  it("asks the OS for the exit confirmation dialog from the briefing", async () => {
    const { host, app } = await boot();
    await app.onEvent({ type: "double-click" });
    expect(host.shutdownMode).toBe(1);
  });

  it("goes back from a thread without exiting", async () => {
    const { host, app } = await boot();
    await app.onEvent({ type: "click" });
    await app.onEvent({ type: "double-click" });
    expect(app.state.screen).toBe("brief");
    expect(host.shutdownMode).toBeNull();
  });
});
