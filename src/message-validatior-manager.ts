/**
 * MessageValidatorを管理し、トークンを自動で更新
 */

import {
  MessageData,
  MessageValidator,
  ValidatorConfig,
} from "./message-validator";
import { isBackground } from "./utils/chrome-ext-utils";

export interface MessageValidatorManager<T extends MessageData> {
  /**
   * 送信内容の検証をします。
   * @param origin 送信元オリジン
   * @param message 検証対象のmessage
   * @returns 検証に成功した場合Tのインスタンス、それ以外undefined
   */
  processValidation(origin: string, message: unknown): Promise<T | undefined>;

  /**
   * 管理下のValidatorを更新します。
   */
  refreshValidators(): Promise<void>;

  /**
   * 管理下のValidatorのリストを返します。
   */
  getValidators(): MessageValidator<T>[];
}

/**
 * ファクトリ関数
 * @param config 検証設定
 * @param maxMessageValidators Validatorの最大保持数
 * @param validatorRefreshInterval Validatorを更新する間隔(分)
 */
export const MessageValidatorManager = async <T extends MessageData>(
  config: ValidatorConfig,
  maxMessageValidators = 3,
  validatorRefreshInterval = 1,
): Promise<MessageValidatorManager<T>> => {
  const createMessageValidatorFunc = async () => MessageValidator<T>(config);

  const messageValidator = await createMessageValidatorFunc();

  const messageValidatorManager = new MessageValidatorManagerImpl<T>(
    messageValidator,
    createMessageValidatorFunc,
    maxMessageValidators,
  );

  if (isBackground()) {
    chrome.alarms.create("refreshSession", {
      periodInMinutes: validatorRefreshInterval,
    });
    chrome.alarms.onAlarm.addListener(() => {
      messageValidatorManager.refreshValidators();
    });
  } else {
    setInterval(
      async () => {
        messageValidatorManager.refreshValidators();
      },
      validatorRefreshInterval * 60 * 1000,
    );
  }

  return messageValidatorManager;
};

class MessageValidatorManagerImpl<T extends MessageData>
  implements MessageValidatorManager<T>
{
  getValidators(): MessageValidator<T>[] {
    return this.managedValidators;
  }

  private readonly managedValidators: MessageValidator<T>[] = [];

  constructor(
    initialMessageValidator: MessageValidator<T>,
    private readonly createMessageValidator: () => Promise<MessageValidator<T>>,
    private readonly maxMessageValidators: number,
  ) {
    this.managedValidators.push(initialMessageValidator);
  }

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

  async refreshValidators(): Promise<void> {
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

  private pushValidator(newValidator: MessageValidator<T>) {
    this.managedValidators.push(newValidator);
    if (this.managedValidators.length > this.maxMessageValidators) {
      this.managedValidators.shift();
    }
  }
}