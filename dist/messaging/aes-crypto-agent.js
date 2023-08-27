"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AESCryptoAgent = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
/**
 * AESで暗号、復号化します。
 */
class AESCryptoAgent {
    /**
     * AESCryptoAgent クラスのインスタンスを初期化します。
     * @param keyProvider 暗号化の鍵を提供するオブジェクト
     */
    constructor(keyProvider) {
        this.keyProvider = keyProvider;
    }
    getProvider() {
        return this.keyProvider;
    }
    /**
     * メッセージデータを暗号化します。
     * @param messageData 暗号化するメッセージデータ
     * @returns 暗号化された文字列
     */
    encrypt(messageData) {
        const json = JSON.stringify(messageData);
        const key = this.keyProvider.getValue();
        const ecrypted = crypto_js_1.default.AES.encrypt(json, key);
        const encryptedString = ecrypted.toString();
        return encryptedString;
    }
    /**
     * 暗号化されたデータを複合化します。
     * @param encryptedMessageData 暗号化されたデータの文字列
     * @returns 複合化されたメッセージデータ
     */
    decrypt(encryptedMessageData) {
        const key = this.keyProvider.getValue();
        const decryptedMessageData = crypto_js_1.default.AES.decrypt(encryptedMessageData, key);
        const decryptedMessageDataString = decryptedMessageData.toString(crypto_js_1.default.enc.Utf8);
        const decryptedMessageJson = JSON.parse(decryptedMessageDataString);
        return decryptedMessageJson;
    }
}
exports.AESCryptoAgent = AESCryptoAgent;
