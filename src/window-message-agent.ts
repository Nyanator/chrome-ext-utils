/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ)
 */

import { InjectionConfig } from "./injection-config";
import {
    MessageValidatorManager,
    MessageValidatorManagerConfig,
} from "./message-validatior-manager";
import { MessageData } from "./message-validator";
import { assertNotNull } from "./utils/ts-utils";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ) */
export interface WindowMessageAgent<T extends MessageData> {
    /**
     * 暗号化されたメッセージを windowに送信します。
     * @param target 送信先の window
     * @param targetOrigin 送信先のオリジン
     * @param message 送信するメッセージデータ
     */
    postMessage(arg: {
        target: Window;
        targetOrigin: string;
        message: T;
    }): Promise<void>;

    /**
     * ウィンドウメッセージを受信し、復号化してリスナー関数に渡します。
     * @param listener メッセージ受信時に呼び出されるリスナー関数
     */
    addListener(listener: (event: T) => void): void;

    /**
     * Windowメッセージの購読を解除します。
     */
    removeListener(): void;
}

/** 構築設定 */
export interface WindowMessageAgentConfig<T extends MessageData>
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
export const WindowMessageAgent = async <T extends MessageData>(
    config: WindowMessageAgentConfig<T>,
): Promise<WindowMessageAgent<T>> => {
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

    const messageAgent = new WindowMessageAgentImpl(config);
    return messageAgent;
};

class WindowMessageAgentImpl<T extends MessageData>
    implements WindowMessageAgent<T>
{
    private windowListener?: (event: MessageEvent) => void;

    constructor(private readonly config: WindowMessageAgentConfig<T>) {}

    async postMessage(arg: {
        target: Window;
        targetOrigin: string;
        message: T;
    }): Promise<void> {
        const latestValidator = assertNotNull(
            this.config.messageValidatorManager,
        )
            .getValidators()
            .slice(-1)[0];

        const cryptoAgent = latestValidator.getCryptoAgent();
        const messageData =
            cryptoAgent?.encrypt(arg.message) ?? JSON.stringify(arg.message);
        const latestToken = latestValidator.getProvider().getValue();

        arg.target.postMessage(
            {
                messageData: messageData,
                token: latestToken,
            },
            arg.targetOrigin,
        );
    }

    addListener(listener: (event: T) => void): void {
        this.removeListener();

        this.windowListener = async (event: MessageEvent) => {
            const messageData = await assertNotNull(
                this.config.messageValidatorManager,
            ).processValidation({
                origin: event.origin,
                message: event.data,
            });
            if (!messageData) {
                return;
            }

            listener(messageData);
        };

        window.addEventListener("message", this.windowListener);
    }

    removeListener(): void {
        if (this.windowListener) {
            window.removeEventListener("message", this.windowListener);
            this.windowListener = undefined;
        }
    }
}
