import { assertNotNull } from "../utils/ts-utils";

import {
  MessageAgent,
  MessageData,
  MessageValidator,
  MessageValidatorManager,
} from "./interfaces";

/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間でのメッセージ通信を提供します。
 * Chrome拡張用実装。
 */
export class ChromeMessageAgent<T extends MessageData>
  implements MessageAgent<T>
{
  private windowListener?: (event: MessageEvent) => void;
  private runtimeListener?: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => void;

  /**
   * ChromeExtMessageAgent クラスのインスタンスを初期化します。
   * @param messageValidatorManager MessageValidatorを管理するオブジェクト
   */
  constructor(
    private readonly messageValidatorManager: MessageValidatorManager<T>,
  ) {}

  /**
   * 暗号化されたメッセージを windowに送信します。
   * @param target 送信先の window
   * @param targetOrigin 送信先のオリジン
   * @param message 送信するメッセージデータ
   */
  async postWindowMessage(
    target: Window,
    targetOrigin: string,
    message: T,
  ): Promise<void> {
    const messageData = this.makeMessageData(message);
    const latestToken = this.getLatestToken();

    target.postMessage(
      {
        messageData: messageData,
        token: latestToken,
      },
      targetOrigin,
    );
  }

  /**
   * 暗号化されたランタイムメッセージを送信します。
   * @param message 送信するメッセージデータ
   * @param tabId 送信先タブの ID
   * @returns 相手からの応答
   */
  async sendRuntimeMessage(message: T, tabId?: number): Promise<unknown> {
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
  windowMessageListener(handler: (event: T) => void): void {
    this.removeWindowMessageListener();

    this.windowListener = async (event: MessageEvent) => {
      const messageData = await this.messageValidatorManager.processValidation(
        event.origin,
        event.data,
      );
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
  runtimeMessageListener(handler: (messageData: T) => Promise<unknown>): void {
    this.removeRuntimeMessageListener();

    this.runtimeListener = (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      // IIFE
      (async () => {
        const senderOrigin = assertNotNull(sender.origin);
        const messageData =
          await this.messageValidatorManager.processValidation(
            senderOrigin,
            message,
          );

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
  removeWindowMessageListener(): void {
    if (this.windowListener) {
      window.removeEventListener("message", this.windowListener);
      this.windowListener = undefined;
    }
  }

  /**
   * ランタイムメッセージの購読を解除します。
   */
  removeRuntimeMessageListener(): void {
    if (this.runtimeListener) {
      chrome.runtime.onMessage.removeListener(this.runtimeListener);
      this.runtimeListener = undefined;
    }
  }

  /**
   * 最新のValidatorを返します。
   * @returns 最新のValidator
   */
  private getLatestValidator(): MessageValidator<T> {
    const validators = this.messageValidatorManager.getValidators();
    const latestValidator = validators.slice(-1)[0];
    return latestValidator;
  }

  /**
   * 送信用のメッセージを生成します。
   * @returns 送信用のメッセージ
   */
  private makeMessageData(message: T): string {
    const latestValidator = this.getLatestValidator();
    const cryptoAgent = latestValidator.getCryptoAgent();
    const messageData =
      cryptoAgent?.encrypt(message) ?? JSON.stringify(message);
    return messageData;
  }

  /**
   * 最新のトークンを返します。
   * @returns 最新のトークン
   */
  private getLatestToken(): string {
    const latestValidator = this.getLatestValidator();
    const tokenProvider = latestValidator.getProvider();
    const latestToken = tokenProvider.getValue();
    return latestToken;
  }
}
