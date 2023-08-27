import { MessageValidator, MessageValidatorManager } from "./interfaces";
/**
 * MessageValidatorを管理し、トークンを更新します。
 */
export declare class DefaultMessageValidatorManager<T> implements MessageValidatorManager<T> {
    private readonly createMessageValidator;
    private readonly maxMessageValidators;
    getValidators(): MessageValidator<T>[];
    private readonly managedValidators;
    /**
     * DefaultMessageValidatorManager クラスのインスタンスを初期化します。
     * @param initialMessageValidator メッセージの正当性検証に使用するMessageValidatorの初期値
     * @param createMessageValidator MessageValidatorの生成関数
     * @param maxMessageValidators MessageValidatorの最大保持数
     */
    constructor(initialMessageValidator: MessageValidator<T>, createMessageValidator: () => Promise<MessageValidator<T>>, maxMessageValidators: number);
    /**
     * 送信内容の検証をします。
     * @param origin 送信元オリジン
     * @param message 検証対象のmessage
     * @returns 検証に成功した場合Tのインスタンス、それ以外undefined
     */
    processValidation(origin: string, message: unknown): Promise<T | undefined>;
    /**
     * 管理下のValidatorを更新します。
     */
    refreshValidator(): Promise<void>;
    /**
     * 現在管理下のValidatorで検証をします。
     */
    private managedValidatorsValidation;
    /**
     * Validatorを管理下にいれます。
     */
    private pushValidator;
}
