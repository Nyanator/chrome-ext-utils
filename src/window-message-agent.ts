/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ)
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData, MessageValidatorConfig } from "./message-validator";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ) */
export interface WindowMessageAgent {
  /**
   * 暗号化されたメッセージを windowに送信します。
   * @param target 送信先の window
   * @param targetOrigin 送信先のオリジン
   * @param channel 送信先のチャンネル
   * @param message 送信するメッセージデータ
   */
  postMessage(arg: {
    target: Window;
    targetOrigin: string;
    channel?: string;
    message: MessageData;
  }): Promise<void>;

  /**
   * ウィンドウメッセージを受信し、復号化してリスナー関数に渡します。
   * @param channel 受信チャンネル
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  addListener(arg: { channel?: string; listener: (event: MessageData) => void }): void;

  /** 指定したリスナーを解除します。*/
  removeListener(listener: (event: MessageData) => void): void;

  /** リスナーをすべて解除します。*/
  clearListeners(): void;
}

@injectable()
export class WindowMessageAgentImpl implements WindowMessageAgent {
  private readonly windowListeners: Map<
    (event: MessageData) => void,
    (event: MessageEvent) => void
  > = new Map();

  constructor(
    @inject("MessageValidatorManager")
    private readonly validatorManager: MessageValidatorManager,
    @inject("MessageValidatorConfig")
    private readonly validatorConfig: MessageValidatorConfig,
    @inject("Logger") private readonly logger: Logger,
  ) {}

  async postMessage(arg: {
    target: Window;
    channel?: string;
    targetOrigin: string;
    message: MessageData;
  }): Promise<void> {
    if (!this.validatorConfig.allowedOrigins.includes(arg.targetOrigin)) {
      throw new Error(`Invalid targetOrigin: ${arg.targetOrigin}`);
    }

    const latestValidator = await this.validatorManager.getLatestValidator();
    const cryptoAgent = latestValidator.getCryptoAgent();
    const messageData = cryptoAgent?.encrypt(arg.message) ?? JSON.stringify(arg.message);
    const latestToken = latestValidator.getProvider().getValue();

    arg.target.postMessage(
      {
        token: latestToken,
        channel: arg.channel,
        messageData: messageData,
      },
      arg.targetOrigin,
    );
  }

  addListener(arg: { channel?: string; listener: (event: MessageData) => void }): void {
    const newListener = async (event: MessageEvent) => {
      const messageData = await this.validatorManager.processValidation({
        origin: event.origin,
        channel: arg.channel,
        message: event.data,
      });
      if (!messageData) {
        return;
      }

      arg.listener(messageData);
    };

    this.windowListeners.set(arg.listener, newListener);
    window.addEventListener("message", newListener);
  }

  removeListener(listener: (event: MessageData) => void): void {
    const windowListener = this.windowListeners.get(listener);
    if (windowListener) {
      window.removeEventListener("message", windowListener);
      this.windowListeners.delete(listener);
    }
  }

  clearListeners(): void {
    this.windowListeners.forEach((listener) => {
      window.removeEventListener("message", listener);
    });
    this.windowListeners.clear();
  }
}
