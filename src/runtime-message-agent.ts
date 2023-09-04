/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム)
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData } from "./message-validator";
import { assertNotNull } from "./utils/ts-utils";
import { injectOptional } from "./utils/tsyringe-utils";

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
     * ランタイムメッセージの購読を解除します。
     */
    removeListener(): void;
}

@injectable()
export class RuntimeMessageAgentImpl<T extends MessageData>
    implements RuntimeMessageAgent<T>
{
    private runtimeListener?: (
        message: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
    ) => void;

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
        this.removeListener();

        this.runtimeListener = (
            message: unknown,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response?: unknown) => void,
        ) => {
            // IIFE
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

        chrome.runtime.onMessage.addListener(this.runtimeListener);
    }

    removeListener(): void {
        if (this.runtimeListener) {
            chrome.runtime.onMessage.removeListener(this.runtimeListener);
            this.runtimeListener = undefined;
        }
    }
}
