/**
 * @file 暗号化メッセージパッシングクラスファクトリ関数
 */

import { createCryptoAgent } from "../encryption/factories";
import { SessionStaticTokenProvider } from "../session/session-static-token-provider";
import { isBackground } from "../utils/chrome-ext-utils";

import { ChromeRuntimeMessageAgent } from "./chrome-runtime-message-agent";
import { DefaultMessageValidatorManager } from "./default-message-validatior-manager";
import { DefaultMessageValidator } from "./default-message-validator";
import { DefaultWindowMessageAgent } from "./default-window-message-agent";
import {
  MessageData,
  MessageValidator,
  MessageValidatorManager,
  RuntimeMessageAgent,
  ValidatorConfig,
  WindowMessageAgent,
} from "./interfaces";

/**
 * RuntimeMessageAgentを生成します。
 * @param messageValidatorManager バリデーターマネージャー
 * @returns MessageAgent
 */
export const createRuntimeMessageAgent = async <T extends MessageData>(
  messageValidatorManager: MessageValidatorManager<T>,
): Promise<RuntimeMessageAgent<T>> => {
  const messageAgent = new ChromeRuntimeMessageAgent(messageValidatorManager);
  return messageAgent;
};

/**
 * WindowMessageAgentを生成します。
 * @param messageValidatorManager バリデーターマネージャー
 * @returns MessageAgent
 */
export const createWindowMessageAgent = async <T extends MessageData>(
  messageValidatorManager: MessageValidatorManager<T>,
): Promise<WindowMessageAgent<T>> => {
  const messageAgent = new DefaultWindowMessageAgent(messageValidatorManager);
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

  const messageValidator = new DefaultMessageValidator(
    config,
    tokenProvider,
    cryptoAgent,
  );

  return messageValidator;
};
