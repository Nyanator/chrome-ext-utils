import { isBackground } from "../utils/chrome-ext-utils";

import {
  MessageDataObject,
  MessageValidator,
  MessageValidatorManager,
} from "./interfaces";

/**
 * MessageValidatorを管理し、トークンを更新します。
 */
export class DefaultMessageValidatorManager<T extends MessageDataObject>
  implements MessageValidatorManager<T>
{
  getValidators(): MessageValidator<T>[] {
    return this.managedValidators;
  }

  private readonly managedValidators: MessageValidator<T>[] = [];

  /**
   * DefaultMessageValidatorManager クラスのインスタンスを初期化します。
   * @param initialMessageValidator メッセージの正当性検証に使用するMessageValidatorの初期値
   * @param createMessageValidator MessageValidatorの生成関数
   * @param maxMessageValidators MessageValidatorの最大保持数
   */
  constructor(
    initialMessageValidator: MessageValidator<T>,
    private readonly createMessageValidator: () => Promise<MessageValidator<T>>,
    private readonly maxMessageValidators: number,
  ) {
    this.managedValidators.push(initialMessageValidator);
  }

  /**
   * 送信内容の検証をします。
   * @param origin 送信元オリジン
   * @param message 検証対象のmessage
   * @returns 検証に成功した場合Tのインスタンス、それ以外undefined
   */
  async processValidation(
    origin: string,
    message: unknown,
  ): Promise<T | undefined> {
    // 非同期通信ではトークンの更新タイミングと送信が重なるとエラーとなってしまう
    // valiatorオブジェクトのリストを用意して確認することで通信の安定性を実現している

    // 管理下にあるValidatorで検証が通る場合はOK
    const managedValidatorsResult = this.managedValidatorsValidation(
      origin,
      message,
    );
    if (managedValidatorsResult) {
      return managedValidatorsResult;
    }

    // 検証が通らなかったので、セッションから新しいValidatorを生成
    const newValidator = await this.createMessageValidator();
    this.pushValidator(newValidator);

    // 最終的な検証結果は新規作成したValidatorで決定する
    const newValidatorResult = newValidator.isValid(origin, message);
    return newValidatorResult;
  }

  /**
   * 管理下のValidatorを更新します。
   */
  async refreshValidator(): Promise<void> {
    // セッションから新しいValidatorを生成
    const newValidator = await this.createMessageValidator();

    if (isBackground()) {
      const tokenProvider = newValidator.getProvider();
      const keyProvider = newValidator.getCryptoAgent()?.getProvider();

      // 新しいValidatorのトークンとキーを再作成する
      await tokenProvider.generateValue(true);
      await keyProvider?.generateValue(true);
    }
    this.pushValidator(newValidator);
  }

  /**
   * 現在管理下のValidatorで検証をします。
   */
  private managedValidatorsValidation(
    origin: string,
    message: unknown,
  ): T | undefined {
    // Validatorリストを逆順にして、最新のValidatorから検証を試みます
    for (const validator of [...this.managedValidators].reverse()) {
      const validationResult = validator.isValid(origin, message);
      if (validationResult) {
        return validationResult;
      }
    }
  }

  /**
   * Validatorを管理下にいれます。
   */
  private pushValidator(newValidator: MessageValidator<T>) {
    this.managedValidators.push(newValidator);
    if (this.managedValidators.length > this.maxMessageValidators) {
      this.managedValidators.shift();
    }
  }
}
