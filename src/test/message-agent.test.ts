import { chrome } from "jest-chrome";
import { container } from "tsyringe";

import { AESCryptoAgent, CryptoAgent } from "../crypto-agent";
import { ConsoleInjectableLogger } from "../logger";
import {
  MessageValidatorManager,
  MessageValidatorManagerConfig,
  MessageValidatorManagerImpl,
} from "../message-validatior-manager";
import * as MessageValidator from "../message-validator";
import { RuntimeMessageAgent, RuntimeMessageAgentImpl } from "../runtime-message-agent";
import { WindowMessageAgent, WindowMessageAgentImpl } from "../window-message-agent";

import * as MockUtils from "./mocks/mock-utils";

describe("MessageAgentクラス 疎通テスト", () => {
  let runtimeMessageAgent: RuntimeMessageAgent;
  let windowMssageAgent: WindowMessageAgent;

  MockUtils.mockAllSessionValues();

  beforeEach(async () => {
    container.clearInstances();

    container.register("Logger", {
      useClass: ConsoleInjectableLogger,
    });

    container.register("SessionStaticToken", {
      useValue: MockUtils.mockSessionStaticValue,
    });

    container.register("SessionStaticKey", {
      useValue: MockUtils.mockSessionStaticValue,
    });

    container.register("MessageValidatorConfig", {
      useValue: MockUtils.mockValidatorConfig,
    });

    container.register<CryptoAgent<MessageValidator.MessageData>>("CryptoAgent", {
      useClass: AESCryptoAgent,
    });

    container.register<MessageValidator.MessageValidatorImpl>("MessageValidator", {
      useClass: MessageValidator.MessageValidatorImpl,
    });

    container.register<MessageValidatorManagerConfig>("MessageValidatorManagerConfig", {
      useValue: {
        maxMessageValidators: 3,
        validatorRefreshInterval: 1,
      },
    });

    container.register<RuntimeMessageAgent>("RuntimeMessageAgent", {
      useClass: RuntimeMessageAgentImpl,
    });

    container.register<WindowMessageAgent>("WindowMessageAgent", {
      useClass: WindowMessageAgentImpl,
    });

    container.registerSingleton<MessageValidatorManager>(
      "MessageValidatorManager",
      MessageValidatorManagerImpl,
    );

    runtimeMessageAgent = container.resolve<RuntimeMessageAgent>("RuntimeMessageAgent");

    windowMssageAgent = container.resolve<WindowMessageAgent>("WindowMessageAgent");
  });

  it("iframeから親ウィンドウへwindowメッセージを送受信できるか", async () => {
    await testWindowMessage(async () => {
      // iframeにいるものとして親へのpostMessageをモックする
      window.parent.postMessage = jest.fn();
      await windowMssageAgent.postMessage(
        window.parent,
        MockUtils.allowedOrigins[0],
        MockUtils.channel,
        MockUtils.mockMessageData,
      );

      // window.parent.postMessageを呼び出したときの引数を取り出す
      const postedMessage = (window.parent.postMessage as jest.Mock).mock.calls[0][0];
      return {
        data: postedMessage,
        origin: MockUtils.allowedOrigins[1],
      };
    });
  });

  it("親ウィンドウからiframeへwindowメッセージを送受信できるか", async () => {
    // iframeのモック
    const fakeIFrame = {
      contentWindow: {
        postMessage: jest.fn(),
      },
    };

    await testWindowMessage(async () => {
      // 親ウィンドウへいるものとしてiframeへのpostMessageをモックする
      await windowMssageAgent.postMessage(
        fakeIFrame.contentWindow as unknown as Window,
        MockUtils.allowedOrigins[1],
        MockUtils.channel,
        MockUtils.mockMessageData,
      );

      // fakeIFrame.contentWindow.postMessage呼び出し時の引数を取り出す
      const postedMessage = (fakeIFrame.contentWindow.postMessage as jest.Mock).mock
        .calls[0][0];

      return {
        data: postedMessage,
        origin: MockUtils.allowedOrigins[0],
      };
    });
  });

  async function testWindowMessage(
    postAction: () => Promise<{ data: unknown; origin: string }>,
    listerSetAction?: (resolve) => void,
  ): Promise<void> {
    if (!listerSetAction) {
      listerSetAction = (resolve) => {
        // リスナーを設定
        windowMssageAgent.addListener(MockUtils.channel, (data) => {
          expect(data).toEqual(MockUtils.mockMessageData);
          resolve();
        });
      };
    }
    // Promiseを使用して非同期のリスナー処理をラップ
    const messageReceived = new Promise<void>(listerSetAction);

    // 非同期にメッセージを送信するようにスケジューリング
    process.nextTick(async () => {
      const { data, origin } = await postAction();
      // ウィンドウメッセージをシュミレート
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: origin,
          data: data,
        }),
      );
    });

    await messageReceived;
  }

  it("ランタイムメッセージを送受信できるか", async () => {
    const receivedMessage = await testRuntimeMessage(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chrome.runtime.sendMessage as any) = jest.fn();

      await runtimeMessageAgent.sendMessage(MockUtils.channel, MockUtils.mockMessageData);

      // chrome.runtime.sendMessageを呼び出したときの引数を取り出す
      return (chrome.runtime.sendMessage as jest.Mock).mock.calls[0][1];
    });
    expect(receivedMessage).toEqual(MockUtils.mockMessageData);
  });

  it("ランタイムメッセージをタブに送受信できるか", async () => {
    const receivedMessage = await testRuntimeMessage(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (chrome.tabs.sendMessage as any) = jest.fn();

      await runtimeMessageAgent.sendMessage(
        MockUtils.channel,
        MockUtils.mockMessageData,
        1,
      );

      // chrome.tabs.sendMessageを呼び出したときの引数を取り出す
      return (chrome.tabs.sendMessage as jest.Mock).mock.calls[0][1];
    });
    expect(receivedMessage).toEqual(MockUtils.mockMessageData);
  });

  async function testRuntimeMessage(
    sendAction: () => Promise<unknown>,
    listerSetAction?: (resolve) => void,
  ): Promise<MessageValidator.MessageData> {
    if (!listerSetAction) {
      listerSetAction = (resolve) => {
        runtimeMessageAgent.addListener(MockUtils.channel, async (data) => {
          resolve(data);
        });
      };
    }
    // Promiseを使用して非同期のリスナー処理をラップ
    const messageReceived = new Promise<MessageValidator.MessageData>(listerSetAction);

    // 非同期にメッセージを送信するようにスケジューリング
    process.nextTick(async () => {
      const sendedMessage = await sendAction();

      // ランタイムメッセージをシュミレート
      chrome.runtime.onMessage.callListeners(
        sendedMessage,
        { origin: MockUtils.allowedOrigins[0] },
        () => {},
      );
    });

    return messageReceived;
  }

  it("無効なランタイムメッセージを拒否するか Rumtime", () => {
    let called = false;
    runtimeMessageAgent.addListener(MockUtils.channel, async () => {
      called = true;
    });

    // ランタイムメッセージをシュミレート
    chrome.runtime.onMessage.callListeners(
      "invalidMessage",
      { origin: MockUtils.allowedOrigins[0] },
      () => {},
    );
    expect(called).toBe(false);
  });

  it("無効なウィンドウメッセージを拒否するか Window", () => {
    let called = false;
    windowMssageAgent.addListener(MockUtils.channel, () => {
      called = true;
    });

    // ウィンドウメッセージをシュミレート
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: MockUtils.allowedOrigins[0],
        data: "invalidMessage",
      }),
    );
    expect(called).toBe(false);
  });

  it("複数のリスナーが送受信できる Window", async () => {
    const called = [false, false, false];
    await testWindowMessage(
      async () => {
        // iframeにいるものとして親へのpostMessageをモックする
        window.parent.postMessage = jest.fn();
        await windowMssageAgent.postMessage(
          window.parent,
          MockUtils.allowedOrigins[0],
          MockUtils.channel,
          MockUtils.mockMessageData,
        );

        // window.parent.postMessageを呼び出したときの引数を取り出す
        const postedMessage = (window.parent.postMessage as jest.Mock).mock.calls[0][0];
        return {
          data: postedMessage,
          origin: MockUtils.allowedOrigins[1],
        };
      },
      (reslove) => {
        windowMssageAgent.addListener(MockUtils.channel, (data) => {
          called[0] = true;
          reslove(data);
        });

        windowMssageAgent.addListener(MockUtils.channel, (data) => {
          called[1] = true;
          reslove(data);
        });

        windowMssageAgent.addListener(MockUtils.channel, (data) => {
          called[2] = true;
          reslove(data);
        });
      },
    );
    expect(called.every((calledStatus) => calledStatus === true)).toBe(true);
  });

  it("複数のリスナーが送受信できる Runtime", async () => {
    const called = [false, false, false];
    await testRuntimeMessage(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chrome.runtime.sendMessage as any) = jest.fn();

        await runtimeMessageAgent.sendMessage(
          MockUtils.channel,
          MockUtils.mockMessageData,
        );

        // chrome.runtime.sendMessageを呼び出したときの引数を取り出す
        return (chrome.runtime.sendMessage as jest.Mock).mock.calls[0][1];
      },
      (reslove) => {
        runtimeMessageAgent.addListener(MockUtils.channel, async (data) => {
          called[0] = true;
          reslove(data);
        });

        runtimeMessageAgent.addListener(MockUtils.channel, async (data) => {
          called[1] = true;
          reslove(data);
        });

        runtimeMessageAgent.addListener(MockUtils.channel, async (data) => {
          called[2] = true;
          reslove(data);
        });
      },
    );
    expect(called.every((calledStatus) => calledStatus === true)).toBe(true);
  });

  it("指定したチャンネルだけ受信する Window", async () => {
    const called = [false, false, false];
    await testWindowMessage(
      async () => {
        // iframeにいるものとして親へのpostMessageをモックする
        window.parent.postMessage = jest.fn();
        await windowMssageAgent.postMessage(
          window.parent,
          MockUtils.allowedOrigins[0],
          "channel1",
          MockUtils.mockMessageData,
        );

        // window.parent.postMessageを呼び出したときの引数を取り出す
        const postedMessage = (window.parent.postMessage as jest.Mock).mock.calls[0][0];
        return {
          data: postedMessage,
          origin: MockUtils.allowedOrigins[1],
        };
      },
      (reslove) => {
        windowMssageAgent.addListener("channel1", (data) => {
          called[0] = true;
          reslove(data);
        });

        windowMssageAgent.addListener(MockUtils.channel, (data) => {
          called[1] = true;
          reslove(data);
        });

        windowMssageAgent.addListener(MockUtils.channel, (data) => {
          called[2] = true;
          reslove(data);
        });
      },
    );
    expect(called[0]).toBe(true);
    expect(called[1]).toBe(false);
    expect(called[2]).toBe(false);
  });

  it("指定したチャンネルだけ受信する Runtime", async () => {
    const called = [false, false, false];
    await testRuntimeMessage(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chrome.runtime.sendMessage as any) = jest.fn();

        await runtimeMessageAgent.sendMessage("channel1", MockUtils.mockMessageData);

        // chrome.runtime.sendMessageを呼び出したときの引数を取り出す
        return (chrome.runtime.sendMessage as jest.Mock).mock.calls[0][1];
      },
      (reslove) => {
        runtimeMessageAgent.addListener("channel1", async (data) => {
          called[0] = true;
          reslove(data);
        });

        runtimeMessageAgent.addListener(MockUtils.channel, async (data) => {
          called[1] = true;
          reslove(data);
        });

        runtimeMessageAgent.addListener(MockUtils.channel, async (data) => {
          called[2] = true;
          reslove(data);
        });
      },
    );
    expect(called[0]).toBe(true);
    expect(called[1]).toBe(false);
    expect(called[2]).toBe(false);
  });

  it("許可されていないオリジンへの送信は例外になる", async () => {
    expect(
      windowMssageAgent.postMessage(
        window,
        MockUtils.invalidOrigin,
        MockUtils.channel,
        MockUtils.mockMessageData,
      ),
    ).rejects.toThrow();
  });

  it("指定したリスナーが削除できる Window", async () => {
    let called = false;
    const listener = () => {
      called = true;
    };

    windowMssageAgent.addListener(MockUtils.channel, listener);
    windowMssageAgent.removeListener(listener);

    // ウィンドウメッセージをシュミレート
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: MockUtils.allowedOrigins[0],
        data: MockUtils.mockMessageData,
      }),
    );

    // リスナーが呼び出されないことを確認
    expect(called).toBe(false);
  });

  it("指定したリスナーが削除できる Runtime", async () => {
    let called = false;
    const listener = async () => {
      called = true;
    };

    runtimeMessageAgent.addListener(MockUtils.channel, listener);
    runtimeMessageAgent.removeListener(listener);

    // ランタイムメッセージをシュミレート
    chrome.runtime.onMessage.callListeners(
      MockUtils.mockMessageData,
      { origin: MockUtils.allowedOrigins[0] },
      () => {},
    );

    // リスナーが呼び出されないことを確認
    expect(called).toBe(false);
  });

  it("すべてのリスナーが削除できる Window", async () => {
    let called1 = false;
    let called2 = false;

    const listener1 = () => {
      called1 = true;
    };

    const listener2 = () => {
      called2 = true;
    };

    windowMssageAgent.addListener(MockUtils.channel, listener1);
    windowMssageAgent.addListener(MockUtils.channel, listener2);
    windowMssageAgent.clearListeners();

    // ウィンドウメッセージをシュミレート
    window.dispatchEvent(
      new MessageEvent("message", {
        origin: MockUtils.allowedOrigins[0],
        data: MockUtils.mockMessageData,
      }),
    );

    // リスナーが呼び出されないことを確認
    expect(called1).toBe(false);
    expect(called2).toBe(false);
  });

  it("すべてのリスナーが削除できる Runtime", async () => {
    let called1 = false;
    let called2 = false;

    const listener1 = async () => {
      called1 = true;
    };

    const listener2 = async () => {
      called2 = true;
    };

    runtimeMessageAgent.addListener(MockUtils.channel, listener1);
    runtimeMessageAgent.addListener(MockUtils.channel, listener2);
    runtimeMessageAgent.clearListeners();

    // ランタイムメッセージをシュミレート
    chrome.runtime.onMessage.callListeners(
      MockUtils.mockMessageData,
      { origin: MockUtils.allowedOrigins[0] },
      () => {},
    );

    // リスナーが呼び出されないことを確認
    expect(called1).toBe(false);
    expect(called2).toBe(false);
  });

  afterEach(() => {
    // 暗号化の有無を切り替える前にリスナーの購読を解除しないと必ず失敗するため
    // メソッドのテストを兼ねている
    runtimeMessageAgent.clearListeners();
    windowMssageAgent.clearListeners();
  });
});
