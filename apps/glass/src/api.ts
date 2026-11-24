import type { Briefing, Draft, SessionInfo, Thread, VoiceIntent } from "@brief/shared";

export class BriefApi {
  constructor(
    private readonly baseUrl: string,
    private token: string | undefined = undefined,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  setToken(token: string | undefined): void {
    this.token = token;
  }

  async startPairing(): Promise<{ code: string }> {
    return this.request("POST", "/v1/pair/start");
  }

  async claimPairing(code: string): Promise<SessionInfo> {
    return this.request("GET", `/v1/pair/claim?code=${encodeURIComponent(code)}`);
  }

  async session(): Promise<SessionInfo> {
    return this.request("GET", "/v1/session");
  }

  async briefing(): Promise<{ mode: string; briefing: Briefing }> {
    return this.request("GET", "/v1/brief");
  }

  async thread(chatId: string): Promise<Thread> {
    return this.request("GET", `/v1/chats/${encodeURIComponent(chatId)}`);
  }

  async drafts(chatId: string, instruction?: string): Promise<{ drafts: Draft[] }> {
    return this.request("POST", `/v1/chats/${encodeURIComponent(chatId)}/drafts`, { instruction });
  }

  async send(chatId: string, text: string): Promise<void> {
    await this.request("POST", `/v1/chats/${encodeURIComponent(chatId)}/send`, { text });
  }

  async markSeen(chatId: string): Promise<void> {
    await this.request("POST", `/v1/chats/${encodeURIComponent(chatId)}/seen`);
  }

  async voice(transcript: string): Promise<{ transcript: string; intent: VoiceIntent | null }> {
    return this.request("POST", "/v1/voice", { transcript });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["content-type"] = "application/json";
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json()) as T & { error?: string };
    if (!res.ok) throw new Error(json.error ?? `request failed (${res.status})`);
    return json;
  }
}
