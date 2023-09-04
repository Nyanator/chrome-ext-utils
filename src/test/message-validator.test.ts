import { container } from "tsyringe";
import { AESCryptoAgent, CryptoAgent } from "../crypto-agent";
import {
    MessageData,
    MessageValidator,
    MessageValidatorImpl,
} from "../message-validator";

import * as MockUtils from "./mocks/mock-utils";

describe("MessageValidatorクラス", () => {
    let cryptoAgent: CryptoAgent<MessageData>;
    let validator: MessageValidator<MessageData>;
    // 有効なメッセージのモック
    let mockValidMessage: unknown;

    MockUtils.initMockCrypto();
    MockUtils.initChromeSession();

    beforeEach(async () => {
        container.clearInstances();

        container.register("SessionStaticToken", {
            useValue: MockUtils.mockSessionStaticValue,
        });

        container.register("SessionStaticKey", {
            useValue: MockUtils.mockSessionStaticValue,
        });

        container.register("MessageValidatorConfig", {
            useValue: MockUtils.mockValidatorConfig,
        });

        container.register<CryptoAgent<MessageData>>("CryptoAgent", {
            useClass: AESCryptoAgent<MessageData>,
        });

        cryptoAgent =
            container.resolve<CryptoAgent<MessageData>>("CryptoAgent");

        container.register<MessageValidator<MessageData>>("MessageValidator", {
            useClass: MessageValidatorImpl,
        });

        validator =
            container.resolve<MessageValidator<MessageData>>(
                "MessageValidator",
            );
        mockValidMessage = MockUtils.createMockValidMessage(cryptoAgent);
    });

    it("正しいoriginとメッセージが検証を通過する", () => {
        expect(
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: mockValidMessage,
            }),
        ).toBeTruthy();
        expect(
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[1],
                message: mockValidMessage,
            }),
        ).toBeTruthy();
    });

    it("間違ったoriginが検証を通過しない", () => {
        expect(
            validator.isValid({
                origin: MockUtils.invalidOrigin,
                message: mockValidMessage,
            }),
        ).toBeUndefined();
    });

    it("間違ったトークンが検証を通過しない", () => {
        const invalidTokenMessage =
            MockUtils.createMockInvalidTokenMessage(cryptoAgent);
        expect(
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: invalidTokenMessage,
            }),
        ).toBeUndefined();
    });

    it("間違ったメッセージ構造が検証を通過しない", () => {
        expect(
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: MockUtils.invalidStructureMessage,
            }),
        ).toBeUndefined();
    });

    it("undefinedが検証を通過しない", () => {
        expect(
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: undefined,
            }),
        ).toBeUndefined();
    });

    it("間違ったruntimeIdが検証を通過しない", () => {
        const invalidRuntimeIdMessage =
            MockUtils.createMockInvalidRuntimeIdMessage(cryptoAgent);

        expect(
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: invalidRuntimeIdMessage,
            }),
        ).toBeUndefined();
    });

    it("異なる暗号化キーで作成されたデータが検証を通過しない", async () => {
        const diffrentKey = "diffrent key";
        container.register("SessionStaticKey", {
            useValue: {
                getValue: () => diffrentKey,
                generateValue: async () => diffrentKey,
            },
        });
        const differentCryptoAgent =
            container.resolve<CryptoAgent<MessageData>>("CryptoAgent");

        const diffrentKeyMessage =
            MockUtils.createMockValidMessage(differentCryptoAgent);
        expect(() => {
            validator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: diffrentKeyMessage,
            });
        }).toThrow();
    });

    it("CryptoAgentを使用しない時、正しいOriginとメッセージが検証を通過する", async () => {
        container.register("CryptoAgent", {
            useValue: undefined,
        });
        const rawValidator =
            container.resolve<MessageValidator<MessageData>>(
                "MessageValidator",
            );
        expect(
            rawValidator.isValid({
                origin: MockUtils.mockValidatorConfig.allowedOrigins[0],
                message: MockUtils.rawValidMessage,
            }),
        ).toBeTruthy();
    });
});
