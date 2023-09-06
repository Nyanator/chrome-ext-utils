import { container } from "tsyringe";

import {
    AESCryptoAgent,
    ChanneListenerMapImpl,
    ChannelMap,
    ConsoleInjectableLogger,
    CrossDispatcherImpl,
    DatabaseAgent,
    DisplayAlertErrorObserver,
    ErrorListener,
    ErrorObserver,
    IndexdDBDatabaseAgent,
    Logger,
    MessageData,
    MessageValidator,
    MessageValidatorConfig,
    MessageValidatorImpl,
    MessageValidatorManager,
    MessageValidatorManagerConfig,
    MessageValidatorManagerImpl,
    RuntimeMessageAgentImpl,
    SessionStaticKey,
    SessionStaticToken,
    WindowMessageAgentImpl,
} from "../../index";
import { initializeDIContainer } from "../../utils/di-container-utils";

describe("initializeDIContainer関数の結合テスト", () => {
    const allowedOrigins = ["origin1", "origin2"];

    beforeEach(() => {
        initializeDIContainer({
            databaseName: "dbName",
            storeName: "storeName",
            allowedOrigins: allowedOrigins,
        });
    });

    it("DIコンテナにChannelListenerMapが正しく登録されていることを確認する", () => {
        const instance =
            container.resolve<ChanneListenerMapImpl<ChannelMap>>(
                "ChannelListenerMap",
            );
        expect(instance).toBeInstanceOf(ChanneListenerMapImpl);
    });

    it("DIコンテナにCrossDispatcherがシングルトンとして正しく登録されていることを確認する", () => {
        const instance1 =
            container.resolve<CrossDispatcherImpl<ChannelMap>>(
                "CrossDispatcher",
            );
        const instance2 =
            container.resolve<CrossDispatcherImpl<ChannelMap>>(
                "CrossDispatcher",
            );
        expect(instance1).toBeInstanceOf(CrossDispatcherImpl);
        expect(instance2).toBeInstanceOf(CrossDispatcherImpl);
        expect(instance1).toBe(instance2);
    });

    it("DIコンテナにCryptoAgentが正しく登録されていることを確認する", () => {
        const instance =
            container.resolve<AESCryptoAgent<MessageData>>("CryptoAgent");
        expect(instance).toBeInstanceOf(AESCryptoAgent);
    });

    it("DIコンテナにDatabaseAgentが正しく登録されていることを確認する", () => {
        const instance = container.resolve<DatabaseAgent>("DatabaseAgent");
        expect(instance).toBeInstanceOf(IndexdDBDatabaseAgent);
    });

    it("DIコンテナにErrorListenerが正しく登録されていることを確認する", () => {
        const instance = container.resolve<ErrorListener>("ErrorListener");
        expect(instance).toBeInstanceOf(ErrorListener);
    });

    it("DIコンテナにErrorObserverが正しく登録されていることを確認する", () => {
        const instance = container.resolve<ErrorObserver>("ErrorObserver");
        expect(instance).toBeInstanceOf(DisplayAlertErrorObserver);
    });

    it("DIコンテナにLoggerが正しく登録されていることを確認する", () => {
        const instance = container.resolve<Logger>("Logger");
        expect(instance).toBeInstanceOf(ConsoleInjectableLogger);
    });

    it("DIコンテナにMessageValidatorManagerConfigが正しく登録されていることを確認する", () => {
        const config = container.resolve<MessageValidatorManagerConfig>(
            "MessageValidatorManagerConfig",
        );
        expect(config.maxMessageValidators).toBe(3);
        expect(config.validatorRefreshInterval).toEqual(1);
    });

    it("DIコンテナにMessageValidatorConfigが正しく登録されていることを確認する", () => {
        const config = container.resolve<MessageValidatorConfig>(
            "MessageValidatorConfig",
        );
        expect(config.runtimeId).toBe(chrome.runtime.id);
        expect(config.allowedOrigins).toEqual(allowedOrigins);
    });

    it("DIコンテナにMessageValidatorManagerがシングルトンとして正しく登録されていることを確認する", () => {
        const instance1 = container.resolve<
            MessageValidatorManager<MessageData>
        >("MessageValidatorManager");
        const instance2 = container.resolve<
            MessageValidatorManager<MessageData>
        >("MessageValidatorManager");
        expect(instance1).toBeInstanceOf(MessageValidatorManagerImpl);
        expect(instance2).toBeInstanceOf(MessageValidatorManagerImpl);
        expect(instance1).toBe(instance2);
    });

    it("DIコンテナにMessageValidatorが正しく登録されていることを確認する", () => {
        const instance =
            container.resolve<MessageValidator<MessageData>>(
                "MessageValidator",
            );
        expect(instance).toBeInstanceOf(MessageValidatorImpl);
    });

    it("DIコンテナにRuntimeMessageAgentが正しく登録されていることを確認する", () => {
        const instance = container.resolve<
            RuntimeMessageAgentImpl<MessageData>
        >("RuntimeMessageAgent");
        expect(instance).toBeInstanceOf(RuntimeMessageAgentImpl);
    });

    it("DIコンテナにSessionStaticTokenが正しく登録されていることを確認する", () => {
        const instance =
            container.resolve<SessionStaticToken>("SessionStaticToken");
        expect(instance).toBeInstanceOf(SessionStaticToken);
    });

    it("DIコンテナにSessionStaticKeyが正しく登録されていることを確認する", () => {
        const instance =
            container.resolve<SessionStaticKey>("SessionStaticKey");
        expect(instance).toBeInstanceOf(SessionStaticKey);
    });

    it("DIコンテナにWindowMessageAgentが正しく登録されていることを確認する", () => {
        const instance =
            container.resolve<WindowMessageAgentImpl<MessageData>>(
                "WindowMessageAgent",
            );
        expect(instance).toBeInstanceOf(WindowMessageAgentImpl);
    });
});
