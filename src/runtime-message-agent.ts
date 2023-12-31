/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム)
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData } from "./message-validator";
import { assertNotNull } from "./utils/ts-utils";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム) */
export interface RuntimeMessageAgent {
  /**
   * 暗号化されたランタイムメッセージを送信します。
   * @param channel 送信チャンネル
   * @param message 送信するメッセージデータ
   * @param tabId 送信先タブの ID
   */
  sendMessage(
    channel: string,
    message?: MessageData,
    tabId?: number,
  ): Promise<MessageData | void>;

  /**
   * ランタイムメッセージを受信し、復号化してリスナー関数に渡します。
   * @param channel 受信チャンネル
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  addListener(
    channel: string,
    listener: (messageData: MessageData) => Promise<MessageData | void> | void,
  ): void;

  /** 指定したリスナーを解除します。*/
  removeListener(
    listener: (messageData: MessageData) => Promise<MessageData | void> | void,
  ): void;

  /** リスナーをすべて解除します。*/
  clearListeners(): void;
}

@injectable()
export class RuntimeMessageAgentImpl implements RuntimeMessageAgent {
  private readonly runtimeListeners: Map<
    (messageData: MessageData) => Promise<MessageData | void> | void,
    (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => void
  > = new Map();

  constructor(
    @inject("MessageValidatorManager")
    private readonly validatorManager: MessageValidatorManager,
    @inject("Logger") private readonly logger: Logger,
  ) {}

  async sendMessage(
    channel: string,
    message?: MessageData,
    tabId?: number,
  ): Promise<MessageData | void> {
    if (!message) {
      message = {
        runtimeId: chrome.runtime.id,
      };
    }

    if (!message.runtimeId) {
      message.runtimeId = chrome.runtime.id;
    }

    const latestValidator = await this.validatorManager.getLatestValidator();

    const cryptoAgent = latestValidator.getCryptoAgent();
    const messageData = cryptoAgent.encrypt(message);
    const latestToken = latestValidator.getProvider().getValue();

    if (!tabId) {
      const latestRuntimeId = latestValidator.getConfig().runtimeId;
      return chrome.runtime.sendMessage(latestRuntimeId, {
        token: latestToken,
        channel: channel,
        messageData: messageData,
      });
    }

    return chrome.tabs.sendMessage(tabId, {
      token: latestToken,
      channel: channel,
      messageData: messageData,
    });
  }

  addListener(
    channel: string,
    listener: (messageData: MessageData) => Promise<MessageData | void> | void,
  ): void {
    const newListener = (
      message: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ) => {
      (async () => {
        const senderOrigin = assertNotNull(sender.origin);
        const messageData = await this.validatorManager.processValidation({
          origin: senderOrigin,
          channel: channel,
          message: message,
        });
        if (!messageData) {
          return;
        }

        const response = await listener(messageData);
        sendResponse(response);
      })();

      // 呼び元のPromiseが解決されるのにtrueを返す必要がある
      return true;
    };

    this.runtimeListeners.set(listener, newListener);
    chrome.runtime.onMessage.addListener(newListener);
  }

  removeListener(
    listener: (messageData: MessageData) => Promise<MessageData | void> | void,
  ): void {
    const runtimeListener = this.runtimeListeners.get(listener);
    if (runtimeListener) {
      chrome.runtime.onMessage.removeListener(runtimeListener);
      this.runtimeListeners.delete(listener);
    }
  }

  clearListeners(): void {
    this.runtimeListeners.forEach((listener) => {
      chrome.runtime.onMessage.removeListener(listener);
    });
    this.runtimeListeners.clear();
  }
}
