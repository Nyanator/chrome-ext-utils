import { chrome } from "jest-chrome";
import { container } from "tsyringe";

import { AESCryptoAgent, CryptoAgent } from "../crypto-agent";
import { ConsoleInjectableLogger } from "../logger";
import {
  MessageValidatorManager,
  MessageValidatorManagerConfig,
  MessageValidatorManagerImpl,
} from "../message-validatior-manager";
import * as MessageValidator from "../message-validator";
import * as ChromeExtensionUtils from "../utils/chrome-ext-utils";

import * as MockUtils from "./mocks/mock-utils";

describe("MessageValidatorManagerクラスのテスト", () => {
  let cryptoAgent: CryptoAgent<MessageValidator.MessageData>;
  let messageValidatorManager: MessageValidatorManager;

  // 有効なメッセージのモック
  let mockValidMessage: unknown;
  // 無効なメッセージのモック
  let mockInValidRuntimeIdMessage: unknown;

  beforeEach(async () => {
    container.clearInstances();

    container.register("Logger", {
      useClass: ConsoleInjectableLogger,
    });

    container.register("SessionStaticToken", {
      useValue: MockUtils.mockSessionStaticValue,
    });

    container.register("SessionStaticKey", {
      useValue: MockUtils.mockSessionStaticValue,
    });

    container.register("MessageValidatorConfig", {
      useValue: MockUtils.mockValidatorConfig,
    });

    container.register<CryptoAgent<MessageValidator.MessageData>>("CryptoAgent", {
      useClass: AESCryptoAgent,
    });

    cryptoAgent =
      container.resolve<CryptoAgent<MessageValidator.MessageData>>("CryptoAgent");

    mockValidMessage = MockUtils.createMockValidMessage(cryptoAgent);

    mockInValidRuntimeIdMessage =
      MockUtils.createMockInvalidRuntimeIdMessage(cryptoAgent);

    container.register("MessageValidator", {
      useValue: MockUtils.mockMessageValidator,
    });

    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(false);

    container.register<MessageValidatorManagerConfig>("MessageValidatorManagerConfig", {
      useValue: {
        maxMessageValidators: 3,
        validatorRefreshInterval: 1,
      },
    });

    container.register<MessageValidatorManager>("MessageValidatorManager", {
      useClass: MessageValidatorManagerImpl,
    });

    messageValidatorManager = container.resolve<MessageValidatorManager>(
      "MessageValidatorManager",
    );
  });

  it("validationProcess 有効なメッセージを検証すると結果を返す", async () => {
    MockUtils.mockMessageValidator.isValid.mockReturnValueOnce(true);
    const result = await messageValidatorManager.processValidation({
      origin: MockUtils.allowedOrigins[0],
      channel: MockUtils.channel,
      message: mockValidMessage,
    });
    expect(result).toBe(true);
  });

  it("validationProcess 無効なメッセージを検証するとundefinedを返す", async () => {
    MockUtils.mockMessageValidator.isValid.mockReturnValueOnce(undefined);
    const result = await messageValidatorManager.processValidation({
      origin: MockUtils.allowedOrigins[0],
      channel: MockUtils.channel,
      message: mockInValidRuntimeIdMessage,
    });
    expect(result).toBeUndefined();
  });

  it("refreshValidators 新しいValidatorを追加する", async () => {
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(true);
    await messageValidatorManager.refreshValidators();
    expect(messageValidatorManager["managedValidators"].length).toBe(1);
  });

  it("refreshValidators 最大Validator数を超えた場合、古いValidatorを削除する", async () => {
    await messageValidatorManager.refreshValidators(); // 1つ目のValidator
    await messageValidatorManager.refreshValidators(); // 2つ目のValidator
    await messageValidatorManager.refreshValidators(); // 3つ目のValidator
    await messageValidatorManager.refreshValidators(); // 4つ目のValidator
    expect(messageValidatorManager["managedValidators"].length).toBe(3);
  });

  it("getLatestValidator 新しいValidatorを返す", async () => {
    await messageValidatorManager.getLatestValidator();
    expect(messageValidatorManager["managedValidators"].length).toBe(1);
  });

  it("バックグラウンドでは、chrome.alarms.createを呼んでいる", async () => {
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(true);
    messageValidatorManager = container.resolve<MessageValidatorManager>(
      "MessageValidatorManager",
    );

    expect(chrome.alarms.create).toHaveBeenLastCalledWith(expect.anything(), {
      periodInMinutes: 1,
    });

    // アラームでrefreshValidatorsが実行されるか
    const refreshValidatorsSpy = jest.spyOn(messageValidatorManager, "refreshValidators");
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
    messageValidatorManager = container.resolve<MessageValidatorManager>(
      "MessageValidatorManager",
    );

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.anything(), 1 * 60 * 1000);

    // setIntervalでrefreshValidatorsが実行されるか
    const refreshValidatorsSpy = jest.spyOn(messageValidatorManager, "refreshValidators");
    jest.advanceTimersByTime(1 * 60 * 1000);
    expect(refreshValidatorsSpy).toHaveBeenCalled();
  });
});
