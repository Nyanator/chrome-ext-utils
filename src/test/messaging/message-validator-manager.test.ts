import { chrome } from "jest-chrome";

import {
  AESCryptoAgent,
  CryptoAgent,
  MessageDataObject,
  MessageValidatorManager,
  createMessageValidatorManager,
} from "../../";
import * as MessageingFactories from "../../messaging/factories";
import * as ChromeExtensionUtils from "../../utils/chrome-ext-utils";
import * as MockUtils from "../mocks/mock-utils";

describe("DefaultMessageValidatorManagerクラスのテスト", () => {
  let cryptoAgent: CryptoAgent<MessageDataObject>;
  let messageValidatorManager: MessageValidatorManager<MessageDataObject>;

  // 有効なメッセージのモック
  let mockValidMessage: unknown;
  // 無効なメッセージのモック
  let mockInValidRuntimeIdMessage: unknown;

  beforeEach(async () => {
    cryptoAgent = new AESCryptoAgent<MessageDataObject>(
      MockUtils.mockSessionStaticValueProvider
    );
    mockValidMessage = MockUtils.createMockValidMessage(cryptoAgent);
    mockInValidRuntimeIdMessage =
      MockUtils.createMockInvalidRuntimeIdMessage(cryptoAgent);

    MockUtils.mockAllSessionValues();
    jest
      .spyOn(MessageingFactories, "createMessageValidator")
      .mockResolvedValue(MockUtils.mockMessageValidator);

    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(false);
    messageValidatorManager = await createMessageValidatorManager(
      MockUtils.mockValidatorConfig,
      3,
      1
    );
  });

  it("validationProcess 有効なメッセージを検証すると結果を返す", async () => {
    MockUtils.mockMessageValidator.isValid.mockReturnValueOnce(true);
    const result = await messageValidatorManager.processValidation(
      MockUtils.allowedOrigins[0],
      mockValidMessage
    );
    expect(result).toBe(true);
  });

  it("validationProcess 無効なメッセージを検証するとundefinedを返す", async () => {
    MockUtils.mockMessageValidator.isValid.mockReturnValueOnce(false);
    const result = await messageValidatorManager.processValidation(
      MockUtils.allowedOrigins[0],
      mockInValidRuntimeIdMessage
    );
    expect(result).toBeUndefined();
  });

  it("refreshValidator 新しいValidatorを追加する", async () => {
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(true);
    await messageValidatorManager.refreshValidator();
    expect(messageValidatorManager.getValidators().length).toBe(2);
  });

  it("refreshValidator 最大Validator数を超えた場合、古いValidatorを削除する", async () => {
    await messageValidatorManager.refreshValidator(); // 2つ目のValidator
    await messageValidatorManager.refreshValidator(); // 3つ目のValidator
    await messageValidatorManager.refreshValidator(); // 4つ目のValidator
    expect(messageValidatorManager.getValidators().length).toBe(3);
  });

  it("バックグラウンドでは、chrome.alarms.createを呼んでいる", async () => {
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(true);
    messageValidatorManager = await createMessageValidatorManager(
      MockUtils.mockValidatorConfig,
      3,
      1
    );
    expect(chrome.alarms.create).toHaveBeenLastCalledWith(expect.anything(), {
      periodInMinutes: 1,
    });

    // アラームでrefreshValidatorが実行されるか
    const refreshValidatorSpy = jest.spyOn(
      messageValidatorManager,
      "refreshValidator"
    );
    chrome.alarms.onAlarm.callListeners({
      scheduledTime: 0,
      name: "",
    });
    expect(refreshValidatorSpy).toHaveBeenCalled();
  });

  it("バックグラウンド以外では、setIntervalを呼んでいる", async () => {
    jest.useFakeTimers();

    const setIntervalSpy = jest.spyOn(global, "setInterval");
    jest.spyOn(ChromeExtensionUtils, "isBackground").mockReturnValueOnce(false);
    messageValidatorManager = await createMessageValidatorManager(
      MockUtils.mockValidatorConfig,
      3,
      1
    );
    expect(setIntervalSpy).toHaveBeenCalledWith(
      expect.anything(),
      1 * 60 * 1000
    );

    // setIntervalでrefreshValidatorが実行されるか
    const refreshValidatorSpy = jest.spyOn(
      messageValidatorManager,
      "refreshValidator"
    );
    jest.advanceTimersByTime(1 * 60 * 1000);
    expect(refreshValidatorSpy).toHaveBeenCalled();
  });
});
