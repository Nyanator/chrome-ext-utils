import { CryptoAgent, MessageDataObject, MessageValidator, SessionStaticValueProvider, ValidatorConfig } from "./interfaces";
/**
 * メッセージの内容を検証します。
 */
export declare class DefaultMessageValidator implements MessageValidator<MessageDataObject> {
    private readonly config;
    private readonly tokenProvider;
    private readonly cryptoAgent;
    /**
     * DefaultMessageValidator クラスのインスタンスを初期化します。
     * @param config 検証用の設定オブジェクト
     * @param tokenProvider セッション静的なトークンを供給するオブジェクト
     * @param cryptoAgent 複合化に使うオブジェクト
     */
    constructor(config: ValidatorConfig, tokenProvider: SessionStaticValueProvider, cryptoAgent: CryptoAgent<MessageDataObject> | undefined);
    getConfig(): ValidatorConfig;
    getProvider(): SessionStaticValueProvider;
    getCryptoAgent(): CryptoAgent<MessageDataObject> | undefined;
    /**
     * メッセージが正当か検証します。
     * @param origin メッセージの送信元オリジン
     * @param message 検証するメッセージ
     * @returns メッセージデータ
     */
    isValid(origin: string, message: unknown): MessageDataObject | undefined;
}
