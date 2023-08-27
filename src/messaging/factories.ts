import { isBackground } from "../utils/chrome-ext-utils";

import { AESCryptoAgent } from "./aes-crypto-agent";
import { ChromeMessageAgent } from "./chrome-message-agent";
import { DefaultMessageValidatorManager } from "./default-message-validatior-manager";
import { DefaultMessageValidator } from "./default-message-validator";
import {
  CryptoAgent,
  MessageAgent,
  MessageDataObject,
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
export const createCryptoAgent = async (): Promise<
  CryptoAgent<MessageDataObject> | undefined
> => {
  const keyProvider = new SessionStaticKeyProvider();
  await keyProvider.generateValue(false);
  const cryptoAgent = new AESCryptoAgent<MessageDataObject>(keyProvider);
  return cryptoAgent;
};

/**
 * MessageAgentを生成します。
 * @param config 検証設定
 * @returns MessageAgent
 */
export const createMessageAgent = async (
  config: ValidatorConfig,
): Promise<MessageAgent<MessageDataObject>> => {
  const messageValidatorManager = await createMessageValidatorManager(config);
  const messageAgent = new ChromeMessageAgent<MessageDataObject>(
    messageValidatorManager,
  );
  return messageAgent;
};

/**
 * MessageValidatorManagerを生成します。
 * @param config 検証設定
 * @param maxMessageValidators Validatorの最大保持数
 * @param validatorRefreshInterval Validatorを更新する間隔(分)
 * @returns MessageValidatorManager
 */
export const createMessageValidatorManager = async (
  config: ValidatorConfig,
  maxMessageValidators = 3,
  validatorRefreshInterval = 1,
): Promise<MessageValidatorManager<MessageDataObject>> => {
  const createMessageValidatorFunc = async () => createMessageValidator(config);
  const messageValidator = await createMessageValidatorFunc();

  const messageValidatorManager =
    new DefaultMessageValidatorManager<MessageDataObject>(
      messageValidator,
      createMessageValidatorFunc,
      maxMessageValidators,
    );

  if (isBackground()) {
    chrome.alarms.create("refreshSession", {
      periodInMinutes: validatorRefreshInterval,
    });
    chrome.alarms.onAlarm.addListener(() => {
      messageValidatorManager.refreshValidator();
    });
  } else {
    setInterval(
      async () => {
        messageValidatorManager.refreshValidator();
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
export const createMessageValidator = async (
  config: ValidatorConfig,
): Promise<MessageValidator<MessageDataObject>> => {
  const cryptoAgent = await createCryptoAgent();
  const tokenProvider = new SessionStaticTokenProvider();
  await tokenProvider.generateValue(false);
  const messageValidator = new DefaultMessageValidator(
    config,
    tokenProvider,
    cryptoAgent,
  );
  return messageValidator;
};
