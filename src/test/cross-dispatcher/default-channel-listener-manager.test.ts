import { DefaultChanneListenerManager } from "../../cross-dispatcher/default-channel-listener-manager";
import { createChannelListenerManager } from "../../cross-dispatcher/factories";

import { TestChannelMap, TestInterface, TestType } from "./mock-interface";

describe("DefaultChannelListenerManager クラス", () => {
  it("正しくリスナーを登録できる", async () => {
    const manager = createChannelListenerManager();
    const channelListener = () => {};

    manager.channel({
      channel1: channelListener,
    });

    expect(manager.getAllChannelListeners().has("channel1")).toBe(true);
  });

  it("リスナーを正しく解除できる", () => {
    const manager = createChannelListenerManager();
    const channelListener = () => {};

    manager.channel({
      channel1: channelListener,
    });

    manager.removeListener("channel1", channelListener);

    expect(manager.getAllChannelListeners().get("channel1")?.length).toBe(0);
  });

  it("登録されていないリスナーを解除しても何も起きない", () => {
    const manager = createChannelListenerManager();
    const channelListener = () => {};
    const unRegisterdchannelListener = () => {};

    manager.channel({
      channel1: channelListener,
    });

    manager.removeListener(
      "unRegisterdchannelListener",
      unRegisterdchannelListener,
    );
  });

  it("チャンネルキーに紐づくリスナーを全て解除できる", () => {
    const manager = createChannelListenerManager();

    manager.channel({
      channel1: () => {},
    });

    manager.channel({
      channel1: () => {},
    });

    manager.removeAllListenersForChannel("channel1");
    expect(manager.getAllChannelListeners().get("channel1")?.length).toBe(0);
  });

  it("全てのリスナーを解除できる", () => {
    const manager = createChannelListenerManager();

    manager.channel({
      channel1: () => {},
      channel2: () => {},
    });
    manager.clearAllListeners();

    expect(manager.getAllChannelListeners().size).toBe(0);
  });

  /* eslint-disable */
  it("リスナーの型推論が働いているか", async () => {
    const manager = createChannelListenerManager<TestChannelMap>();
    // 型推論が働けばコンパイルが通る
    manager.channel({
      channel1: (_data: number) => {
        return 1;
      },
      channel2: (_data: string) => {
        return "abc";
      },
      channel3: (_data: Map<string, string>) => {
        return new Map<string, string>();
      },
      channel4: (_data: TestInterface) => {
        return { value: 1 };
      },
      channel5: (_data: TestType) => {
        return { value: 1 };
      },
      channel6: (_data: Record<string, number>) => {
        return { value: 1 };
      },
      channel7: (_data: undefined) => {
        return undefined;
      },
      channel8: (_data: unknown) => {
        return 1;
      },
      channel9: (_data: null) => {
        return null;
      },
      channel10: (_data: any) => {
        return 1;
      },
    });
  });
  /* eslint-enable */

  it("コンストラクタが実行できる", () => {
    new DefaultChanneListenerManager();
  });
});
