import { CryptoAgent, SessionStaticValueProvider } from "./interfaces";
/**
 * AESで暗号、復号化します。
 * @param keyProvider セッション静的なキーを供給するオブジェクト
 */
export declare class AESCryptoAgent<T> implements CryptoAgent<T> {
    private readonly keyProvider;
    constructor(keyProvider: SessionStaticValueProvider);
    getProvider(): SessionStaticValueProvider;
    /**
     * メッセージデータを暗号化します。
     * @param messageData 暗号化するメッセージデータ
     * @returns 暗号化された文字列
     */
    encrypt(messageData: T): string;
    /**
     * 暗号化されたデータを複合化します。
     * @param encryptedMessageData 暗号化されたデータの文字列
     * @returns 複合化されたメッセージデータ
     */
    decrypt(encryptedMessageData: string): T;
}
