import { DefaultEventDispatcher } from "../../event-dispatcher/default-event-dispathcher";
import { createEventDispatcher } from "../../event-dispatcher/factories";
import { TypedEventMap } from "../../event-dispatcher/interfaces";

describe("DefaultEventDispatcherクラス", () => {
  it("正しくイベントハンドラを登録できる", async () => {
    const dispatcher = createEventDispatcher<TestEventMap>();
    const eventData = 1;
    let handlerCalled = false;

    dispatcher.addEventHandlers({
      event1: (data: number) => {
        expect(data).toBe(eventData);
        handlerCalled = true;
        return 1;
      },
    });

    const result = await dispatcher.dispatchEvent("event1", eventData);
    expect(handlerCalled).toBe(true);
    expect(result[0]).toBe(eventData);
  });

  it("複数のイベントキーをディスパッチできる", async () => {
    const dispatcher = createEventDispatcher();
    const eventData = "1";
    const handlerCalled: boolean[] = [false, false, false];

    dispatcher.addEventHandlers({
      event1: async () => {
        handlerCalled[0] = true;
      },
      event2: async () => {
        handlerCalled[1] = true;
      },
      event3: async () => {
        handlerCalled[2] = true;
      },
    });

    Promise.all([
      dispatcher.dispatchEvent("event1", eventData),
      dispatcher.dispatchEvent("event2", eventData),
      dispatcher.dispatchEvent("event3", eventData),
    ]);
    expect(handlerCalled.every((called) => called)).toEqual(true);
  });

  it("複数のイベントハンドラーが登録されているときディスパッチしたキーだけが反応する", async () => {
    const dispatcher = createEventDispatcher();
    const eventData = "1";
    const handlerCalled: boolean[] = [false, false, false];

    dispatcher.addEventHandlers({
      event1: async () => {
        handlerCalled[0] = true;
      },
      event2: async () => {
        handlerCalled[1] = true;
      },
      event3: async () => {
        handlerCalled[2] = true;
      },
    });

    await dispatcher.dispatchEvent("event1", eventData);
    expect(handlerCalled[0]).toEqual(true);
    expect(handlerCalled[1]).toEqual(false);
    expect(handlerCalled[2]).toEqual(false);
  });

  it("非同期ハンドラ内でawaitしてもデッドロックしない", async () => {
    const dispatcher = createEventDispatcher();
    const eventData = 1;
    let handler1Called = false;
    let handler2Called = false;

    dispatcher.addEventHandlers({
      event1: async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        handler1Called = true;
      },
      event2: () => {
        handler2Called = true;
      },
    });

    await dispatcher.dispatchEvent("event1", eventData);
    await dispatcher.dispatchEvent("event2", eventData);

    expect(handler1Called).toBe(true);
    expect(handler2Called).toBe(true);
  });

  it("同期ハンドラと非同期ハンドラが混在しても同期的に実行されるため戻り値の順番は変わらない", async () => {
    const dispatcher = createEventDispatcher<TestEventMap>();
    dispatcher.addEventHandlers({
      event1: async () => {
        return 1;
      },
    });
    dispatcher.addEventHandlers({
      event1: () => {
        return 2;
      },
    });
    dispatcher.addEventHandlers({
      event1: async () => {
        return 3;
      },
    });

    const responses = await dispatcher.dispatchEvent("event1", 1);
    expect(responses[0]).toBe(1);
    expect(responses[1]).toBe(2);
    expect(responses[2]).toBe(3);
  });

  it("同じハンドラを複数回登録すると複数回呼ばれる", async () => {
    const dispatcher = createEventDispatcher<TestEventMap>();
    let incrementCounter = 0;
    const handler = async () => {
      return incrementCounter++;
    };
    dispatcher.addEventHandlers({
      event1: handler,
    });
    dispatcher.addEventHandlers({
      event1: handler,
    });
    dispatcher.addEventHandlers({
      event1: handler,
    });

    const responses = await dispatcher.dispatchEvent("event1", 1);
    expect(responses[0]).toBe(0);
    expect(responses[1]).toBe(1);
    expect(responses[2]).toBe(2);
  });

  it("同一のイベントキーをディスパッチできる", async () => {
    const dispatcher = createEventDispatcher();
    const eventData = "1";
    const handlerCalled: boolean[] = [false, false, false];

    dispatcher.addEventHandlers({
      event1: async () => {
        handlerCalled[0] = true;
      },
    });

    dispatcher.addEventHandlers({
      event1: async () => {
        handlerCalled[1] = true;
      },
    });

    dispatcher.addEventHandlers({
      event1: async () => {
        handlerCalled[2] = true;
      },
    });

    await dispatcher.dispatchEvent("event1", eventData);
    expect(handlerCalled.every((called) => called)).toEqual(true);
  });

  it("strictModeが無効な場合、購読されていないイベントのディスパッチには空の配列を返す", async () => {
    const dispatcher = createEventDispatcher();
    const responses = await dispatcher.dispatchEvent("nonExistentEvent", {});
    expect(responses).toEqual([]);
  });

  it("strictModeが無効な場合、非同期ハンドラが例外をスローしても握りつぶす", async () => {
    const dispatcher = createEventDispatcher();
    dispatcher.addEventHandlers({
      event1: async () => {
        throw new Error("Test error");
      },
    });

    const responses = await dispatcher.dispatchEvent("event1", {});
    expect(responses).toEqual([]);
  });

  it("strictModeが無効な場合、同期的なハンドラが例外をスローしても握りつぶす", async () => {
    const dispatcher = createEventDispatcher();
    dispatcher.addEventHandlers({
      event1: () => {
        throw new Error("Test error");
      },
    });

    const responses = await dispatcher.dispatchEvent("event1", {});
    expect(responses).toEqual([]);
  });

  it("strictModeが有効な場合、存在しないイベントのディスパッチには例外をスローする", async () => {
    const dispatcher = createEventDispatcher(true);

    await expect(
      dispatcher.dispatchEvent("nonExistentEvent", {}),
    ).rejects.toThrowError();
  });

  it("strictModeが有効な場合、非同期ハンドラが例外をスローすると再スローされる", async () => {
    const dispatcher = createEventDispatcher(true);

    dispatcher.addEventHandlers({
      event1: async () => {
        throw new Error("Test error");
      },
    });

    await expect(dispatcher.dispatchEvent("event1", {})).rejects.toThrowError();
  });

  it("strictModeが有効な場合、同期的なハンドラが例外をスローすると再スローされる", async () => {
    const dispatcher = createEventDispatcher(true);

    dispatcher.addEventHandlers({
      event1: () => {
        throw new Error("Test error");
      },
    });

    await expect(dispatcher.dispatchEvent("event1", {})).rejects.toThrowError();
  });

  it("非同期ハンドラが何故かError以外をスローしたとき 不正なスローを例外で報告する", async () => {
    const dispatcher = createEventDispatcher();
    dispatcher.addEventHandlers({
      event1: async () => {
        throw 1;
      },
    });

    await expect(dispatcher.dispatchEvent("event1", {})).rejects.toThrowError();
  });

  it("同期的なハンドラが何故かError以外をスローしたとき 不正なスローを例外で報告する", async () => {
    const dispatcher = createEventDispatcher();
    dispatcher.addEventHandlers({
      event1: () => {
        throw 1;
      },
    });

    await expect(dispatcher.dispatchEvent("event1", {})).rejects.toThrowError();
  });

  it("ハンドラを正しく解除できる", () => {
    const dispatcher = createEventDispatcher();
    let handlerCalled = false;
    const eventHandler = () => {
      handlerCalled = true;
    };

    dispatcher.addEventHandlers({
      event1: eventHandler,
    });

    dispatcher.removeHandler("event1", eventHandler);
    dispatcher.dispatchEvent("event1", {});
    expect(handlerCalled).toBe(false);
  });

  it("登録されていないハンドラを解除しても何も起きない", () => {
    const dispatcher = createEventDispatcher();
    let handlerCalled = false;
    const eventHandler = () => {
      handlerCalled = true;
    };
    const unRegisterdEventHandler = () => {};

    dispatcher.addEventHandlers({
      event1: eventHandler,
    });

    dispatcher.removeHandler(
      "unRegisterdEventHandler",
      unRegisterdEventHandler,
    );
    dispatcher.dispatchEvent("event1", {});
    expect(handlerCalled).toBe(true);
  });

  it("イベントキーに紐づくハンドラを全て解除できる", () => {
    const dispatcher = createEventDispatcher();
    let handlerCalled = false;

    dispatcher.addEventHandlers({
      event1: () => {
        handlerCalled = true;
      },
    });

    dispatcher.addEventHandlers({
      event1: () => {
        handlerCalled = true;
      },
    });

    dispatcher.removeAllHandlersForEvent("event1");
    dispatcher.dispatchEvent("event1", {});
    expect(handlerCalled).toBe(false);
  });

  it("全てのハンドラを解除できる", () => {
    const dispatcher = createEventDispatcher();
    let handler1Called = false;
    let handler2Called = false;

    dispatcher.addEventHandlers({
      event1: () => {
        handler1Called = true;
      },
      event2: () => {
        handler2Called = true;
      },
    });

    dispatcher.clearAllHandlers();
    dispatcher.dispatchEvent("event1", {});
    dispatcher.dispatchEvent("event2", {});
    expect(handler1Called).toBe(false);
    expect(handler2Called).toBe(false);
  });

  /* eslint-disable */
  it("イベントハンドラの型推論が働いているか", async () => {
    const dispatcher = createEventDispatcher<TestEventMap>();
    // 型推論が働けばコンパイルが通る
    dispatcher.addEventHandlers({
      event1: (_data: number) => {
        return 1;
      },
      event2: (_data: string) => {
        return "abc";
      },
      event3: (_data: Map<string, string>) => {
        return new Map<string, string>();
      },
      event4: (_data: TestInterface) => {
        return { value: 1 };
      },
      event5: (_data: TestType) => {
        return { value: 1 };
      },
      event6: (_data: Record<string, number>) => {
        return { value: 1 };
      },
      event7: (_data: undefined) => {
        return undefined;
      },
      event8: (_data: unknown) => {
        return 1;
      },
      event9: (_data: null) => {
        return null;
      },
      event10: (_data: any) => {
        return 1;
      },
    });
  });

  it("ディスパッチの型推論が働いているか", async () => {
    const dispatcher = createEventDispatcher<TestEventMap>();
    // 型推論が働けばコンパイルが通る
    const numbers: number[] = await dispatcher.dispatchEvent("event1", 1);
    const strings: string[] = await dispatcher.dispatchEvent("event2", "abc");
    const maps: Map<string, string>[] = await dispatcher.dispatchEvent(
      "event3",
      new Map<string, string>(),
    );
    const interfaces: TestInterface[] = await dispatcher.dispatchEvent(
      "event4",
      { value: 1 },
    );
    const types: TestType[] = await dispatcher.dispatchEvent("event5", {
      value: 1,
    });
    const records: Record<string, number>[] = await dispatcher.dispatchEvent(
      "event6",
      { value: 1 },
    );
    const undefines: undefined[] = await dispatcher.dispatchEvent(
      "event7",
      undefined,
    );
    const unknowns: unknown[] = await dispatcher.dispatchEvent("event8", {});
    const nulls: null[] = await dispatcher.dispatchEvent("event9", null);
    const anys: any[] = await dispatcher.dispatchEvent("event10", {});
    const undefinedEvents: unknown[] = await dispatcher.dispatchEvent(
      "undefined event",
      {},
    );
  });
  /* eslint-enable */

  it("コンストラクタが実行できる", () => {
    new DefaultEventDispatcher();
  });
});

interface TestInterface {
  value: number;
}

type TestType = {
  value: number;
};

interface TestEventMap extends TypedEventMap {
  event1: {
    readonly data: number;
    readonly response: number;
  };
  event2: {
    readonly data: string;
    readonly response: string;
  };
  event3: {
    readonly data: Map<string, string>;
    readonly response: Map<string, string>;
  };
  event4: {
    readonly data: TestInterface;
    readonly response: TestInterface;
  };
  event5: {
    readonly data: TestType;
    readonly response: TestType;
  };
  event6: {
    readonly data: Record<string, number>;
    readonly response: Record<string, number>;
  };
  event7: {
    readonly data: undefined;
    readonly response: undefined;
  };
  event8: {
    readonly data: unknown;
    readonly response: unknown;
  };
  event9: {
    readonly data: null;
    readonly response: null;
  };
  event10: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly data: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly response: any;
  };
}
