import CryptoJS from "crypto-js";

import {
  CryptoAgent,
  MessageData,
  SessionStaticValueProvider,
} from "./interfaces";

/**
 * AESで暗号、復号化します。
 */
export class AESCryptoAgent<T extends MessageData> implements CryptoAgent<T> {
  /**
   * AESCryptoAgent クラスのインスタンスを初期化します。
   * @param keyProvider 暗号化の鍵を提供するオブジェクト
   */
  constructor(private readonly keyProvider: SessionStaticValueProvider) {}

  getProvider() {
    return this.keyProvider;
  }

  /**
   * メッセージデータを暗号化します。
   * @param messageData 暗号化するメッセージデータ
   * @returns 暗号化された文字列
   */
  encrypt(messageData: T): string {
    const json = JSON.stringify(messageData);
    const key = this.keyProvider.getValue();
    const ecrypted = CryptoJS.AES.encrypt(json, key);
    const encryptedString = ecrypted.toString();
    return encryptedString;
  }

  /**
   * 暗号化されたデータを複合化します。
   * @param encryptedMessageData 暗号化されたデータの文字列
   * @returns 複合化されたメッセージデータ
   */
  decrypt(encryptedMessageData: string): T {
    const key = this.keyProvider.getValue();
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
