/**
 * 暗号化、複合化
 */

import CryptoJS from "crypto-js";

import { InjectionConfig } from "./injection-config";
import { SessionStaticKey, SessionStaticValue } from "./session-static-value";
import { assertNotNull } from "./utils/ts-utils";

/** 暗号化、複合化 */
export interface CryptoAgent<T> {
    /**
     * 暗号化に使う鍵を提供するオブジェクトを返します。
     */
    getProvider(): SessionStaticValue;

    /**
     * メッセージデータを暗号化します。
     * @param messageData 暗号化するメッセージデータ
     */
    encrypt(messageData: T): string;

    /**
     * 暗号化されたデータを複合化します。
     * @param encryptedMessageData 暗号化されたデータの文字列
     */
    decrypt(encryptedMessageData: string): T;
}

/** 構築設定 */
export interface CryptoAgentConfig extends InjectionConfig {
    keyProvider?: SessionStaticValue; // 暗号化の鍵を提供するオブジェクト
}

/**
 * ファクトリ関数。
 * @param config 構築設定
 */
export const CryptoAgent = async <T>(
    config?: CryptoAgentConfig,
): Promise<CryptoAgent<T>> => {
    if (!config?.keyProvider) {
        config = {
            ...config,
            keyProvider: new SessionStaticKey(),
        };
        await config.keyProvider?.generateValue(false);
    }
    return new AESCryptoAgent(config);
};

class AESCryptoAgent<T> implements CryptoAgent<T> {
    constructor(private readonly config: CryptoAgentConfig) {}

    getProvider() {
        return assertNotNull(this.config.keyProvider);
    }

    encrypt(messageData: T): string {
        const json = JSON.stringify(messageData);
        const key = assertNotNull(this.config.keyProvider).getValue();
        const ecrypted = CryptoJS.AES.encrypt(json, key);
        const encryptedString = ecrypted.toString();
        return encryptedString;
    }

    decrypt(encryptedMessageData: string): T {
        const key = assertNotNull(this.config.keyProvider).getValue();
        const decryptedMessageData = CryptoJS.AES.decrypt(
            encryptedMessageData,
            key,
        );
        const decryptedMessageDataString = decryptedMessageData.toString(
            CryptoJS.enc.Utf8,
        );
        const decryptedMessageJson = JSON.parse(decryptedMessageDataString);
        return decryptedMessageJson;
    }
}
