/**
 * @file 暗号化クラスインターフェース
 */

import { SessionStaticValueProvider } from "../session/interfaces";

/** 暗号化、複合化 */
export interface CryptoAgent<T> {
  /**
   * 暗号化に使う鍵を提供するオブジェクトを返します。
   */
  getProvider(): SessionStaticValueProvider;

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
