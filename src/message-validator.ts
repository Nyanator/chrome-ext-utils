/**
 * メッセージの正当性を検証します。
 */
import "reflect-metadata";
import { inject, injectable } from "tsyringe";

import { CryptoAgent } from "./crypto-agent";
import { Logger } from "./logger";
import { SessionStaticValue } from "./session-static-value";
import { equalsTypedRealMessage } from "./typia/generated/generate-validators";
import { assertNotNull } from "./utils/ts-utils";

export interface MessageValidator {
  /** 検証設定オブジェクトを返します。 */
  getConfig(): MessageValidatorConfig;

  /** トークンを供給するオブジェクトを返します。 */
  getProvider(): SessionStaticValue;

  /** 暗号化に使うCrypotAgentオブジェクトを返します。 */
  getCryptoAgent(): CryptoAgent<MessageData>;

  /** メッセージが正当か検証します。*/
  isValid(validationParam: ValidationParam): MessageData | undefined;
}

/** メッセージオブジェクト(暗号化される部分) */
export type MessageData = {
  /** 拡張機能のID */
  runtimeId?: string;

  /** データ識別用のキー */
  readonly key?: string;

  /** メッセージ本文 */
  readonly message?: string;
};

/** メッセージの正当性検証設定 */
export type MessageValidatorConfig = Readonly<{
  /** 拡張機能のID */
  runtimeId: string;

  /** 許可するオリジンの一覧 */
  allowedOrigins: string[];
}>;

/** Validationパラメータ */
export type ValidationParam = Readonly<{
  /** オリジン */
  origin: string;

  /** チャンネル識別子 */
  channel: string;

  /** メッセージ(ここに暗号化されたMessageDataが入る) */
  message: unknown;
}>;

/** APIで実際に送信されるオブジェクト */
export type TypedRealMessage = {
  token: string;
  channel: string;
  messageData: string;
};

@injectable()
export class MessageValidatorImpl implements MessageValidator {
  constructor(
    @inject("MessageValidatorConfig")
    private readonly config: MessageValidatorConfig,
    @inject("SessionStaticToken")
    private readonly tokenProvider: SessionStaticValue,
    @inject("Logger") private readonly logger: Logger,
    @inject("CryptoAgent")
    private readonly cryptoAgent: CryptoAgent<MessageData>,
  ) {}

  getConfig() {
    return this.config;
  }

  getProvider() {
    return assertNotNull(this.tokenProvider);
  }

  getCryptoAgent() {
    return this.cryptoAgent;
  }

  isValid(validationParam: ValidationParam): MessageData | undefined {
    // オリジンの検証
    if (!this.config.allowedOrigins.includes(validationParam.origin)) {
      return;
    }

    // 型検証
    if (!equalsTypedRealMessage(validationParam.message)) {
      return;
    }

    // トークンの検証
    const validToken = this.tokenProvider.getValue();
    if (validationParam.message.token !== validToken) {
      return;
    }

    // チャンネルが一致しない場合無視
    if (validationParam.channel !== validationParam.message.channel) {
      return;
    }

    // 複合化して
    const decryptedMessageData = this.cryptoAgent.decrypt(
      validationParam.message.messageData,
    );

    // 必須項目を検証
    if (decryptedMessageData.runtimeId !== this.config.runtimeId) {
      return;
    }

    return decryptedMessageData;
  }
}
