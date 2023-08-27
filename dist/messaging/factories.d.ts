import { CryptoAgent, MessageAgent, MessageDataObject, MessageValidator, MessageValidatorManager, ValidatorConfig } from "./interfaces";
/**
 * CryptoAgentを生成します。
 * @returns CryptoAgent
 */
export declare const createCryptoAgent: <T extends MessageDataObject>() => Promise<CryptoAgent<T>>;
/**
 * MessageAgentを生成します。
 * @param config 検証設定
 * @returns MessageAgent
 */
export declare const createMessageAgent: <T extends MessageDataObject>(config: ValidatorConfig) => Promise<MessageAgent<T>>;
/**
 * MessageValidatorManagerを生成します。
 * @param config 検証設定
 * @param maxMessageValidators Validatorの最大保持数
 * @param validatorRefreshInterval Validatorを更新する間隔(分)
 * @returns MessageValidatorManager
 */
export declare const createMessageValidatorManager: <T extends MessageDataObject>(config: ValidatorConfig, maxMessageValidators?: number, validatorRefreshInterval?: number) => Promise<MessageValidatorManager<T>>;
/**
 * MessageValidatorを生成します。
 * @param config 検証設定
 * @returns MessageValidator
 */
export declare const createMessageValidator: <T extends MessageDataObject>(config: ValidatorConfig) => Promise<MessageValidator<T>>;
