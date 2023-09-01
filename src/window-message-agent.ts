/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ)
 */

import { MessageValidatorManager } from "./message-validatior-manager";
import { MessageData } from "./message-validator";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ) */
export interface WindowMessageAgent<T extends MessageData> {
  /**
   * 暗号化されたメッセージを windowに送信します。
   * @param target 送信先の window
   * @param targetOrigin 送信先のオリジン
   * @param message 送信するメッセージデータ
   */
  postMessage(target: Window, targetOrigin: string, message: T): Promise<void>;

  /**
   * ウィンドウメッセージを受信し、復号化してリスナー関数に渡します。
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  addListener(listener: (event: T) => void): void;

  /**
   * Windowメッセージの購読を解除します。
   */
  removeListener(): void;
}

/**
 * ファクトリ関数
 * @param messageValidatorManager バリデーターマネージャー
 */
export const WindowMessageAgent = async <T extends MessageData>(
  messageValidatorManager: MessageValidatorManager<T>,
): Promise<WindowMessageAgent<T>> => {
  const messageAgent = new WindowMessageAgentImpl(messageValidatorManager);
  return messageAgent;
};

class WindowMessageAgentImpl<T extends MessageData>
  implements WindowMessageAgent<T>
{
  private windowListener?: (event: MessageEvent) => void;

  constructor(private readonly validatorManager: MessageValidatorManager<T>) {}

  async postMessage(
    target: Window,
    targetOrigin: string,
    message: T,
  ): Promise<void> {
    const latestValidator = this.validatorManager.getValidators().slice(-1)[0];
    const cryptoAgent = latestValidator.getCryptoAgent();
    const messageData =
      cryptoAgent?.encrypt(message) ?? JSON.stringify(message);
    const latestToken = latestValidator.getProvider().getValue();

    target.postMessage(
      {
        messageData: messageData,
        token: latestToken,
      },
      targetOrigin,
    );
  }

  addListener(listener: (event: T) => void): void {
    this.removeListener();

    this.windowListener = async (event: MessageEvent) => {
      const messageData = await this.validatorManager.processValidation(
        event.origin,
        event.data,
      );
      if (!messageData) {
        return;
      }

      listener(messageData);
    };

    window.addEventListener("message", this.windowListener);
  }

  removeListener(): void {
    if (this.windowListener) {
      window.removeEventListener("message", this.windowListener);
      this.windowListener = undefined;
    }
  }
}
