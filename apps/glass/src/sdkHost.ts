import {
  AudioInputSource,
  CreateStartUpPageContainer,
  MenuContainerProperty,
  MenuItemProperty,
  OsEventTypeList,
  RebuildPageContainer,
  TextContainerProperty,
  waitForEvenAppBridge,
  type EvenAppBridge,
} from "@evenrealities/even_hub_sdk";
import type { GlassesEvent, GlassesHost, PageSpec, Unsubscribe } from "./host.ts";

export class EvenHubHost implements GlassesHost {
  constructor(private readonly bridge: EvenAppBridge) {}

  static async connect(): Promise<EvenHubHost> {
    return new EvenHubHost(await waitForEvenAppBridge());
  }

  async createStartUpPage(page: PageSpec): Promise<number> {
    return this.bridge.createStartUpPageContainer(toStartup(page));
  }

  async rebuildPage(page: PageSpec): Promise<boolean> {
    return this.bridge.rebuildPageContainer(toRebuild(page));
  }

  async upgradeText(id: number, name: string, content: string, textColor?: number): Promise<boolean> {
    const { TextContainerUpgrade } = await import("@evenrealities/even_hub_sdk");
    return this.bridge.textContainerUpgrade(
      new TextContainerUpgrade({ containerID: id, containerName: name, content, textColor }),
    );
  }

  async shutdown(mode: 0 | 1): Promise<boolean> {
    return this.bridge.shutDownPageContainer(mode);
  }

  async audioControl(on: boolean, source: "glasses" | "phone" = "glasses"): Promise<boolean> {
    return this.bridge.audioControl(
      on,
      source === "phone" ? AudioInputSource.Phone : AudioInputSource.Glasses,
    );
  }

  async setLocal(key: string, value: string): Promise<boolean> {
    return this.bridge.setLocalStorage(key, value);
  }

  async getLocal(key: string): Promise<string> {
    return this.bridge.getLocalStorage(key);
  }

  onEvent(handler: (event: GlassesEvent) => void): Unsubscribe {
    return this.bridge.onEvenHubEvent((event) => {
      const mapped = mapEvent(event);
      if (mapped) handler(mapped);
    });
  }
}

function toStartup(page: PageSpec): CreateStartUpPageContainer {
  return new CreateStartUpPageContainer({
    containerTotalNum: page.texts.length,
    textObject: page.texts.map(toText),
    menuObject: toMenu(page),
  });
}

function toRebuild(page: PageSpec): RebuildPageContainer {
  return new RebuildPageContainer({
    containerTotalNum: page.texts.length,
    textObject: page.texts.map(toText),
    menuObject: toMenu(page),
  });
}

function toText(block: PageSpec["texts"][number]): TextContainerProperty {
  return new TextContainerProperty({
    containerID: block.id,
    containerName: block.name,
    xPosition: block.x,
    yPosition: block.y,
    width: block.width,
    height: block.height,
    content: block.content,
    textColor: block.textColor,
    borderWidth: 0,
    borderColor: 5,
    paddingLength: 4,
    isEventCapture: block.capture ? 1 : 0,
  });
}

function toMenu(page: PageSpec): MenuContainerProperty | undefined {
  if (!page.menu.length) return undefined;
  return new MenuContainerProperty({
    menuItems: page.menu.map((item) => new MenuItemProperty({ itemID: item.id, itemName: item.name })),
  });
}

function eventTypeOf(envelope?: { eventType?: OsEventTypeList }): OsEventTypeList | null {
  if (!envelope) return null;
  return envelope.eventType ?? OsEventTypeList.CLICK_EVENT;
}

function mapEvent(event: {
  textEvent?: { eventType?: OsEventTypeList };
  sysEvent?: { eventType?: OsEventTypeList };
  menuItemClickEvent?: { itemID?: number };
  audioEvent?: { audioPcm?: Uint8Array };
}): GlassesEvent | null {
  const itemId = event.menuItemClickEvent?.itemID;
  if (itemId) return { type: "menu", itemId };

  const pcm = event.audioEvent?.audioPcm;
  if (pcm) return { type: "audio", pcm };

  const type = eventTypeOf(event.textEvent) ?? eventTypeOf(event.sysEvent);
  switch (type) {
    case OsEventTypeList.DOUBLE_CLICK_EVENT:
      return { type: "double-click" };
    case OsEventTypeList.CLICK_EVENT:
      return { type: "click" };
    case OsEventTypeList.SCROLL_TOP_EVENT:
      return { type: "scroll-up" };
    case OsEventTypeList.SCROLL_BOTTOM_EVENT:
      return { type: "scroll-down" };
    case OsEventTypeList.LONG_PRESS_EVENT:
      return { type: "long-press" };
    case OsEventTypeList.LONG_PRESS_RELEASE_EVENT:
      return { type: "long-press-release" };
    case OsEventTypeList.SYSTEM_EXIT_EVENT:
    case OsEventTypeList.ABNORMAL_EXIT_EVENT:
      return { type: "exit" };
    default:
      return null;
  }
}
