export interface TextBlock {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  textColor: number;
  capture: boolean;
}

export interface MenuItem {
  id: number;
  name: string;
}

export interface PageSpec {
  texts: TextBlock[];
  menu: MenuItem[];
}

export type GlassesEvent =
  | { type: "click" }
  | { type: "double-click" }
  | { type: "scroll-up" }
  | { type: "scroll-down" }
  | { type: "menu"; itemId: number }
  | { type: "long-press" }
  | { type: "long-press-release" }
  | { type: "audio"; pcm: Uint8Array }
  | { type: "exit" };

export type Unsubscribe = () => void;

export interface GlassesHost {
  createStartUpPage(page: PageSpec): Promise<number>;
  rebuildPage(page: PageSpec): Promise<boolean>;
  upgradeText(id: number, name: string, content: string, textColor?: number): Promise<boolean>;
  shutdown(mode: 0 | 1): Promise<boolean>;
  audioControl(on: boolean, source?: "glasses" | "phone"): Promise<boolean>;
  setLocal(key: string, value: string): Promise<boolean>;
  getLocal(key: string): Promise<string>;
  onEvent(handler: (event: GlassesEvent) => void): Unsubscribe;
}
