import { concatPcm, isSilentPcm, parseVoiceIntent, type Briefing, type Draft, type Thread } from "@brief/shared";
import type { BriefApi } from "./api.ts";
import type { GlassesEvent, GlassesHost, PageSpec } from "./host.ts";
import {
  MENU,
  bootPage,
  briefPage,
  draftPage,
  errorPage,
  listeningPage,
  pairingPage,
  sentPage,
  threadPage,
} from "./screens.ts";

const SESSION_KEY = "brief.session";
const SENT_MS = 1400;

export type ScreenName = "boot" | "pair" | "brief" | "thread" | "draft" | "listen" | "sent" | "error";

export interface AppState {
  screen: ScreenName;
  code?: string;
  briefing?: Briefing;
  selected: number;
  thread?: Thread;
  drafts: Draft[];
  draftIndex: number;
  error?: string;
  listening: boolean;
}

export class BriefApp {
  state: AppState = { screen: "boot", selected: 0, drafts: [], draftIndex: 0, listening: false };
  private started = false;
  private audio: Uint8Array[] = [];
  private sentTimer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;

  constructor(
    private readonly host: GlassesHost,
    private readonly api: BriefApi,
    private readonly companionUrl: string,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.host.onEvent((event) => {
      void this.onEvent(event);
    });
    await this.render(bootPage(), "startup");
    try {
      const stored = await this.host.getLocal(SESSION_KEY);
      if (stored) {
        this.api.setToken(stored);
        await this.api.session();
        await this.loadBrief();
        return;
      }
    } catch {
      this.api.setToken(undefined);
      await this.host.setLocal(SESSION_KEY, "");
    }
    const { code } = await this.api.startPairing();
    this.state = { ...this.state, screen: "pair", code };
    await this.render(pairingPage(code, this.companionUrl));
    void this.waitForPair();
  }

  private async waitForPair(): Promise<void> {
    const code = this.state.code;
    if (!code) return;
    for (let i = 0; i < 150 && this.state.screen === "pair" && !this.stopped; i += 1) {
      try {
        const info = await this.api.claimPairing(code);
        await this.claimSession(info.token);
        return;
      } catch {
        await delay(2000);
      }
    }
  }

  async claimSession(token: string): Promise<void> {
    this.api.setToken(token);
    await this.host.setLocal(SESSION_KEY, token);
    await this.loadBrief();
  }

  async loadBrief(): Promise<void> {
    const { briefing } = await this.api.briefing();
    this.state = {
      ...this.state,
      screen: "brief",
      briefing,
      selected: 0,
      thread: undefined,
      drafts: [],
      draftIndex: 0,
    };
    await this.render(briefPage(briefing, 0, this.clock().toISOString()));
  }

  async onEvent(event: GlassesEvent): Promise<void> {
    if (event.type === "exit") {
      await this.host.audioControl(false);
      return;
    }
    if (event.type === "audio") {
      this.audio.push(event.pcm);
      return;
    }
    if (event.type === "double-click") {
      await this.backOrExit();
      return;
    }
    if (event.type === "menu") {
      await this.onMenu(event.itemId);
      return;
    }
    if (event.type === "long-press") {
      await this.beginListen();
      return;
    }
    if (event.type === "long-press-release" && this.state.screen === "listen") {
      await this.finishListen();
      return;
    }
    if (event.type === "scroll-down") {
      await this.move(1);
      return;
    }
    if (event.type === "scroll-up") {
      await this.move(-1);
      return;
    }
    if (event.type === "click") {
      await this.primary();
    }
  }

  private async primary(): Promise<void> {
    switch (this.state.screen) {
      case "brief":
        await this.openSelected();
        return;
      case "thread":
        await this.openDrafts();
        return;
      case "draft":
        await this.sendDraft();
        return;
      case "listen":
        await this.finishListen();
        return;
      default:
        return;
    }
  }

  private async move(delta: number): Promise<void> {
    if (this.state.screen === "brief" && this.state.briefing) {
      const max = Math.max(this.state.briefing.highlights.length - 1, 0);
      this.state.selected = clamp(this.state.selected + delta, 0, max);
      await this.render(briefPage(this.state.briefing, this.state.selected, this.clock().toISOString()));
      return;
    }
    if (this.state.screen === "draft" && this.state.drafts.length && this.state.thread) {
      const max = this.state.drafts.length - 1;
      this.state.draftIndex = clamp(this.state.draftIndex + delta, 0, max);
      await this.render(draftPage(this.state.thread.chat.title, this.state.drafts, this.state.draftIndex));
    }
  }

  private async openSelected(): Promise<void> {
    const chat = this.state.briefing?.highlights[this.state.selected];
    if (!chat) return;
    const thread = await this.api.thread(chat.id);
    this.state = { ...this.state, screen: "thread", thread };
    await this.render(threadPage(thread));
  }

