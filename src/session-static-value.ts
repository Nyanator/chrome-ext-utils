import CryptoJS from "crypto-js";

import * as ChromeExtensionUtils from "./utils/chrome-ext-utils";

/** セッションで静的な値 */
export interface SessionStaticValue {
    /**
     * 保持している値を返します。
     */
    getValue(): string;

    /**
     * セッションで静的な値を生成します。すでに生成されている場合は同じ値が返ります。
     * @param regenerate すでに生成されている場合でも強制的に再生成する
     */
    generateValue(regenerate: boolean): Promise<string>;
}

/**
 * セッションで静的な暗号化の鍵を生成します。
 */
export class SessionStaticKey implements SessionStaticValue {
    private key = "";
    private aesInitial = "";

    getValue() {
        return this.key;
    }

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

/**
 * セッションで静的なトークンを生成します。
 */
export class SessionStaticToken implements SessionStaticValue {
    private token = "";

    getValue() {
        return this.token;
    }

    async generateValue(regenerate: boolean): Promise<string> {
        const newToken = crypto.randomUUID();

        this.token = await ChromeExtensionUtils.generateSessionStaticValue(
            "token",
            newToken,
            regenerate,
        );
        return this.token;
    }
}
