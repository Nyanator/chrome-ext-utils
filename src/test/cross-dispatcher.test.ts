import { container } from "tsyringe";

import { ChanneListenerMapImpl, ChannelMap } from "../channel-listener-map";
import {
  CrossDispatcher,
  CrossDispatcherConfig,
  CrossDispatcherImpl,
} from "../cross-dispathcher";
import { ConsoleInjectableLogger } from "../logger";

import { TestChannelMap, TestInterface, TestType } from "./mock-interface";

describe("CrossDispatcherクラス", () => {
  beforeEach(() => {
    container.clearInstances();

    container.register("Logger", {
      useClass: ConsoleInjectableLogger,
    });

    container.register("ChannelListenerMap", {
      useClass: ChanneListenerMapImpl<TestChannelMap>,
    });

    container.register<CrossDispatcher<TestChannelMap>>("CrossDispatcher", {
      useClass: CrossDispatcherImpl<TestChannelMap>,
    });
  });

  it("正しくリスナーを登録できる", async () => {
    const dispatcher =
      container.resolve<CrossDispatcher<TestChannelMap>>("CrossDispatcher");

    const channelData = 1;
    let listenerCalled = false;

    dispatcher.channel({
      channel1: (data: number) => {
        expect(data).toBe(channelData);
        listenerCalled = true;
        return 1;
      },
    });

    const result = await dispatcher.dispatch("channel1", channelData);
    expect(listenerCalled).toBe(true);
    expect(result[0]).toBe(channelData);

    // カバレージのために呼び出しのテスト
    dispatcher.getListeners();
  });

  it("複数のチャンネルキーをディスパッチできる", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    const channelData = "1";
    const listenerCalled: boolean[] = [false, false, false];

    dispatcher.channel({
      channel1: async () => {
        listenerCalled[0] = true;
      },
      channel2: async () => {
        listenerCalled[1] = true;
      },
      channel3: async () => {
        listenerCalled[2] = true;
      },
    });

    Promise.all([
      dispatcher.dispatch("channel1", channelData),
      dispatcher.dispatch("channel2", channelData),
      dispatcher.dispatch("channel3", channelData),
    ]);
    expect(listenerCalled.every((called) => called)).toEqual(true);
  });

  it("複数のリスナーが登録されているときディスパッチしたキーだけが反応する", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    const channelData = "1";
    const listenerCalled: boolean[] = [false, false, false];

    dispatcher.channel({
      channel1: async () => {
        listenerCalled[0] = true;
      },
      channel2: async () => {
        listenerCalled[1] = true;
      },
      channel3: async () => {
        listenerCalled[2] = true;
      },
    });

    await dispatcher.dispatch("channel1", channelData);
    expect(listenerCalled[0]).toEqual(true);
    expect(listenerCalled[1]).toEqual(false);
    expect(listenerCalled[2]).toEqual(false);
  });

  it("非同期リスナー内でawaitしてもデッドロックしない", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    const channelData = 1;
    let listener1Called = false;
    let listener2Called = false;

    dispatcher.channel({
      channel1: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        listener1Called = true;
      },
      channel2: () => {
        listener2Called = true;
      },
    });

    await dispatcher.dispatch("channel1", channelData);
    await dispatcher.dispatch("channel2", channelData);
    expect(listener1Called).toBe(true);
    expect(listener2Called).toBe(true);
  });

  it("同期リスナーと非同期リスナーが混在しても同期的に実行されるため戻り値の順番は変わらない", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    dispatcher.channel({
      channel1: async () => {
        return 1;
      },
    });
    dispatcher.channel({
      channel1: () => {
        return 2;
      },
    });
    dispatcher.channel({
      channel1: async () => {
        return 3;
      },
    });

    const responses = await dispatcher.dispatch("channel1", 1);
    expect(responses[0]).toBe(1);
    expect(responses[1]).toBe(2);
    expect(responses[2]).toBe(3);
  });

  it("同じリスナーを複数回登録すると複数回呼ばれる", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    let incrementCounter = 0;
    const listener = async () => {
      return incrementCounter++;
    };
    dispatcher.channel({
      channel1: listener,
    });
    dispatcher.channel({
      channel1: listener,
    });
    dispatcher.channel({
      channel1: listener,
    });

    const responses = await dispatcher.dispatch("channel1", 1);
    expect(responses[0]).toBe(0);
    expect(responses[1]).toBe(1);
    expect(responses[2]).toBe(2);
  });

  it("同一のチャンネルキーをディスパッチできる", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    const channelData = "1";
    const listenerCalled: boolean[] = [false, false, false];

    dispatcher.channel({
      channel1: async () => {
        listenerCalled[0] = true;
      },
    });

    dispatcher.channel({
      channel1: async () => {
        listenerCalled[1] = true;
      },
    });

    dispatcher.channel({
      channel1: async () => {
        listenerCalled[2] = true;
      },
    });

    await dispatcher.dispatch("channel1", channelData);
    expect(listenerCalled.every((called) => called)).toEqual(true);
  });

  it("strictModeが無効な場合、再起呼び出しの際に空の配列を返す", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: false },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");

    dispatcher.channel({
      channel1: async () => {
        await dispatcher.dispatch("channel2", "abc");
        return 1;
      },
      channel2: async () => {
        await dispatcher.dispatch("channel3", new Map<string, string>());
        return "abc";
      },
      channel3: async () => {
        expect(dispatcher.dispatch("channel1", 3)).toBe([]);
        return new Map<string, string>();
      },
    });

    await dispatcher.dispatch("channel1", 1);
  });

  it("strictModeが有効な場合、再起呼び出しの際に例外が発生する", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: true },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");

    dispatcher.channel({
      channel1: async () => {
        await dispatcher.dispatch("channel2", "abc");
        return 1;
      },
      channel2: async () => {
        await dispatcher.dispatch("channel3", new Map<string, string>());
        return "abc";
      },
      channel3: async () => {
        await expect(dispatcher.dispatch("channel1", 3)).rejects.toThrowError();
        return new Map<string, string>();
      },
    });

    await dispatcher.dispatch("channel1", 1);
  });

  it("strictModeが無効な場合、購読されていないイベントのディスパッチには空の配列を返す", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: false },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    const responses = await dispatcher.dispatch("nonExistentchannel", {});
    expect(responses).toEqual([]);
  });

  it("strictModeが無効な場合、非同期リスナーが例外をスローしても握りつぶす", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: false },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    dispatcher.channel({
      channel1: async () => {
        throw new Error("Test error");
      },
    });

    const responses = await dispatcher.dispatch("channel1", {});
    expect(responses).toEqual([]);
  });

  it("strictModeが無効な場合、同期的なリスナーが例外をスローしても握りつぶす", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: false },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    dispatcher.channel({
      channel1: () => {
        throw new Error("Test error");
      },
    });

    const responses = await dispatcher.dispatch("channel1", {});
    expect(responses).toEqual([]);
  });

  it("strictModeが有効な場合、存在しないイベントのディスパッチには例外をスローする", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: true },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");

    await expect(dispatcher.dispatch("nonExistentchannel", {})).rejects.toThrowError();
  });

  it("strictModeが有効な場合、非同期リスナーが例外をスローすると再スローされる", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: true },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");

    dispatcher.channel({
      channel1: async () => {
        throw new Error("Test error");
      },
    });

    await expect(dispatcher.dispatch("channel1", {})).rejects.toThrowError();
  });

  it("strictModeが有効な場合、同期的なリスナーが例外をスローすると再スローされる", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: true },
    });

    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");

    dispatcher.channel({
      channel1: () => {
        throw new Error("Test error");
      },
    });

    await expect(dispatcher.dispatch("channel1", {})).rejects.toThrowError();
  });

  it("リスナーを正しく解除できる", () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    let listenerCalled = false;
    const channelListener = () => {
      listenerCalled = true;
    };

    dispatcher.channel({
      channel1: channelListener,
    });

    dispatcher.remove("channel1", channelListener);
    dispatcher.dispatch("channel1", {});
    expect(listenerCalled).toBe(false);
  });

  it("登録されていないリスナーを解除しても何も起きない", () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    let listenerCalled = false;
    const channelListener = () => {
      listenerCalled = true;
    };
    const unRegisterdchannelListener = () => {};

    dispatcher.channel({
      channel1: channelListener,
    });

    dispatcher.remove("unRegisterdchannelListener", unRegisterdchannelListener);
    dispatcher.dispatch("channel1", {});
    expect(listenerCalled).toBe(true);
  });

  it("チャンネルキーに紐づくリスナーを全て解除できる", () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    let listenerCalled = false;

    dispatcher.channel({
      channel1: () => {
        listenerCalled = true;
      },
    });

    dispatcher.channel({
      channel1: () => {
        listenerCalled = true;
      },
    });

    dispatcher.removeForChannel("channel1");
    dispatcher.dispatch("channel1", {});
    expect(listenerCalled).toBe(false);
  });

  it("全てのリスナーを解除できる", async () => {
    const dispatcher = container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
    let listener1Called = false;
    let listener2Called = false;

    dispatcher.channel({
      channel1: () => {
        listener1Called = true;
      },
      channel2: () => {
        listener2Called = true;
      },
    });

    dispatcher.clearListeners();
    await expect(dispatcher.dispatch("channel1", {})).rejects.toThrow();
    await expect(dispatcher.dispatch("channel2", {})).rejects.toThrow();
    expect(listener1Called).toBe(false);
    expect(listener2Called).toBe(false);
  });

  /* eslint-disable */
  it("ディスパッチの型推論が働いているか", async () => {
    container.register<CrossDispatcherConfig>("CrossDispatcherConfig", {
      useValue: { strictMode: false },
    });

    const dispatcher =
      container.resolve<CrossDispatcher<TestChannelMap>>("CrossDispatcher");

    // 型推論が働けばコンパイルが通る
    const numbers: number[] = await dispatcher.dispatch("channel1", 1);
    const strings: string[] = await dispatcher.dispatch("channel2", "abc");
    const maps: Map<string, string>[] = await dispatcher.dispatch(
      "channel3",
      new Map<string, string>(),
    );
    const interfaces: TestInterface[] = await dispatcher.dispatch("channel4", {
      value: 1,
    });
    const types: TestType[] = await dispatcher.dispatch("channel5", {
      value: 1,
    });
    const records: Record<string, number>[] = await dispatcher.dispatch("channel6", {
      value: 1,
    });
    const undefines: undefined[] = await dispatcher.dispatch("channel7", undefined);
    const unknowns: unknown[] = await dispatcher.dispatch("channel8", {});
    const nulls: null[] = await dispatcher.dispatch("channel9", null);
    const anys: any[] = await dispatcher.dispatch("channel10", {});
    const undefinedchannels: unknown[] = await dispatcher.dispatch(
      "undefined channel",
      {},
    );
  });
  /* eslint-enable */
});
