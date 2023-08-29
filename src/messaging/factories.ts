/**
 * @file 暗号化メッセージパッシングクラスファクトリ関数
 */

import { isBackground } from "../utils/chrome-ext-utils";

import { AESCryptoAgent } from "./aes-crypto-agent";
import { ChromeMessageAgent } from "./chrome-message-agent";
import { DefaultMessageValidatorManager } from "./default-message-validatior-manager";
import { DefaultMessageValidator } from "./default-message-validator";
import {
  CryptoAgent,
  MessageAgent,
  MessageData,
  MessageValidator,
  MessageValidatorManager,
  ValidatorConfig,
} from "./interfaces";
import { SessionStaticKeyProvider } from "./session-static-key-provider";
import { SessionStaticTokenProvider } from "./session-static-token-provider";

/**
 * CryptoAgentを生成します。
 * @returns CryptoAgent
 */
export const createCryptoAgent = async <T extends MessageData>(): Promise<
  CryptoAgent<T>
> => {
  const keyProvider = new SessionStaticKeyProvider();
  await keyProvider.generateValue(false);

  const cryptoAgent = new AESCryptoAgent<T>(keyProvider);
  return cryptoAgent;
};

/**
 * MessageAgentを生成します。
 * @param config 検証設定
 * @returns MessageAgent
 */
export const createMessageAgent = async <T extends MessageData>(
  config: ValidatorConfig,
): Promise<MessageAgent<T>> => {
  const messageValidatorManager =
    await createMessageValidatorManager<T>(config);

  const messageAgent = new ChromeMessageAgent<T>(messageValidatorManager);

  return messageAgent;
};

/**
 * MessageValidatorManagerを生成します。
 * @param config 検証設定
 * @param maxMessageValidators Validatorの最大保持数
 * @param validatorRefreshInterval Validatorを更新する間隔(分)
 * @returns MessageValidatorManager
 */
export const createMessageValidatorManager = async <T extends MessageData>(
  config: ValidatorConfig,
  maxMessageValidators = 3,
  validatorRefreshInterval = 1,
): Promise<MessageValidatorManager<T>> => {
  const createMessageValidatorFunc = async () =>
    createMessageValidator<T>(config);

  const messageValidator = await createMessageValidatorFunc();

  const messageValidatorManager = new DefaultMessageValidatorManager<T>(
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

/**
 * MessageValidatorを生成します。
 * @param config 検証設定
 * @returns MessageValidator
 */
export const createMessageValidator = async <T extends MessageData>(
  config: ValidatorConfig,
): Promise<MessageValidator<T>> => {
  const cryptoAgent = await createCryptoAgent<T>();

  const tokenProvider = new SessionStaticTokenProvider();
  await tokenProvider.generateValue(false);

  const messageValidator = new DefaultMessageValidator<T>(
    config,
    tokenProvider,
    cryptoAgent,
  );

  return messageValidator;
};
