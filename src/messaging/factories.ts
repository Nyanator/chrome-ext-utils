import { isBackground } from "../utils/chrome-ext-utils";

import { AESCryptoAgent } from "./crypto-agent";
import {
  CryptoAgent,
  MessageAgent,
  MessageDataObject,
  MessageValidator,
  MessageValidatorManager,
  ValidatorConfig,
} from "./interfaces";
import { ChromeExtMessageAgent } from "./message-agent";
import { DefaultMessageValidatorManager } from "./message-validatior-manager";
import { DefaultMessageValidator } from "./message-validator";
import {
  SessionStaticKeyProvider,
  SessionStaticTokenProvider,
} from "./session-static-value-provider";

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
  config: ValidatorConfig
): Promise<MessageAgent<MessageDataObject>> => {
  const messageValidatorManager = await createMessageValidatorManager(config);
  const messageAgent = new ChromeExtMessageAgent<MessageDataObject>(
    messageValidatorManager
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
  validatorRefreshInterval = 1
): Promise<MessageValidatorManager<MessageDataObject>> => {
  const createMessageValidatorFunc = async () => createMessageValidator(config);
  const messageValidator = await createMessageValidatorFunc();

  const messageValidatorManager =
    new DefaultMessageValidatorManager<MessageDataObject>(
      messageValidator,
      createMessageValidatorFunc,
      maxMessageValidators
    );

  if (isBackground()) {
    chrome.alarms.create("refreshSession", {
      periodInMinutes: validatorRefreshInterval,
    });
    chrome.alarms.onAlarm.addListener(() => {
      messageValidatorManager.refreshValidator();
    });
  } else {
    setInterval(async () => {
      messageValidatorManager.refreshValidator();
    }, validatorRefreshInterval * 60 * 1000);
  }
  return messageValidatorManager;
};

/**
 * MessageValidatorを生成します。
 * @param config 検証設定
 * @returns MessageValidator
 */
export const createMessageValidator = async (
  config: ValidatorConfig
): Promise<MessageValidator<MessageDataObject>> => {
  const cryptoAgent = await createCryptoAgent();
  const tokenProvider = new SessionStaticTokenProvider();
  await tokenProvider.generateValue(false);
  const messageValidator = new DefaultMessageValidator(
    config,
    tokenProvider,
    cryptoAgent
  );
  return messageValidator;
};
