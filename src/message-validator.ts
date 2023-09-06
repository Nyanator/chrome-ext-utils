/**
 * メッセージの正当性を検証します。
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { CryptoAgent } from "./crypto-agent";
import { Logger } from "./logger";
import { SessionStaticValue } from "./session-static-value";
import { injectOptional } from "./utils/inject-optional";
import { assertNotNull } from "./utils/ts-utils";

export interface MessageValidator<T extends MessageData> {
    /** 検証設定オブジェクトを返します。 */
    getConfig(): MessageValidatorConfig;

    /** トークンを供給するオブジェクトを返します。 */
    getProvider(): SessionStaticValue;

    /** 暗号化に使うCrypotAgentオブジェクトを返します。 */
    getCryptoAgent(): CryptoAgent<T> | undefined;

    /** メッセージが正当か検証します。*/
    isValid(validationTarget: SendObject): T | undefined;
}

/** メッセージオブジェクト(暗号化される部分) */
export interface MessageData {
    /** 拡張機能のID */
    readonly runtimeId: string;

    /** メッセージ本文 */
    readonly message: string;
}

/** メッセージの正当性検証設定 */
export type MessageValidatorConfig = Readonly<{
    /** 拡張機能のID */
    runtimeId: string;

    /** 許可するオリジンの一覧 */
    allowedOrigins: string[];
}>;

/** APIで実際に送信されるオブジェクト */
export type SendObject = Readonly<{
    /** オリジン */
    origin: string;

    /** チャンネル識別子 */
    channel?: string;

    /** メッセージ(ここに暗号化されたMessageDataが入る) */
    message: unknown;
}>;

@injectable()
export class MessageValidatorImpl<T extends MessageData>
    implements MessageValidator<T>
{
    constructor(
        @inject("MessageValidatorConfig")
        private readonly config: MessageValidatorConfig,
        @inject("SessionStaticToken")
        private readonly tokenProvider: SessionStaticValue,
        @inject("Logger") private readonly logger: Logger,
        @injectOptional("CryptoAgent")
        private readonly cryptoAgent?: CryptoAgent<T>,
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

    isValid(validationTarget: SendObject): T | undefined {
        // オリジンの検証
        if (!this.config.allowedOrigins.includes(validationTarget.origin)) {
            return;
        }

        if (
            typeof validationTarget.message !== "object" ||
            !validationTarget.message
        ) {
            return;
        }

        // メッセージの型を明示的に定義
        type TypedMessage = {
            token?: string;
            channel?: string;
            messageData?: string;
        };

        // 型検証
        const typedMessage: TypedMessage = validationTarget.message;
        const invalidToken = assertNotNull(this.tokenProvider).getValue();

        if (
            !typedMessage.token ||
            typedMessage.token !== invalidToken ||
            typeof typedMessage.messageData !== "string"
        ) {
            return;
        }

        // チャンネルが一致しない場合無視(グローバルチャンネル以外)
        const isGlobalChannel = validationTarget.channel;
        if (
            !isGlobalChannel &&
            validationTarget.channel !== typedMessage.channel
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
