/**
 * MessageValidatorを管理し、トークンを自動で更新します。
 */
import "reflect-metadata";
import { container, inject, injectable } from "tsyringe";

import { Logger } from "./logger";
import { MessageData, MessageValidator, SendObject } from "./message-validator";
import { isBackground } from "./utils/chrome-ext-utils";

export interface MessageValidatorManager<T extends MessageData> {
    /** メッセージが正当か検証します。*/
    processValidation(validationTarget: SendObject): Promise<T | undefined>;

    /** 管理下のValidatorを更新します。*/
    refreshValidators(): Promise<void>;

    /** 最新のValidatorを返します。*/
    getLatestValidator(): Promise<MessageValidator<T>>;
}

/** 構築設定 */
export type MessageValidatorManagerConfig = Readonly<{
    /** Validatorオブジェクトの最大保持数 */
    maxMessageValidators: number;
    /** Validatorオブジェクトの更新間隔(分) */
    validatorRefreshInterval: number;
}>;

@injectable()
export class MessageValidatorManagerImpl<T extends MessageData>
    implements MessageValidatorManager<T>
{
    private readonly managedValidators: MessageValidator<T>[] = [];

    constructor(
        @inject("MessageValidatorManagerConfig")
        private readonly config: MessageValidatorManagerConfig,
        @inject("Logger") private readonly logger: Logger,
    ) {
        if (isBackground()) {
            chrome.alarms.create("refreshSession", {
                periodInMinutes: this.config.validatorRefreshInterval,
            });
            chrome.alarms.onAlarm.addListener(() => {
                this.refreshValidators();
            });
        } else {
            setInterval(
                async () => {
                    this.refreshValidators();
                },
                this.config.validatorRefreshInterval * 60 * 1000,
            );
        }
    }

    async processValidation(
        validationTarget: SendObject,
    ): Promise<T | undefined> {
        // 非同期通信ではトークンの更新タイミングと送信が重なるとエラーとなってしまう
        // valiatorオブジェクトのリストを用意して確認することで通信の安定性を実現している

        // 管理下にあるValidatorで検証が通る場合はOK
        const managedValidatorsResult =
            this.managedValidatorsValidation(validationTarget);
        if (managedValidatorsResult) {
            return managedValidatorsResult;
        }

        // 検証が通らなかったので、セッションから新しいValidatorを生成
        const newValidator = await this.createNewValidator();
        this.pushValidator(newValidator);

        // 最終的な検証結果は新規作成したValidatorで決定する
        const newValidatorResult = newValidator.isValid(validationTarget);
        return newValidatorResult;
    }

    async refreshValidators(): Promise<void> {
        // セッションから新しいValidatorを生成
        const newValidator = await this.createNewValidator();

        if (isBackground()) {
            const tokenProvider = newValidator.getProvider();
            const keyProvider = newValidator.getCryptoAgent()?.getProvider();

            // 新しいValidatorのトークンとキーを再作成する
            await tokenProvider.generateValue(true);
            await keyProvider?.generateValue(true);
        }
        this.pushValidator(newValidator);
    }

    async getLatestValidator(): Promise<MessageValidator<T>> {
        if (this.managedValidators.length === 0) {
            const firstValidator = await this.createNewValidator();
            this.pushValidator(firstValidator);
        }
        return this.managedValidators.slice(-1)[0];
    }

    private managedValidatorsValidation(
        validationTarget: SendObject,
    ): T | undefined {
        // Validatorリストを逆順にして、最新のValidatorから検証を試みます
        for (const validator of [...this.managedValidators].reverse()) {
            const validationResult = validator.isValid(validationTarget);
            if (validationResult) {
                return validationResult;
            }
        }
    }

    private pushValidator(newValidator: MessageValidator<T>) {
        this.managedValidators.push(newValidator);
        if (this.managedValidators.length > this.config.maxMessageValidators) {
            this.managedValidators.shift();
        }
    }

    private async createNewValidator(): Promise<MessageValidator<T>> {
        const newValidator =
            container.resolve<MessageValidator<T>>("MessageValidator");

        const tokenProvider = newValidator.getProvider();
        const keyProvider = newValidator.getCryptoAgent()?.getProvider();
        await tokenProvider.generateValue(false);
        await keyProvider?.generateValue(false);

        return newValidator;
    }
}
