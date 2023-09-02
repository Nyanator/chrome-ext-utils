import { CrossDispatcher } from "../cross-dispathcher";

import { TestChannelMap, TestInterface, TestType } from "./mock-interface";

describe("CrossDispatcherクラス", () => {
    it("正しくリスナーを登録できる", async () => {
        const dispatcher = CrossDispatcher<TestChannelMap>();
        const channelData = 1;
        let listenerCalled = false;

        dispatcher.channel({
            channel1: (data: number) => {
                expect(data).toBe(channelData);
                listenerCalled = true;
                return 1;
            },
        });

        const result = await dispatcher.dispatch({
            channelKey: "channel1",
            channelData,
        });
        expect(listenerCalled).toBe(true);
        expect(result[0]).toBe(channelData);

        // カバレージのために呼び出しのテスト
        dispatcher.getListeners();
    });

    it("複数のチャンネルキーをディスパッチできる", async () => {
        const dispatcher = CrossDispatcher();
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
            dispatcher.dispatch({
                channelKey: "channel1",
                channelData,
            }),
            dispatcher.dispatch({
                channelKey: "channel2",
                channelData,
            }),
            dispatcher.dispatch({
                channelKey: "channel3",
                channelData,
            }),
        ]);
        expect(listenerCalled.every((called) => called)).toEqual(true);
    });

    it("複数のリスナーが登録されているときディスパッチしたキーだけが反応する", async () => {
        const dispatcher = CrossDispatcher();
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

        await dispatcher.dispatch({
            channelKey: "channel1",
            channelData,
        });
        expect(listenerCalled[0]).toEqual(true);
        expect(listenerCalled[1]).toEqual(false);
        expect(listenerCalled[2]).toEqual(false);
    });

    it("非同期リスナー内でawaitしてもデッドロックしない", async () => {
        const dispatcher = CrossDispatcher();
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

        await dispatcher.dispatch({
            channelKey: "channel1",
            channelData,
        });
        await dispatcher.dispatch({
            channelKey: "channel2",
            channelData,
        });
        expect(listener1Called).toBe(true);
        expect(listener2Called).toBe(true);
    });

    it("同期リスナーと非同期リスナーが混在しても同期的に実行されるため戻り値の順番は変わらない", async () => {
        const dispatcher = CrossDispatcher<TestChannelMap>();
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

        const responses = await dispatcher.dispatch({
            channelKey: "channel1",
            channelData: 1,
        });
        expect(responses[0]).toBe(1);
        expect(responses[1]).toBe(2);
        expect(responses[2]).toBe(3);
    });

    it("同じリスナーを複数回登録すると複数回呼ばれる", async () => {
        const dispatcher = CrossDispatcher<TestChannelMap>();
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

        const responses = await dispatcher.dispatch({
            channelKey: "channel1",
            channelData: 1,
        });
        expect(responses[0]).toBe(0);
        expect(responses[1]).toBe(1);
        expect(responses[2]).toBe(2);
    });

    it("同一のチャンネルキーをディスパッチできる", async () => {
        const dispatcher = CrossDispatcher();
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

        await dispatcher.dispatch({
            channelKey: "channel1",
            channelData: channelData,
        });
        expect(listenerCalled.every((called) => called)).toEqual(true);
    });

    it("strictModeが無効な場合、再起呼び出しの際に空の配列を返す", async () => {
        const dispatcher = CrossDispatcher<TestChannelMap>({
            strictMode: false,
        });

        dispatcher.channel({
            channel1: async () => {
                await dispatcher.dispatch({
                    channelKey: "channel2",
                    channelData: "abc",
                });
                return 1;
            },
            channel2: async () => {
                await dispatcher.dispatch({
                    channelKey: "channel3",
                    channelData: new Map<string, string>(),
                });
                return "abc";
            },
            channel3: async () => {
                await expect(
                    dispatcher.dispatch({
                        channelKey: "channel1",
                        channelData: 3,
                    }),
                ).toBe([]);
                return new Map<string, string>();
            },
        });

        await dispatcher.dispatch({ channelKey: "channel1", channelData: 1 });
    });

    it("strictModeが有効な場合、再起呼び出しの際に例外が発生する", async () => {
        const dispatcher = CrossDispatcher<TestChannelMap>({
            strictMode: true,
        });

        dispatcher.channel({
            channel1: async () => {
                await dispatcher.dispatch({
                    channelKey: "channel2",
                    channelData: "abc",
                });
                return 1;
            },
            channel2: async () => {
                await dispatcher.dispatch({
                    channelKey: "channel3",
                    channelData: new Map<string, string>(),
                });
                return "abc";
            },
            channel3: async () => {
                await expect(
                    dispatcher.dispatch({
                        channelKey: "channel1",
                        channelData: 3,
                    }),
                ).rejects.toThrowError();
                return new Map<string, string>();
            },
        });

        await dispatcher.dispatch({ channelKey: "channel1", channelData: 1 });
    });

    it("strictModeが無効な場合、購読されていないイベントのディスパッチには空の配列を返す", async () => {
        const dispatcher = CrossDispatcher();
        const responses = await dispatcher.dispatch({
            channelKey: "nonExistentchannel",
            channelData: {},
        });
        expect(responses).toEqual([]);
    });

    it("strictModeが無効な場合、非同期リスナーが例外をスローしても握りつぶす", async () => {
        const dispatcher = CrossDispatcher();
        dispatcher.channel({
            channel1: async () => {
                throw new Error("Test error");
            },
        });

        const responses = await dispatcher.dispatch({
            channelKey: "channel1",
            channelData: {},
        });
        expect(responses).toEqual([]);
    });

    it("strictModeが無効な場合、同期的なリスナーが例外をスローしても握りつぶす", async () => {
        const dispatcher = CrossDispatcher();
        dispatcher.channel({
            channel1: () => {
                throw new Error("Test error");
            },
        });

        const responses = await dispatcher.dispatch({
            channelKey: "channel1",
            channelData: {},
        });
        expect(responses).toEqual([]);
    });

    it("strictModeが有効な場合、存在しないイベントのディスパッチには例外をスローする", async () => {
        const dispatcher = CrossDispatcher({ strictMode: true });

        await expect(
            dispatcher.dispatch({
                channelKey: "nonExistentchannel",
                channelData: {},
            }),
        ).rejects.toThrowError();
    });

    it("strictModeが有効な場合、非同期リスナーが例外をスローすると再スローされる", async () => {
        const dispatcher = CrossDispatcher({ strictMode: true });

        dispatcher.channel({
            channel1: async () => {
                throw new Error("Test error");
            },
        });

        await expect(
            dispatcher.dispatch({ channelKey: "channel1", channelData: {} }),
        ).rejects.toThrowError();
    });

    it("strictModeが有効な場合、同期的なリスナーが例外をスローすると再スローされる", async () => {
        const dispatcher = CrossDispatcher({ strictMode: true });

        dispatcher.channel({
            channel1: () => {
                throw new Error("Test error");
            },
        });

        await expect(
            dispatcher.dispatch({ channelKey: "channel1", channelData: {} }),
        ).rejects.toThrowError();
    });

    it("リスナーを正しく解除できる", () => {
        const dispatcher = CrossDispatcher();
        let listenerCalled = false;
        const channelListener = () => {
            listenerCalled = true;
        };

        dispatcher.channel({
            channel1: channelListener,
        });

        dispatcher.remove({
            channelKey: "channel1",
            removeTarget: channelListener,
        });
        dispatcher.dispatch({ channelKey: "channel1", channelData: {} });
        expect(listenerCalled).toBe(false);
    });

    it("登録されていないリスナーを解除しても何も起きない", () => {
        const dispatcher = CrossDispatcher();
        let listenerCalled = false;
        const channelListener = () => {
            listenerCalled = true;
        };
        const unRegisterdchannelListener = () => {};

        dispatcher.channel({
            channel1: channelListener,
        });

        dispatcher.remove({
            channelKey: "unRegisterdchannelListener",
            removeTarget: unRegisterdchannelListener,
        });
        dispatcher.dispatch({ channelKey: "channel1", channelData: {} });
        expect(listenerCalled).toBe(true);
    });

    it("チャンネルキーに紐づくリスナーを全て解除できる", () => {
        const dispatcher = CrossDispatcher();
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
        dispatcher.dispatch({ channelKey: "channel1", channelData: {} });
        expect(listenerCalled).toBe(false);
    });

    it("全てのリスナーを解除できる", () => {
        const dispatcher = CrossDispatcher();
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

        dispatcher.clear();
        dispatcher.dispatch({ channelKey: "channel1", channelData: {} });
        dispatcher.dispatch({ channelKey: "channel2", channelData: {} });
        expect(listener1Called).toBe(false);
        expect(listener2Called).toBe(false);
    });

    /* eslint-disable */
    it("ディスパッチの型推論が働いているか", async () => {
        const dispatcher = CrossDispatcher<TestChannelMap>();
        // 型推論が働けばコンパイルが通る
        const numbers: number[] = await dispatcher.dispatch({
            channelKey: "channel1",
            channelData: 1,
        });
        const strings: string[] = await dispatcher.dispatch({
            channelKey: "channel2",
            channelData: "abc",
        });
        const maps: Map<string, string>[] = await dispatcher.dispatch({
            channelKey: "channel3",
            channelData: new Map<string, string>(),
        });
        const interfaces: TestInterface[] = await dispatcher.dispatch({
            channelKey: "channel4",
            channelData: {
                value: 1,
            },
        });
        const types: TestType[] = await dispatcher.dispatch({
            channelKey: "channel5",
            channelData: {
                value: 1,
            },
        });
        const records: Record<string, number>[] = await dispatcher.dispatch({
            channelKey: "channel6",
            channelData: { value: 1 },
        });
        const undefines: undefined[] = await dispatcher.dispatch({
            channelKey: "channel7",
            channelData: undefined,
        });
        const unknowns: unknown[] = await dispatcher.dispatch({
            channelKey: "channel8",
            channelData: {},
        });
        const nulls: null[] = await dispatcher.dispatch({
            channelKey: "channel9",
            channelData: null,
        });
        const anys: any[] = await dispatcher.dispatch({
            channelKey: "channel10",
            channelData: {},
        });
        const undefinedchannels: unknown[] = await dispatcher.dispatch({
            channelKey: "undefined channel",
            channelData: {},
        });
    });
    /* eslint-enable */
});
