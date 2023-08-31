import { chrome } from "jest-chrome";

import {
  MessageData,
  RuntimeMessageAgent,
  WindowMessageAgent,
  createMessageValidatorManager,
  createRuntimeMessageAgent,
  createWindowMessageAgent,
} from "../../";
import * as cryptoAgentModule from "../../encryption/factories";
import { DefaultMessageValidator } from "../../messaging/default-message-validator";
import * as MockUtils from "../mocks/mock-utils";

describe.each([false, true])(
  "MessageAgentクラス 疎通テスト (暗号化: %s)",
  (isEncryptionEnabled) => {
    let runtimeMessageAgent: RuntimeMessageAgent<MessageData>;
    let windowMssageAgent: WindowMessageAgent<MessageData>;

    MockUtils.mockAllSessionValues();

    beforeEach(async () => {
      const cryptoAgent = isEncryptionEnabled
        ? await cryptoAgentModule.createCryptoAgent()
        : undefined;

      jest
        .spyOn(cryptoAgentModule, "createCryptoAgent")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockResolvedValue(cryptoAgent as any);

      runtimeMessageAgent = await createRuntimeMessageAgent(
        await createMessageValidatorManager(MockUtils.mockValidatorConfig),
      );
      windowMssageAgent = await createWindowMessageAgent(
        await createMessageValidatorManager(MockUtils.mockValidatorConfig),
      );
    });

    it("iframeから親ウィンドウへwindowメッセージを送受信できるか", async () => {
      await testWindowMessage(async () => {
        // iframeにいるものとして親へのpostMessageをモックする
        window.parent.postMessage = jest.fn();
        await windowMssageAgent.postWindowMessage(
          window.parent,
          MockUtils.allowedOrigins[0],
          MockUtils.mockMessageData,
        );

        // window.parent.postMessageを呼び出したときの引数を取り出す
        const postedMessage = (window.parent.postMessage as jest.Mock).mock
          .calls[0][0];
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
        await windowMssageAgent.postWindowMessage(
          fakeIFrame.contentWindow as unknown as Window,
          MockUtils.allowedOrigins[1],
          MockUtils.mockMessageData,
        );

        // fakeIFrame.contentWindow.postMessage呼び出し時の引数を取り出す
        const postedMessage = (
          fakeIFrame.contentWindow.postMessage as jest.Mock
        ).mock.calls[0][0];

        return {
          data: postedMessage,
          origin: MockUtils.allowedOrigins[0],
        };
      });
    });

    /**
     * WindowMessageの送受信をテストします。
     * @param テスト対象の送信処理。送信データと送信元のオリジンを持つオブジェクトを返してください。
     * @returns WindowMessageを受信したときに解決されるプロミス。
     */
    async function testWindowMessage(
      postAction: () => Promise<{ data: unknown; origin: string }>,
    ): Promise<void> {
      // Promiseを使用して非同期のリスナー処理をラップ
      const messageReceived = new Promise<void>((resolve) => {
        // リスナーを設定
        windowMssageAgent.windowMessageListener((data) => {
          expect(data).toEqual(MockUtils.mockMessageData);
          resolve();
        });
      });

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

        await runtimeMessageAgent.sendRuntimeMessage(
          MockUtils.mockMessageData,
          undefined,
        );

        // chrome.runtime.sendMessageを呼び出したときの引数を取り出す
        return (chrome.runtime.sendMessage as jest.Mock).mock.calls[0][1];
      });
      expect(receivedMessage).toEqual(MockUtils.mockMessageData);
    });

    it("ランタイムメッセージをタブに送受信できるか", async () => {
      const receivedMessage = await testRuntimeMessage(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chrome.tabs.sendMessage as any) = jest.fn();

        await runtimeMessageAgent.sendRuntimeMessage(
          MockUtils.mockMessageData,
          1,
        );

        // chrome.tabs.sendMessageを呼び出したときの引数を取り出す
        return (chrome.tabs.sendMessage as jest.Mock).mock.calls[0][1];
      });
      expect(receivedMessage).toEqual(MockUtils.mockMessageData);
    });

    /**
     * RuntimeMessageの送受信をテストします。
     * @param テスト対象の送信処理。送信したデータオブジェクトを返してください。
     * @returns RuntimeMessageを受信したときに解決されるプロミス。
     */
    async function testRuntimeMessage(
      sendAction: () => Promise<unknown>,
    ): Promise<MessageData> {
      // Promiseを使用して非同期のリスナー処理をラップ
      const messageReceived = new Promise<MessageData>((resolve) => {
        runtimeMessageAgent.runtimeMessageListener(async (data) => {
          resolve(data);
        });
      });

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

    it("無効なランタイムメッセージを拒否するか", () => {
      runtimeMessageAgent.runtimeMessageListener(async () => {});

      const isValidSpy = jest.spyOn(
        DefaultMessageValidator.prototype,
        "isValid",
      );

      // ランタイムメッセージをシュミレート
      chrome.runtime.onMessage.callListeners(
        "invalidMessage",
        { origin: MockUtils.allowedOrigins[0] },
        () => {},
      );

      expect(isValidSpy.mock.results[0].value).toBe(undefined);
    });

    it("無効なウィンドウメッセージを拒否するか", () => {
      windowMssageAgent.windowMessageListener(() => {});

      const isValidSpy = jest.spyOn(
        DefaultMessageValidator.prototype,
        "isValid",
      );

      // ウィンドウメッセージをシュミレート
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: MockUtils.allowedOrigins[0],
          data: "invalidMessage",
        }),
      );

      expect(isValidSpy.mock.results[0].value).toBe(undefined);
    });

    afterEach(() => {
      // 暗号化の有無を切り替える前にリスナーの購読を解除しないと必ず失敗するため
      // メソッドのテストを兼ねている
      runtimeMessageAgent.removeRuntimeMessageListener();
      windowMssageAgent.removeWindowMessageListener();
    });
  },
);
