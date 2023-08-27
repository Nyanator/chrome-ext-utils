"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromeMessageAgent = void 0;
const ts_utils_1 = require("../utils/ts-utils");
/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間でのメッセージ通信を提供します。
 * Chrome拡張用実装。
 */
class ChromeMessageAgent {
    /**
     * ChromeExtMessageAgent クラスのインスタンスを初期化します。
     * @param messageValidatorManager MessageValidatorを管理するオブジェクト
     */
    constructor(messageValidatorManager) {
        this.messageValidatorManager = messageValidatorManager;
    }
    /**
     * 暗号化されたメッセージを windowに送信します。
     * @param target 送信先の window
     * @param targetOrigin 送信先のオリジン
     * @param message 送信するメッセージデータ
     */
    async postWindowMessage(target, targetOrigin, message) {
        const messageData = this.makeMessageData(message);
        const latestToken = this.getLatestToken();
        target.postMessage({
            messageData: messageData,
            token: latestToken,
        }, targetOrigin);
    }
    /**
     * 暗号化されたランタイムメッセージを送信します。
     * @param message 送信するメッセージデータ
     * @param tabId 送信先タブの ID
     * @returns 相手からの応答
     */
    async sendRuntimeMessage(message, tabId) {
        const latestValidator = this.getLatestValidator();
        const messageData = this.makeMessageData(message);
        const latestToken = this.getLatestToken();
        if (!tabId) {
            const latestRuntimeId = latestValidator.getConfig().runtimeId;
            return chrome.runtime.sendMessage(latestRuntimeId, {
                messageData: messageData,
                token: latestToken,
            });
        }
        return chrome.tabs.sendMessage(tabId, {
            messageData: messageData,
            token: latestToken,
        });
    }
    /**
     * ウィンドウメッセージを受信し、復号化してハンドラー関数に渡します。
     * @param handler メッセージ受信時に呼び出されるハンドラー関数
     */
    windowMessageListener(handler) {
        this.removeWindowMessageListener();
        this.windowListener = async (event) => {
            const messageData = await this.messageValidatorManager.processValidation(event.origin, event.data);
            if (!messageData) {
                return;
            }
            handler(messageData);
        };
        window.addEventListener("message", this.windowListener);
    }
    /**
     * ランタイムメッセージを受信し、復号化してハンドラー関数に渡します。
     * @param handler メッセージ受信時に呼び出されるハンドラー関数
     */
    runtimeMessageListener(handler) {
        this.removeRuntimeMessageListener();
        this.runtimeListener = (message, sender, sendResponse) => {
            // IIFE
            (async () => {
                const senderOrigin = (0, ts_utils_1.assertNotNull)(sender.origin);
                const messageData = await this.messageValidatorManager.processValidation(senderOrigin, message);
                if (!messageData) {
                    return;
                }
                const response = await handler(messageData);
                sendResponse(response);
            })();
            // 呼び元のPromiseが解決されるのにtrueを返す必要がある
            return true;
        };
        chrome.runtime.onMessage.addListener(this.runtimeListener);
    }
    /**
     * Windowメッセージの購読を解除します。
     */
    removeWindowMessageListener() {
        if (this.windowListener) {
            window.removeEventListener("message", this.windowListener);
            this.windowListener = undefined;
        }
    }
    /**
     * ランタイムメッセージの購読を解除します。
     */
    removeRuntimeMessageListener() {
        if (this.runtimeListener) {
            chrome.runtime.onMessage.removeListener(this.runtimeListener);
            this.runtimeListener = undefined;
        }
    }
    /**
     * 最新のValidatorを返します。
     * @returns 最新のValidator
     */
    getLatestValidator() {
        const validators = this.messageValidatorManager.getValidators();
        const latestValidator = validators.slice(-1)[0];
        return latestValidator;
    }
    /**
     * 送信用のメッセージを生成します。
     * @returns 送信用のメッセージ
     */
    makeMessageData(message) {
        const latestValidator = this.getLatestValidator();
        const cryptoAgent = latestValidator.getCryptoAgent();
        const messageData = cryptoAgent?.encrypt(message) ?? JSON.stringify(message);
        return messageData;
    }
    /**
     * 最新のトークンを返します。
     * @returns 最新のトークン
     */
    getLatestToken() {
        const latestValidator = this.getLatestValidator();
        const tokenProvider = latestValidator.getProvider();
        const latestToken = tokenProvider.getValue();
        return latestToken;
    }
}
exports.ChromeMessageAgent = ChromeMessageAgent;
