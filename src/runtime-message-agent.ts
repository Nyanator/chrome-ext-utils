/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム)
 */

import { InjectionConfig } from "./injection-config";
import {
    MessageValidatorManager,
    MessageValidatorManagerConfig,
} from "./message-validatior-manager";
import { MessageData } from "./message-validator";
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
     * ランタイムメッセージの購読を解除します。
     */
    removeListener(): void;
}

/** 構築設定 */
export interface RuntimeMessageAgentConfig<T extends MessageData>
    extends InjectionConfig {
    /**
     * メッセージの検証に使うバリデーターマネージャー
     */
    messageValidatorManager?: MessageValidatorManager<T>;

    /**
     * バリデーターマネージャーの構築設定
     */
    messageValidatorManagerConfig?: MessageValidatorManagerConfig<T>;
}

/**
 * ファクトリ関数
 * @param config 構築設定
 */
export const RuntimeMessageAgent = async <T extends MessageData>(
    config: RuntimeMessageAgentConfig<T>,
): Promise<RuntimeMessageAgent<T>> => {
    let messageValidatorManagerInstance = config.messageValidatorManager;
    // messageValidatorManagerConfig が存在し、messageValidatorManagerInstance が存在しない場合
    if (
        !messageValidatorManagerInstance &&
        config.messageValidatorManagerConfig
    ) {
        messageValidatorManagerInstance = await MessageValidatorManager<T>(
            config.messageValidatorManagerConfig,
        );
        config.messageValidatorManager = messageValidatorManagerInstance;
    }

    const messageAgent = new RuntimeMessageAgentImpl(config);
    return messageAgent;
};

class RuntimeMessageAgentImpl<T extends MessageData>
    implements RuntimeMessageAgent<T>
{
    private runtimeListener?: (
        message: unknown,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response?: unknown) => void,
    ) => void;

    constructor(private readonly config: RuntimeMessageAgentConfig<T>) {}

    async sendMessage(arg: { message: T; tabId?: number }): Promise<T | void> {
        const latestValidator = assertNotNull(
            this.config.messageValidatorManager,
        )
            .getValidators()
            .slice(-1)[0];

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
                    this.config.messageValidatorManager,
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
