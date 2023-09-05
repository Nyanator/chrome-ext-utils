/**
 * MessageValidatorを管理し、トークンを自動で更新
 */

import { Logger } from "logger";
import "reflect-metadata";
import { container, inject, injectable } from "tsyringe";
import { MessageData, MessageValidator } from "./message-validator";
import { isBackground } from "./utils/chrome-ext-utils";
import { injectOptional } from "./utils/inject-optional";

export interface MessageValidatorManager<T extends MessageData> {
    /**
     * 送信内容の検証をします。
     * @param origin 送信元オリジン
     * @param message 検証対象のmessage
     * @returns 検証に成功した場合Tのインスタンス、それ以外undefined
     */
    processValidation(arg: {
        origin: string;
        message: unknown;
    }): Promise<T | undefined>;

    /**
     * 管理下のValidatorを更新します。
     */
    refreshValidators(): Promise<void>;

    /**
     * 最新のValidatorを返します。
     */
    getLatestValidator(): Promise<MessageValidator<T>>;
}

/** 構築設定 */
export interface MessageValidatorManagerConfig {
    maxMessageValidators: number; // Validatorオブジェクトの最大保持数
    validatorRefreshInterval: number; // Validatorオブジェクトの更新間隔(分)
}

@injectable()
export class MessageValidatorManagerImpl<T extends MessageData>
    implements MessageValidatorManager<T>
{
    private readonly managedValidators: MessageValidator<T>[] = [];

    constructor(
        @inject("MessageValidatorManagerConfig")
        private readonly config: MessageValidatorManagerConfig,
        @injectOptional("Logger") private readonly logger?: Logger,
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

    async processValidation(arg: {
        origin: string;
        message: unknown;
    }): Promise<T | undefined> {
        // 非同期通信ではトークンの更新タイミングと送信が重なるとエラーとなってしまう
        // valiatorオブジェクトのリストを用意して確認することで通信の安定性を実現している

        // 管理下にあるValidatorで検証が通る場合はOK
        const managedValidatorsResult = this.managedValidatorsValidation({
            origin: arg.origin,
            message: arg.message,
        });
        if (managedValidatorsResult) {
            return managedValidatorsResult;
        }

        // 検証が通らなかったので、セッションから新しいValidatorを生成
        const newValidator = await this.createNewValidator();
        this.pushValidator(newValidator);

        // 最終的な検証結果は新規作成したValidatorで決定する
        const newValidatorResult = newValidator.isValid({
            origin: arg.origin,
            message: arg.message,
        });
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

    private managedValidatorsValidation(arg: {
        origin: string;
        message: unknown;
    }): T | undefined {
        // Validatorリストを逆順にして、最新のValidatorから検証を試みます
        for (const validator of [...this.managedValidators].reverse()) {
            const validationResult = validator.isValid({
                origin: arg.origin,
                message: arg.message,
            });
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
