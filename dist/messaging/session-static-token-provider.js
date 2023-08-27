import * as ChromeExtensionUtils from "../utils/chrome-ext-utils";
/**
 * セッションで静的なトークンを生成します。
 */
export class SessionStaticTokenProvider {
    constructor() {
        this.token = "";
    }
    getValue() {
        return this.token;
    }
    /**
     * ランダムなトークンを生成します。
     * @param regenerate true=既存の値があっても強制的に再作成する
     * @returns トークン
     */
    async generateValue(regenerate) {
        const newToken = crypto.randomUUID();
        this.token = await ChromeExtensionUtils.generateSessionStaticValue("token", newToken, regenerate);
        return this.token;
    }
}
