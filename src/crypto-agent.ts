/**
 * 暗号化、複合化
 */

import CryptoJS from "crypto-js";
import "reflect-metadata";
import { injectable } from "tsyringe";

import { Logger } from "./logger";
import { SessionStaticValue } from "./session-static-value";
import { injectOptional } from "./utils/inject-optional";
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

@injectable()
export class AESCryptoAgent<T> implements CryptoAgent<T> {
    constructor(
        @injectOptional("SessionStaticKey")
        private readonly keyProvider?: SessionStaticValue,
        @injectOptional("Logger") private readonly logger?: Logger,
    ) {}

    getProvider() {
        return assertNotNull(this.keyProvider);
    }

    encrypt(messageData: T): string {
        const json = JSON.stringify(messageData);
        const key = assertNotNull(this.keyProvider).getValue();
        const ecrypted = CryptoJS.AES.encrypt(json, key);
        const encryptedString = ecrypted.toString();
        return encryptedString;
    }

    decrypt(encryptedMessageData: string): T {
        const key = assertNotNull(this.keyProvider).getValue();
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
