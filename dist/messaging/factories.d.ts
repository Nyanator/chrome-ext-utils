import { CryptoAgent, MessageAgent, MessageDataObject, MessageValidator, MessageValidatorManager, ValidatorConfig } from "./interfaces";
/**
 * CryptoAgentを生成します。
 * @returns CryptoAgent
 */
export declare const createCryptoAgent: () => Promise<CryptoAgent<MessageDataObject> | undefined>;
/**
 * MessageAgentを生成します。
 * @param config 検証設定
 * @returns MessageAgent
 */
export declare const createMessageAgent: (config: ValidatorConfig) => Promise<MessageAgent<MessageDataObject>>;
/**
 * MessageValidatorManagerを生成します。
 * @param config 検証設定
 * @param maxMessageValidators Validatorの最大保持数
 * @param validatorRefreshInterval Validatorを更新する間隔(分)
 * @returns MessageValidatorManager
 */
export declare const createMessageValidatorManager: (config: ValidatorConfig, maxMessageValidators?: number, validatorRefreshInterval?: number) => Promise<MessageValidatorManager<MessageDataObject>>;
/**
 * MessageValidatorを生成します。
 * @param config 検証設定
 * @returns MessageValidator
 */
export declare const createMessageValidator: (config: ValidatorConfig) => Promise<MessageValidator<MessageDataObject>>;
