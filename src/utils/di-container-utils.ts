import { container } from "tsyringe";
import { ChanneListenerMapImpl } from "../channel-listener-map";
import { CrossDispatcherImpl } from "../cross-dispathcher";
import { AESCryptoAgent } from "../crypto-agent";
import { DatabaseAgent, IndexdDBDatabaseAgent } from "../database-agent";
import { ConsoleLogger } from "../logger";
import {
    MessageValidatorManagerConfig,
    MessageValidatorManagerImpl,
} from "../message-validatior-manager";
import {
    MessageValidatorConfig,
    MessageValidatorImpl,
} from "../message-validator";
import { RuntimeMessageAgentImpl } from "../runtime-message-agent";
import { SessionStaticKey, SessionStaticToken } from "../session-static-value";
import { WindowMessageAgentImpl } from "../window-message-agent";

/**
 * DIコンテナを初期化します。
 */
export const initializeDIContainer = (allowedOrigins: string[]): void => {
    container.clearInstances();

    container.register("ChannelListenerMap", {
        useClass: ChanneListenerMapImpl,
    });

    container.registerSingleton("CrossDispatcher", CrossDispatcherImpl);

    container.register("CryptoAgent", {
        useClass: AESCryptoAgent,
    });

    container.register<DatabaseAgent>("DatabaseAgent", {
        useClass: IndexdDBDatabaseAgent,
    });

    container.register("Logger", {
        useClass: ConsoleLogger,
    });

    container.register<MessageValidatorManagerConfig>(
        "MessageValidatorManagerConfig",
        {
            useValue: {
                maxMessageValidators: 3,
                validatorRefreshInterval: 1,
            },
        },
    );

    container.registerSingleton(
        "MessageValidatorManager",
        MessageValidatorManagerImpl,
    );

    container.register<MessageValidatorConfig>("MessageValidatorConfig", {
        useValue: {
            runtimeId: chrome.runtime.id,
            allowedOrigins: allowedOrigins,
        },
    });

    container.register("MessageValidator", {
        useClass: MessageValidatorImpl,
    });

    container.register("RuntimeMessageAgent", {
        useClass: RuntimeMessageAgentImpl,
    });

    container.register("SessionStaticToken", {
        useClass: SessionStaticToken,
    });

    container.register("SessionStaticKey", {
        useClass: SessionStaticKey,
    });

    container.register("WindowMessageAgent", {
        useClass: WindowMessageAgentImpl,
    });
};