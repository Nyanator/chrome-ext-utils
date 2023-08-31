import { assertNotNull } from "../utils/ts-utils";

import {
  MessageData,
  MessageValidatorManager,
  RuntimeMessageAgent,
} from "./interfaces";

/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間でのメッセージ通信を提供します。
 * Chrome Runtimeメッセージ用の実装。
 */
export class ChromeRuntimeMessageAgent<T extends MessageData>
  implements RuntimeMessageAgent<T>
{
  private runtimeListener?: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => void;

  /**
   * ChromeRuntimeMessageAgent クラスのインスタンスを初期化します。
   * @param validatorManager MessageValidatorを管理するオブジェクト
   */
  constructor(private readonly validatorManager: MessageValidatorManager<T>) {}

  /**
   * 暗号化されたランタイムメッセージを送信します。
   * @param message 送信するメッセージデータ
   * @param tabId 送信先タブの ID
   * @returns 相手からの応答
   */
  async sendRuntimeMessage(message: T, tabId?: number): Promise<unknown> {
    const latestValidator = this.validatorManager.getValidators().slice(-1)[0];
    const cryptoAgent = latestValidator.getCryptoAgent();
    const messageData =
      cryptoAgent?.encrypt(message) ?? JSON.stringify(message);
    const latestToken = latestValidator.getProvider().getValue();

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
   * ランタイムメッセージを受信し、復号化してリスナー関数に渡します。
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  runtimeMessageListener(listener: (messageData: T) => Promise<unknown>): void {
    this.removeRuntimeMessageListener();

    this.runtimeListener = (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      // IIFE
      (async () => {
        const senderOrigin = assertNotNull(sender.origin);
        const messageData = await this.validatorManager.processValidation(
          senderOrigin,
          message,
        );

        if (!messageData) {
          return;
        }

        const response = await listener(messageData);
        sendResponse(response);
      })();

      // 呼び元のPromiseが解決されるのにtrueを返す必要がある
      return true;
    };

    chrome.runtime.onMessage.addListener(this.runtimeListener);
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
}
