/**
 * メッセージの正当性を検証
 */

import { CryptoAgent, CryptoAgentConfig } from "./crypto-agent";
import { InjectionConfig } from "./injection-config";
import { SessionStaticToken, SessionStaticValue } from "./session-static-value";
import { assertNotNull } from "./utils/ts-utils";

/** メッセージオブジェクト */
export interface MessageData {
    /**
     * 拡張機能のID。
     */
    readonly runtimeId: string;

    /**
     * メッセージ本文。
     */
    readonly message: string;
}

/** メッセージの正当性の検証設定 */
export interface MessageValidatorConfig<T extends MessageData>
    extends InjectionConfig {
    /**
     * 拡張機能のID。
     */
    readonly runtimeId: string;

    /**
     * 許可するオリジンの一覧。
     */
    readonly allowedOrigins: string[];

    /**
     * 暗号化、複合化設定
     */
    cryptoAgentConfig?: CryptoAgentConfig;

    /**
     * 暗号化、複合化オブジェクト
     */
    cryptoAgent?: CryptoAgent<T>;

    /**
     * トークン発行オブジェクト
     */
    tokenProvider?: SessionStaticValue;
}

export interface MessageValidator<T extends MessageData> {
    /** 検証設定オブジェクトを返します。 */
    getConfig(): MessageValidatorConfig<T>;

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

/**
 * ファクトリ関数
 * @param config 構築設定
 */
export const MessageValidator = async <T extends MessageData>(
    config: MessageValidatorConfig<T>,
): Promise<MessageValidator<T>> => {
    let cryptoAgentInstance = config.cryptoAgent;
    // cryptoAgentConfig が存在し、cryptoAgent が存在しない場合
    if (!cryptoAgentInstance && config.cryptoAgentConfig) {
        cryptoAgentInstance = await CryptoAgent<T>(config.cryptoAgentConfig);
    }
    config.cryptoAgent = cryptoAgentInstance;

    const tokenProvider = config.tokenProvider || new SessionStaticToken();
    await tokenProvider.generateValue(false);
    config.tokenProvider = tokenProvider;

    const messageValidator = new MessageValidatorImpl<T>(config);

    return messageValidator;
};

class MessageValidatorImpl<T extends MessageData>
    implements MessageValidator<T>
{
    constructor(private readonly config: MessageValidatorConfig<T>) {}

    getConfig() {
        return this.config;
    }

    getProvider() {
        return assertNotNull(this.config.tokenProvider);
    }

    getCryptoAgent() {
        return this.config.cryptoAgent;
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
        const invalidToken = assertNotNull(
            this.config.tokenProvider,
        ).getValue();

        if (
            !typedMessage.token ||
            typedMessage.token !== invalidToken ||
            typeof typedMessage.messageData !== "string"
        ) {
            return;
        }

        // 複合化して
        const decryptedMessageData =
            this.config.cryptoAgent?.decrypt(typedMessage.messageData) ??
            JSON.parse(typedMessage.messageData);

        // 必須項目を検証
        if (decryptedMessageData.runtimeId !== this.config.runtimeId) {
            return;
        }

        return decryptedMessageData;
    }
}
