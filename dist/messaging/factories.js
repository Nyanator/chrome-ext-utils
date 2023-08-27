"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessageValidator = exports.createMessageValidatorManager = exports.createMessageAgent = exports.createCryptoAgent = void 0;
const chrome_ext_utils_1 = require("../utils/chrome-ext-utils");
const aes_crypto_agent_1 = require("./aes-crypto-agent");
const chrome_message_agent_1 = require("./chrome-message-agent");
const default_message_validatior_manager_1 = require("./default-message-validatior-manager");
const default_message_validator_1 = require("./default-message-validator");
const session_static_key_provider_1 = require("./session-static-key-provider");
const session_static_token_provider_1 = require("./session-static-token-provider");
/**
 * CryptoAgentを生成します。
 * @returns CryptoAgent
 */
const createCryptoAgent = async () => {
    const keyProvider = new session_static_key_provider_1.SessionStaticKeyProvider();
    await keyProvider.generateValue(false);
    const cryptoAgent = new aes_crypto_agent_1.AESCryptoAgent(keyProvider);
    return cryptoAgent;
};
exports.createCryptoAgent = createCryptoAgent;
/**
 * MessageAgentを生成します。
 * @param config 検証設定
 * @returns MessageAgent
 */
const createMessageAgent = async (config) => {
    const messageValidatorManager = await (0, exports.createMessageValidatorManager)(config);
    const messageAgent = new chrome_message_agent_1.ChromeMessageAgent(messageValidatorManager);
    return messageAgent;
};
exports.createMessageAgent = createMessageAgent;
/**
 * MessageValidatorManagerを生成します。
 * @param config 検証設定
 * @param maxMessageValidators Validatorの最大保持数
 * @param validatorRefreshInterval Validatorを更新する間隔(分)
 * @returns MessageValidatorManager
 */
const createMessageValidatorManager = async (config, maxMessageValidators = 3, validatorRefreshInterval = 1) => {
    const createMessageValidatorFunc = async () => (0, exports.createMessageValidator)(config);
    const messageValidator = await createMessageValidatorFunc();
    const messageValidatorManager = new default_message_validatior_manager_1.DefaultMessageValidatorManager(messageValidator, createMessageValidatorFunc, maxMessageValidators);
    if ((0, chrome_ext_utils_1.isBackground)()) {
        chrome.alarms.create("refreshSession", {
            periodInMinutes: validatorRefreshInterval,
        });
        chrome.alarms.onAlarm.addListener(() => {
            messageValidatorManager.refreshValidator();
        });
    }
    else {
        setInterval(async () => {
            messageValidatorManager.refreshValidator();
        }, validatorRefreshInterval * 60 * 1000);
    }
    return messageValidatorManager;
};
exports.createMessageValidatorManager = createMessageValidatorManager;
/**
 * MessageValidatorを生成します。
 * @param config 検証設定
 * @returns MessageValidator
 */
const createMessageValidator = async (config) => {
    const cryptoAgent = await (0, exports.createCryptoAgent)();
    const tokenProvider = new session_static_token_provider_1.SessionStaticTokenProvider();
    await tokenProvider.generateValue(false);
    const messageValidator = new default_message_validator_1.DefaultMessageValidator(config, tokenProvider, cryptoAgent);
    return messageValidator;
};
exports.createMessageValidator = createMessageValidator;