  private async openDrafts(instruction?: string): Promise<void> {
    const chatId = this.state.thread?.chat.id ?? this.state.briefing?.highlights[this.state.selected]?.id;
    if (!chatId) return;
    const thread = this.state.thread ?? (await this.api.thread(chatId));
    const { drafts } = await this.api.drafts(chatId, instruction);
    this.state = { ...this.state, screen: "draft", thread, drafts, draftIndex: 0 };
    await this.render(draftPage(thread.chat.title, drafts, 0));
  }

  private async sendDraft(): Promise<void> {
    const thread = this.state.thread;
    const draft = this.state.drafts[this.state.draftIndex];
    if (!thread || !draft) return;
    await this.api.send(thread.chat.id, draft.text);
    this.state = { ...this.state, screen: "sent" };
    await this.render(sentPage(thread.chat.title));
    this.sentTimer = setTimeout(() => {
      void this.loadBrief();
    }, SENT_MS);
  }

  private async beginListen(): Promise<void> {
    if (this.state.screen === "pair" || this.state.screen === "boot") return;
    this.audio = [];
    this.state = { ...this.state, screen: "listen", listening: true };
    await this.render(listeningPage());
    await this.host.audioControl(true, "glasses");
  }

  private async finishListen(): Promise<void> {
    await this.host.audioControl(false);
    this.state.listening = false;
    const pcm = concatPcm(this.audio);
    this.audio = [];
    if (isSilentPcm(pcm)) {
      await this.restoreAfterListen();
      return;
    }
    // PCM is forwarded only when a transcript helper is provided.
    // Tests and the demo injector call applyTranscript() directly.
    await this.restoreAfterListen();
  }

  async applyTranscript(transcript: string): Promise<void> {
    const { intent } = await this.api.voice(transcript).catch(() => ({
      transcript,
      intent: parseVoiceIntent(transcript),
    }));
    if (!intent) {
      await this.restoreAfterListen();
      return;
    }
    switch (intent.type) {
      case "next":
        this.state.screen = this.state.thread ? (this.state.drafts.length ? "draft" : "thread") : "brief";
        await this.move(1);
        return;
      case "back":
        await this.backOrExit();
        return;
      case "open":
        this.state.screen = "brief";
        await this.openSelected();
        return;
      case "draft":
        await this.openDrafts(intent.instruction);
        return;
      case "dictate":
        await this.openDrafts(intent.text);
        return;
      case "send":
        if (this.state.drafts.length) {
          this.state.screen = "draft";
          await this.sendDraft();
        }
        return;
      case "listen":
        await this.beginListen();
        return;
      case "exit":
        await this.host.shutdown(1);
        return;
      default:
        await this.restoreAfterListen();
    }
  }

  private async restoreAfterListen(): Promise<void> {
    if (this.state.drafts.length && this.state.thread) {
      this.state.screen = "draft";
      await this.render(draftPage(this.state.thread.chat.title, this.state.drafts, this.state.draftIndex));
      return;
    }
    if (this.state.thread) {
      this.state.screen = "thread";
      await this.render(threadPage(this.state.thread));
      return;
    }
    if (this.state.briefing) {
      this.state.screen = "brief";
      await this.render(briefPage(this.state.briefing, this.state.selected, this.clock().toISOString()));
      return;
    }
    this.state.screen = "error";
    await this.render(errorPage("No inbox yet."));
  }

  private async onMenu(itemId: number): Promise<void> {
    if (itemId === MENU.listen) {
      await this.beginListen();
      return;
    }
    if (itemId === MENU.next) {
      await this.move(1);
      return;
    }
    if (itemId === MENU.draft) {
      await this.openDrafts();
      return;
    }
    if (itemId === MENU.seen) {
      const id = this.state.thread?.chat.id ?? this.state.briefing?.highlights[this.state.selected]?.id;
      if (id) {
        await this.api.markSeen(id);
        await this.loadBrief();
      }
    }
  }

  private async backOrExit(): Promise<void> {
    if (this.state.screen === "draft" && this.state.thread) {
      this.state.screen = "thread";
      await this.render(threadPage(this.state.thread));
      return;
    }
    if (this.state.screen === "listen") {
      await this.host.audioControl(false);
      await this.restoreAfterListen();
      return;
    }
    if (this.state.screen === "thread" && this.state.briefing) {
      this.state.screen = "brief";
      this.state.thread = undefined;
      this.state.drafts = [];
      await this.render(briefPage(this.state.briefing, this.state.selected, this.clock().toISOString()));
      return;
    }
    await this.host.shutdown(1);
  }

  private async render(page: PageSpec, mode: "startup" | "rebuild" = "rebuild"): Promise<void> {
    if (mode === "startup" || !this.startedPage) {
      const result = await this.host.createStartUpPage(page);
      if (result !== 0) {
        this.state = { ...this.state, screen: "error", error: `display failed (${result})` };
        return;
      }
      this.startedPage = true;
      return;
    }
    await this.host.rebuildPage(page);
  }

  private startedPage = false;

  stop(): void {
    this.stopped = true;
    if (this.sentTimer) clearTimeout(this.sentTimer);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
