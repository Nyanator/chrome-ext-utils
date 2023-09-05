/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム)
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData } from "./message-validator";
import { injectOptional } from "./utils/inject-optional";
import { assertNotNull } from "./utils/ts-utils";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム) */
export interface RuntimeMessageAgent<T extends MessageData> {
    /**
     * 暗号化されたランタイムメッセージを送信します。
     * @param message 送信するメッセージデータ
     * @param tabId 送信先タブの ID
     */
    sendMessage(arg: { message: T; tabId?: number }): Promise<T | void>;

    /**
     * ランタイムメッセージを受信し、復号化してリスナー関数に渡します。
     * @param listener メッセージ受信時に呼び出されるリスナー関数
     */
    addListener(listener: (messageData: T) => Promise<T | void>): void;

    /**
     * 指定したリスナーを解除します。
     */
    removeListener(listener: (messageData: T) => Promise<T | void>): void;

    /**
     * リスナーをすべて解除します。
     */
    clearListeners(): void;
}

@injectable()
export class RuntimeMessageAgentImpl<T extends MessageData>
    implements RuntimeMessageAgent<T>
{
    private readonly runtimeListeners: Map<
        (messageData: T) => Promise<T | void>,
        (
            message: unknown,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void,
        ) => void
    > = new Map();

    constructor(
        @inject("MessageValidatorManager")
        private readonly validatorManager: MessageValidatorManager<T>,
        @injectOptional("Logger") private readonly logger?: Logger,
    ) {}

    async sendMessage(arg: { message: T; tabId?: number }): Promise<T | void> {
        const latestValidator =
            await this.validatorManager.getLatestValidator();

        const cryptoAgent = latestValidator.getCryptoAgent();
        const messageData =
            cryptoAgent?.encrypt(arg.message) ?? JSON.stringify(arg.message);
        const latestToken = latestValidator.getProvider().getValue();

        if (!arg.tabId) {
            const latestRuntimeId = latestValidator.getConfig().runtimeId;
            return chrome.runtime.sendMessage(latestRuntimeId, {
                messageData: messageData,
                token: latestToken,
            });
        }

        return chrome.tabs.sendMessage(arg.tabId, {
            messageData: messageData,
            token: latestToken,
        });
    }

    addListener(listener: (messageData: T) => Promise<T | void>): void {
        const newListener = (
            message: unknown,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void,
        ) => {
            (async () => {
                const senderOrigin = assertNotNull(sender.origin);
                const messageData = await assertNotNull(
                    this.validatorManager,
                ).processValidation({
                    origin: senderOrigin,
                    message: message,
                });

                if (!messageData) {
                    return;
                }

                const response = await listener(messageData);
                sendResponse(response);
            })();

            // 呼び元のPromiseが解決されるのにtrueを返す必要がある
            return true;
        };

        this.runtimeListeners.set(listener, newListener);
        chrome.runtime.onMessage.addListener(newListener);
    }

    removeListener(listener: (messageData: T) => Promise<T | void>): void {
        const runtimeListener = this.runtimeListeners.get(listener);
        if (runtimeListener) {
            chrome.runtime.onMessage.removeListener(runtimeListener);
            this.runtimeListeners.delete(listener);
        }
    }

    clearListeners(): void {
        this.runtimeListeners.forEach((listener) => {
            chrome.runtime.onMessage.removeListener(listener);
        });
        this.runtimeListeners.clear();
    }
}
