import CryptoJS from "crypto-js";

import * as ChromeExtensionUtils from "../utils/chrome-ext-utils";

import { SessionStaticValueProvider } from "./interfaces";

/**
 * セッションで静的な暗号化の鍵を生成します。
 */
export class SessionStaticKeyProvider implements SessionStaticValueProvider {
  private key = "";
  private aesInitial = "";

  getValue() {
    return this.key;
  }

  /**
   * 暗号化のための鍵を生成します。
   * @param regenerate true=既存の値があっても強制的に再作成する
   * @returns 鍵
   */
  async generateValue(regenerate: boolean): Promise<string> {
    // バックグラウンド以外のスクリプトでも同じキーを再現できるように開始時刻をChromeセションに保存
    const dateTimeNow = Date.now().toString();
    const startTime = await ChromeExtensionUtils.generateSessionStaticValue(
      "startTime",
      dateTimeNow,
      regenerate,
    );
    // 初期化ベクトルを読み込み、鍵を生成
    if (!this.aesInitial) {
      this.aesInitial =
        await ChromeExtensionUtils.loadResourceText("cryptokey");
    }
    this.key = CryptoJS.SHA256(this.aesInitial + startTime).toString(
      CryptoJS.enc.Base64,
    );
    return this.key;
  }
}
