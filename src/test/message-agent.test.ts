import { chrome } from "jest-chrome";

import * as CryptoAgent from "../crypto-agent";
import * as MessageValidator from "../message-validator";
import { RuntimeMessageAgent } from "../runtime-message-agent";
import { WindowMessageAgent } from "../window-message-agent";

import * as MockUtils from "./mocks/mock-utils";

describe.each([false, true])(
    "MessageAgentクラス 疎通テスト (暗号化: %s)",
    (isEncryptionEnabled) => {
        let runtimeMessageAgent: RuntimeMessageAgent<MessageValidator.MessageData>;
        let windowMssageAgent: WindowMessageAgent<MessageValidator.MessageData>;

        MockUtils.mockAllSessionValues();

        beforeEach(async () => {
            const cryptoAgent = isEncryptionEnabled
                ? await CryptoAgent.CryptoAgent()
                : undefined;

            jest.spyOn(CryptoAgent, "CryptoAgent")
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .mockResolvedValue(cryptoAgent as any);

            runtimeMessageAgent = await RuntimeMessageAgent({
                messageValidatorManagerConfig: {
                    messageValidatorConfig: {
                        ...MockUtils.mockValidatorConfig,
                    },
                },
            });

            windowMssageAgent = await WindowMessageAgent({
                messageValidatorManagerConfig: {
                    messageValidatorConfig: {
                        ...MockUtils.mockValidatorConfig,
                    },
                },
            });
        });

        it("iframeから親ウィンドウへwindowメッセージを送受信できるか", async () => {
            await testWindowMessage(async () => {
                // iframeにいるものとして親へのpostMessageをモックする
                window.parent.postMessage = jest.fn();
                await windowMssageAgent.postMessage({
                    target: window.parent,
                    targetOrigin: MockUtils.allowedOrigins[0],
                    message: MockUtils.mockMessageData,
                });

                // window.parent.postMessageを呼び出したときの引数を取り出す
                const postedMessage = (window.parent.postMessage as jest.Mock)
                    .mock.calls[0][0];
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
                await windowMssageAgent.postMessage({
                    target: fakeIFrame.contentWindow as unknown as Window,
                    targetOrigin: MockUtils.allowedOrigins[1],
                    message: MockUtils.mockMessageData,
                });

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
                windowMssageAgent.addListener((data) => {
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

                await runtimeMessageAgent.sendMessage({
                    message: MockUtils.mockMessageData,
                });

                // chrome.runtime.sendMessageを呼び出したときの引数を取り出す
                return (chrome.runtime.sendMessage as jest.Mock).mock
                    .calls[0][1];
            });
            expect(receivedMessage).toEqual(MockUtils.mockMessageData);
        });

        it("ランタイムメッセージをタブに送受信できるか", async () => {
            const receivedMessage = await testRuntimeMessage(async () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (chrome.tabs.sendMessage as any) = jest.fn();

                await runtimeMessageAgent.sendMessage({
                    message: MockUtils.mockMessageData,
                    tabId: 1,
                });

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
        ): Promise<MessageValidator.MessageData> {
            // Promiseを使用して非同期のリスナー処理をラップ
            const messageReceived = new Promise<MessageValidator.MessageData>(
                (resolve) => {
                    runtimeMessageAgent.addListener(async (data) => {
                        resolve(data);
                    });
                },
            );

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
            let called = false;
            runtimeMessageAgent.addListener(async () => {
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

        it("無効なウィンドウメッセージを拒否するか", () => {
            let called = false;
            windowMssageAgent.addListener(() => {
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

        afterEach(() => {
            // 暗号化の有無を切り替える前にリスナーの購読を解除しないと必ず失敗するため
            // メソッドのテストを兼ねている
            runtimeMessageAgent.removeListener();
            windowMssageAgent.removeListener();
        });
    },
);
