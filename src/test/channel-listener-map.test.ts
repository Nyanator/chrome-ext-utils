import { ChannelListenerMap } from "../channel-listener-map";

import { TestChannelMap, TestInterface, TestType } from "./mock-interface";

describe("ChannelListenerMap クラス", () => {
  it("正しくリスナーを登録できる", async () => {
    const map = ChannelListenerMap();
    const channelListener = () => {};

    map.channel({
      channel1: channelListener,
    });

    expect(map.getListeners().has("channel1")).toBe(true);
  });

  it("リスナーを正しく解除できる", () => {
    const map = ChannelListenerMap();
    const channelListener = () => {};

    map.channel({
      channel1: channelListener,
    });

    map.remove({ channelKey: "channel1", removeTarget: channelListener });

    expect(map.getListeners().get("channel1")?.length).toBe(0);
  });

  it("登録されていないリスナーを解除しても何も起きない", () => {
    const map = ChannelListenerMap();
    const channelListener = () => {};
    const unRegisterdchannelListener = () => {};

    map.channel({
      channel1: channelListener,
    });

    map.remove({
      channelKey: "unRegisterdchannelListener",
      removeTarget: unRegisterdchannelListener,
    });
  });

  it("チャンネルキーに紐づくリスナーを全て解除できる", () => {
    const map = ChannelListenerMap();

    map.channel({
      channel1: () => {},
    });

    map.channel({
      channel1: () => {},
    });

    map.removeForChannel("channel1");
    expect(map.getListeners().get("channel1")?.length).toBe(0);
  });

  it("全てのリスナーを解除できる", () => {
    const map = ChannelListenerMap();

    map.channel({
      channel1: () => {},
      channel2: () => {},
    });
    map.clear();

    expect(map.getListeners().size).toBe(0);
  });

  /* eslint-disable */
  it("リスナーの型推論が働いているか", async () => {
    const map = ChannelListenerMap<TestChannelMap>();
    // 型推論が働けばコンパイルが通る
    map.channel({
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
});
