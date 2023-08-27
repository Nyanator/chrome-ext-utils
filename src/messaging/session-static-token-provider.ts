import * as ChromeExtensionUtils from "../utils/chrome-ext-utils";

import { SessionStaticValueProvider } from "./interfaces";

/**
 * セッションで静的なトークンを生成します。
 */
export class SessionStaticTokenProvider implements SessionStaticValueProvider {
  private token = "";

  getValue() {
    return this.token;
  }

  /**
   * ランダムなトークンを生成します。
   * @param regenerate true=既存の値があっても強制的に再作成する
   * @returns トークン
   */
  async generateValue(regenerate: boolean): Promise<string> {
    const newToken = crypto.randomUUID();

    this.token = await ChromeExtensionUtils.generateSessionStaticValue(
      "token",
      newToken,
      regenerate
    );
    return this.token;
  }
}
