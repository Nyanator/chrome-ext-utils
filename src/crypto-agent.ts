/**
 * 暗号化、複合化
 */

import CryptoJS from "crypto-js";
import "reflect-metadata";
import { injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageData } from "./message-validator";
import { SessionStaticValue } from "./session-static-value";
import { isMessageDataParse, isMessageDataStringfy } from "./typia/generated/validators";
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
export class AESCryptoAgent implements CryptoAgent<MessageData> {
  constructor(
    @injectOptional("Logger") private readonly logger: Logger,
    @injectOptional("SessionStaticKey")
    private readonly keyProvider?: SessionStaticValue,
  ) {}

  getProvider() {
    return assertNotNull(this.keyProvider);
  }

  encrypt(messageData: MessageData): string {
    const json = isMessageDataStringfy(messageData);
    if (!json) {
      throw new TypeError("uncorected json object");
    }
    const key = assertNotNull(this.keyProvider).getValue();
    const ecrypted = CryptoJS.AES.encrypt(json, key);
    const encryptedString = ecrypted.toString();
    return encryptedString;
  }

  decrypt(encryptedMessageData: string): MessageData {
    const key = assertNotNull(this.keyProvider).getValue();
    const decryptedMessageData = CryptoJS.AES.decrypt(encryptedMessageData, key);
    const decryptedMessageDataString = decryptedMessageData.toString(CryptoJS.enc.Utf8);
    const decryptedMessageJson = isMessageDataParse(decryptedMessageDataString);
    return decryptedMessageJson;
  }
}
