import { MessageAgent, MessageValidatorManager } from "./interfaces";
/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間でのメッセージ通信を提供します。
 * Chrome拡張用実装。
 */
export declare class ChromeMessageAgent<T> implements MessageAgent<T> {
    private readonly messageValidatorManager;
    private windowListener?;
    private runtimeListener?;
    /**
     * ChromeExtMessageAgent クラスのインスタンスを初期化します。
     * @param messageValidatorManager MessageValidatorを管理するオブジェクト
     */
    constructor(messageValidatorManager: MessageValidatorManager<T>);
    /**
     * 暗号化されたメッセージを windowに送信します。
     * @param target 送信先の window
     * @param targetOrigin 送信先のオリジン
     * @param message 送信するメッセージデータ
     */
    postWindowMessage(target: Window, targetOrigin: string, message: T): Promise<void>;
    /**
     * 暗号化されたランタイムメッセージを送信します。
     * @param message 送信するメッセージデータ
     * @param tabId 送信先タブの ID
     * @returns 相手からの応答
     */
    sendRuntimeMessage(message: T, tabId: number | undefined): Promise<unknown>;
    /**
     * ウィンドウメッセージを受信し、復号化してハンドラー関数に渡します。
     * @param handler メッセージ受信時に呼び出されるハンドラー関数
     */
    windowMessageListener(handler: (event: T) => void): void;
    /**
     * ランタイムメッセージを受信し、復号化してハンドラー関数に渡します。
     * @param handler メッセージ受信時に呼び出されるハンドラー関数
     */
    runtimeMessageListener(handler: (messageData: T) => Promise<unknown>): void;
    /**
     * Windowメッセージの購読を解除します。
     */
    removeWindowMessageListener(): void;
    /**
     * ランタイムメッセージの購読を解除します。
     */
    removeRuntimeMessageListener(): void;
    /**
     * 最新のValidatorを返します。
     * @returns 最新のValidator
     */
    private getLatestValidator;
    /**
     * 送信用のメッセージを生成します。
     * @returns 送信用のメッセージ
     */
    private makeMessageData;
    /**
     * 最新のトークンを返します。
     * @returns 最新のトークン
     */
    private getLatestToken;
}
