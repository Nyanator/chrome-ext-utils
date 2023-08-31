import {
  MessageData,
  MessageValidatorManager,
  WindowMessageAgent,
} from "./interfaces";

/**
 * メッセージの暗号化と復号化を管理し、各コンテキスト間でのメッセージ通信を提供します。
 * Windowメッセージ用の実装。
 */
export class DefaultWindowMessageAgent<T extends MessageData>
  implements WindowMessageAgent<T>
{
  private windowListener?: (event: MessageEvent) => void;

  /**
   * DefaultWindowMessageAgent クラスのインスタンスを初期化します。
   * @param validatorManager MessageValidatorを管理するオブジェクト
   */
  constructor(private readonly validatorManager: MessageValidatorManager<T>) {}

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

  /**
   * ウィンドウメッセージを受信し、復号化してリスナー関数に渡します。
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  windowMessageListener(listener: (event: T) => void): void {
    this.removeWindowMessageListener();

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

  /**
   * Windowメッセージの購読を解除します。
   */
  removeWindowMessageListener(): void {
    if (this.windowListener) {
      window.removeEventListener("message", this.windowListener);
      this.windowListener = undefined;
    }
  }
}
