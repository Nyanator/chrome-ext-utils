/**
 * メッセージの正当性を検証
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { CryptoAgent } from "./crypto-agent";
import { Logger } from "./logger";
import { SessionStaticValue } from "./session-static-value";
import { injectOptional } from "./utils/inject-optional";
import { assertNotNull } from "./utils/ts-utils";

/** メッセージオブジェクト */
export interface MessageData {
    /**
     * 拡張機能のID。
     */
    readonly runtimeId: string;

    /**
     * チャンネル識別子。
     */
    readonly channel: string;

    /**
     * メッセージ本文。
     */
    readonly message: string;
}

/** メッセージの正当性の検証設定 */
export interface MessageValidatorConfig {
    /**
     * 拡張機能のID。
     */
    readonly runtimeId: string;

    /**
     * 許可するオリジンの一覧。
     */
    readonly allowedOrigins: string[];
}

export interface MessageValidator<T extends MessageData> {
    /** 検証設定オブジェクトを返します。 */
    getConfig(): MessageValidatorConfig;

    /** トークンを供給するオブジェクトを返します。 */
    getProvider(): SessionStaticValue;

    /** 暗号化に使うCrypotAgentオブジェクトを返します。 */
    getCryptoAgent(): CryptoAgent<T> | undefined;

    /**
     * メッセージが正当か検証します。
     * @param origin メッセージの送信元オリジン
     * @param message 検証するメッセージ
     * @returns メッセージデータ
     */
    isValid(arg: { origin: string; message: unknown }): T | undefined;
}

@injectable()
export class MessageValidatorImpl<T extends MessageData>
    implements MessageValidator<T>
{
    constructor(
        @inject("MessageValidatorConfig")
        private readonly config: MessageValidatorConfig,
        @inject("SessionStaticToken")
        private readonly tokenProvider: SessionStaticValue,
        @injectOptional("CryptoAgent")
        private readonly cryptoAgent: CryptoAgent<T>,
        @injectOptional("Logger") private readonly logger?: Logger,
    ) {}

    getConfig() {
        return this.config;
    }

    getProvider() {
        return assertNotNull(this.tokenProvider);
    }

    getCryptoAgent() {
        return this.cryptoAgent;
    }

    isValid(arg: { origin: string; message: unknown }): T | undefined {
        // オリジンの検証
        if (!this.config.allowedOrigins.includes(arg.origin)) {
            return;
        }

        if (typeof arg.message !== "object" || !arg.message) {
            return;
        }

        // メッセージの型を明示的に定義
        type TypedMessage = {
            token?: string;
            messageData?: string;
        };

        const typedMessage: TypedMessage = arg.message;
        const invalidToken = assertNotNull(this.tokenProvider).getValue();

        if (
            !typedMessage.token ||
            typedMessage.token !== invalidToken ||
            typeof typedMessage.messageData !== "string"
        ) {
            return;
        }

        // 複合化して
        const decryptedMessageData =
            this.cryptoAgent?.decrypt(typedMessage.messageData) ??
            JSON.parse(typedMessage.messageData);

        // 必須項目を検証
        if (decryptedMessageData.runtimeId !== this.config.runtimeId) {
            return;
        }

        return decryptedMessageData;
    }
}
