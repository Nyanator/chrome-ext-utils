import { chrome } from "jest-chrome";

import { AESCryptoAgent, CryptoAgent } from "../crypto-agent";
import {
  MessageValidatorManager,
  MessageValidatorManagerImpl,
} from "../message-validatior-manager";
import * as MessageValidator from "../message-validator";
import * as ChromeExtensionUtils from "../utils/chrome-ext-utils";

import * as MockUtils from "./mocks/mock-utils";

describe("MessageValidatorManagerクラスのテスト", () => {
  let cryptoAgent: CryptoAgent<MessageValidator.MessageData>;
  let messageValidatorManager: MessageValidatorManager<MessageValidator.MessageData>;

  // 有効なメッセージのモック
  let mockValidMessage: unknown;
  // 無効なメッセージのモック
  let mockInValidRuntimeIdMessage: unknown;

  beforeEach(async () => {
    cryptoAgent = new AESCryptoAgent<MessageValidator.MessageData>(
      MockUtils.mockSessionStaticValueProvider,
    );
    mockValidMessage = MockUtils.createMockValidMessage(cryptoAgent);
    mockInValidRuntimeIdMessage =
      MockUtils.createMockInvalidRuntimeIdMessage(cryptoAgent);

    jest
      .spyOn(MessageValidator, "MessageValidator")
      .mockResolvedValue(MockUtils.mockMessageValidator);

    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(false);
    messageValidatorManager = await MessageValidatorManager(
      MockUtils.mockValidatorConfig,
      3,
      1,
    );

    new MessageValidatorManagerImpl(
      await MessageValidator.MessageValidator(MockUtils.mockValidatorConfig),
      async () =>
        await MessageValidator.MessageValidator(MockUtils.mockValidatorConfig),
      1,
    );
  });

  it("validationProcess 有効なメッセージを検証すると結果を返す", async () => {
    MockUtils.mockMessageValidator.isValid.mockReturnValueOnce(true);
    const result = await messageValidatorManager.processValidation(
      MockUtils.allowedOrigins[0],
      mockValidMessage,
    );
    expect(result).toBe(true);
  });

  it("validationProcess 無効なメッセージを検証するとundefinedを返す", async () => {
    MockUtils.mockMessageValidator.isValid.mockReturnValueOnce(false);
    const result = await messageValidatorManager.processValidation(
      MockUtils.allowedOrigins[0],
      mockInValidRuntimeIdMessage,
    );
    expect(result).toBeUndefined();
  });

  it("refreshValidators 新しいValidatorを追加する", async () => {
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(true);
    await messageValidatorManager.refreshValidators();
    expect(messageValidatorManager.getValidators().length).toBe(2);
  });

  it("refreshValidators 最大Validator数を超えた場合、古いValidatorを削除する", async () => {
    await messageValidatorManager.refreshValidators(); // 2つ目のValidator
    await messageValidatorManager.refreshValidators(); // 3つ目のValidator
    await messageValidatorManager.refreshValidators(); // 4つ目のValidator
    expect(messageValidatorManager.getValidators().length).toBe(3);
  });

  it("バックグラウンドでは、chrome.alarms.createを呼んでいる", async () => {
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(true);
    messageValidatorManager = await MessageValidatorManager(
      MockUtils.mockValidatorConfig,
      3,
      1,
    );
    expect(chrome.alarms.create).toHaveBeenLastCalledWith(expect.anything(), {
      periodInMinutes: 1,
    });

    // アラームでrefreshValidatorsが実行されるか
    const refreshValidatorsSpy = jest.spyOn(
      messageValidatorManager,
      "refreshValidators",
    );
    chrome.alarms.onAlarm.callListeners({
      scheduledTime: 0,
      name: "",
    });
    expect(refreshValidatorsSpy).toHaveBeenCalled();
  });

  it("バックグラウンド以外では、setIntervalを呼んでいる", async () => {
    jest.useFakeTimers();

    const setIntervalSpy = jest.spyOn(global, "setInterval");
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(false);
    messageValidatorManager = await MessageValidatorManager(
      MockUtils.mockValidatorConfig,
      3,
      1,
    );
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.anything(),
      1 * 60 * 1000,
    );

    // setIntervalでrefreshValidatorsが実行されるか
    const refreshValidatorsSpy = jest.spyOn(
      messageValidatorManager,
      "refreshValidators",
    );
    jest.advanceTimersByTime(1 * 60 * 1000);
    expect(refreshValidatorsSpy).toHaveBeenCalled();
  });
});