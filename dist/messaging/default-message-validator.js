/**
 * メッセージの内容を検証します。
 */
export class DefaultMessageValidator {
    /**
     * DefaultMessageValidator クラスのインスタンスを初期化します。
     * @param config 検証用の設定オブジェクト
     * @param tokenProvider セッション静的なトークンを供給するオブジェクト
     * @param cryptoAgent 複合化に使うオブジェクト
     */
    constructor(config, tokenProvider, cryptoAgent) {
        this.config = config;
        this.tokenProvider = tokenProvider;
        this.cryptoAgent = cryptoAgent;
    }
    getConfig() {
        return this.config;
    }
    getProvider() {
        return this.tokenProvider;
    }
    getCryptoAgent() {
        return this.cryptoAgent;
    }
    /**
     * メッセージが正当か検証します。
     * @param origin メッセージの送信元オリジン
     * @param message 検証するメッセージ
     * @returns メッセージデータ
     */
    isValid(origin, message) {
        // オリジンの検証
        if (!this.config.allowedOrigins.includes(origin)) {
            return;
        }
        if (typeof message !== "object" || !message) {
            return;
        }
        const typedMessage = message;
        const invalidToken = this.tokenProvider.getValue();
        if (!typedMessage.token ||
            typedMessage.token !== invalidToken ||
            typeof typedMessage.messageData !== "string") {
            return;
        }
        // 複合化して
        const decryptedMessageData = this.cryptoAgent?.decrypt(typedMessage.messageData) ??
            JSON.parse(typedMessage.messageData);
        // 必須項目を検証
        if (decryptedMessageData.runtimeId !== this.config.runtimeId) {
            return;
        }
        return decryptedMessageData;
    }
}
