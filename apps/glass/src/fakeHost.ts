import type { GlassesEvent, GlassesHost, PageSpec, Unsubscribe } from "./host.ts";

export class FakeHost implements GlassesHost {
  pages: PageSpec[] = [];
  shutdownMode: number | null = null;
  audio = false;
  storage = new Map<string, string>();
  private listeners: Array<(event: GlassesEvent) => void> = [];

  async createStartUpPage(page: PageSpec): Promise<number> {
    this.pages.push(page);
    return 0;
  }

  async rebuildPage(page: PageSpec): Promise<boolean> {
    this.pages.push(page);
    return true;
  }

  async upgradeText(id: number, name: string, content: string, textColor?: number): Promise<boolean> {
    const current = this.pages.at(-1);
    if (!current) return false;
    const next = {
      ...current,
      texts: current.texts.map((t) => (t.id === id && t.name === name ? { ...t, content, textColor: textColor ?? t.textColor } : t)),
    };
    this.pages.push(next);
    return true;
  }

  async shutdown(mode: 0 | 1): Promise<boolean> {
    this.shutdownMode = mode;
    return true;
  }

  async audioControl(on: boolean): Promise<boolean> {
    this.audio = on;
    return true;
  }

  async setLocal(key: string, value: string): Promise<boolean> {
    if (value) this.storage.set(key, value);
    else this.storage.delete(key);
    return true;
  }

  async getLocal(key: string): Promise<string> {
    return this.storage.get(key) ?? "";
  }

  onEvent(handler: (event: GlassesEvent) => void): Unsubscribe {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  emit(event: GlassesEvent): void {
    for (const handler of this.listeners) handler(event);
  }

  get last(): PageSpec | undefined {
    return this.pages.at(-1);
  }

  body(): string {
    return this.last?.texts.find((t) => t.name === "body")?.content ?? "";
  }

  header(): string {
    return this.last?.texts.find((t) => t.name === "header")?.content ?? "";
  }
}
