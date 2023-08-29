import {
  AESCryptoAgent,
  CryptoAgent,
  DefaultMessageValidator,
  MessageData,
  MessageValidator,
} from "../../";
import * as MockUtils from "../mocks/mock-utils";

describe("MessageValidatorクラス", () => {
  let cryptoAgent: CryptoAgent<MessageData>;
  let validator: MessageValidator<MessageData>;
  // 有効なメッセージのモック
  let mockValidMessage: unknown;

  beforeEach(() => {
    cryptoAgent = new AESCryptoAgent<MessageData>(
      MockUtils.mockSessionStaticValueProvider,
    );

    validator = new DefaultMessageValidator(
      MockUtils.mockValidatorConfig,
      MockUtils.mockSessionStaticValueProvider,
      cryptoAgent,
    );

    mockValidMessage = MockUtils.createMockValidMessage(cryptoAgent);
  });

  it("正しいoriginとメッセージが検証を通過する", () => {
    expect(
      validator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[0],
        mockValidMessage,
      ),
    ).toBeTruthy();
    expect(
      validator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[1],
        mockValidMessage,
      ),
    ).toBeTruthy();
  });

  it("間違ったoriginが検証を通過しない", () => {
    expect(
      validator.isValid(MockUtils.invalidOrigin, mockValidMessage),
    ).toBeUndefined();
  });

  it("間違ったトークンが検証を通過しない", () => {
    const invalidTokenMessage =
      MockUtils.createMockInvalidTokenMessage(cryptoAgent);
    expect(
      validator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[0],
        invalidTokenMessage,
      ),
    ).toBeUndefined();
  });

  it("間違ったメッセージ構造が検証を通過しない", () => {
    expect(
      validator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[0],
        MockUtils.invalidStructureMessage,
      ),
    ).toBeUndefined();
  });

  it("間違ったruntimeIdが検証を通過しない", () => {
    const invalidRuntimeIdMessage =
      MockUtils.createMockInvalidRuntimeIdMessage(cryptoAgent);

    expect(
      validator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[0],
        invalidRuntimeIdMessage,
      ),
    ).toBeUndefined();
  });

  it("異なる暗号化キーで作成されたデータが検証を通過しない", () => {
    const diffrentKey = "diffrent key";
    const differentCryptoAgent = new AESCryptoAgent<MessageData>({
      getValue: () => diffrentKey,
      generateValue: async () => diffrentKey,
    });
    const diffrentKeyMessage =
      MockUtils.createMockValidMessage(differentCryptoAgent);

    expect(() => {
      validator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[0],
        diffrentKeyMessage,
      );
    }).toThrow();
  });

  it("CryptoAgentを使用しない時、正しいOriginとメッセージが検証を通過する", () => {
    const rawValidator = new DefaultMessageValidator(
      MockUtils.mockValidatorConfig,
      MockUtils.mockSessionStaticValueProvider,
      undefined,
    );
    expect(
      rawValidator.isValid(
        MockUtils.mockValidatorConfig.allowedOrigins[0],
        MockUtils.rawValidMessage,
      ),
    ).toBeTruthy();
  });
});
