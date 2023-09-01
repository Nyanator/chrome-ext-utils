/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム)
 */

import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData } from "./message-validator";
import { assertNotNull } from "./utils/ts-utils";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム) */
export interface RuntimeMessageAgent<T extends MessageData> {
  /**
   * 暗号化されたランタイムメッセージを送信します。
   * @param message 送信するメッセージデータ
   * @param tabId 送信先タブの ID
   */
  sendMessage(message: T, tabId?: number): Promise<unknown>;

  /**
   * ランタイムメッセージを受信し、復号化してリスナー関数に渡します。
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  addListener(listener: (messageData: T) => Promise<unknown>): void;

  /**
   * ランタイムメッセージの購読を解除します。
   */
  removeListener(): void;
}

/**
 * ファクトリ関数
 * @param messageValidatorManager バリデーターマネージャー
 */
export const RuntimeMessageAgent = async <T extends MessageData>(
  messageValidatorManager: MessageValidatorManager<T>,
): Promise<RuntimeMessageAgent<T>> => {
  const messageAgent = new RuntimeMessageAgentImpl(messageValidatorManager);
  return messageAgent;
};

class RuntimeMessageAgentImpl<T extends MessageData>
  implements RuntimeMessageAgent<T>
{
  private runtimeListener?: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => void;

  constructor(private readonly validatorManager: MessageValidatorManager<T>) {}

  async sendMessage(message: T, tabId?: number): Promise<unknown> {
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

  addListener(listener: (messageData: T) => Promise<unknown>): void {
    this.removeListener();

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

  removeListener(): void {
    if (this.runtimeListener) {
      chrome.runtime.onMessage.removeListener(this.runtimeListener);
      this.runtimeListener = undefined;
    }
  }
}
