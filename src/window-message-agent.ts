/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ)
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData } from "./message-validator";
import { assertNotNull } from "./utils/ts-utils";
import { injectOptional } from "./utils/tsyringe-utils";

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

@injectable()
export class WindowMessageAgentImpl<T extends MessageData>
    implements WindowMessageAgent<T>
{
    private windowListener?: (event: MessageEvent) => void;

    constructor(
        @inject("MessageValidatorManager")
        private readonly validatorManager: MessageValidatorManager<T>,
        @injectOptional("Logger") private readonly logger?: Logger,
    ) {}

    async postMessage(arg: {
        target: Window;
        targetOrigin: string;
        message: T;
    }): Promise<void> {
        const latestValidator =
            await this.validatorManager.getLatestValidator();

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
                this.validatorManager,
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
