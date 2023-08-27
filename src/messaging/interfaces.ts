/** 暗号化、複合化 */
export interface CryptoAgent<T extends MessageDataObject> {
  /**
   * 暗号化に使う鍵を提供するオブジェクトを返します。
   */
  getProvider(): SessionStaticValueProvider;

  /**
   * メッセージデータを暗号化します。
   * @param messageData 暗号化するメッセージデータ
   */
  encrypt(messageData: T): string;

  /**
   * 暗号化されたデータを複合化します。
   * @param encryptedMessageData 暗号化されたデータの文字列
   */
  decrypt(encryptedMessageData: string): T;
}

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート */
export interface MessageAgent<T extends MessageDataObject> {
  /**
   * 暗号化されたメッセージを windowに送信します。
   * @param target 送信先の window
   * @param targetOrigin 送信先のオリジン
   * @param message 送信するメッセージデータ
   */
  postWindowMessage(
    target: Window,
    targetOrigin: string,
    message: T,
  ): Promise<void>;

  /**
   * 暗号化されたランタイムメッセージを送信します。
   * @param message 送信するメッセージデータ
   * @param tabId 送信先タブの ID
   */
  sendRuntimeMessage(message: T, tabId: number | undefined): Promise<unknown>;

  /**
   * ウィンドウメッセージを受信し、復号化してハンドラー関数に渡します。
   * @param handler メッセージ受信時に呼び出されるハンドラー関数
   */
  windowMessageListener(handler: (event: T) => void): void;

  /**
   * ランタイムメッセージを受信し、復号化してハンドラー関数に渡します。
   * @param handler メッセージ受信時に呼び出されるハンドラー関数
   */
  runtimeMessageListener(handler: (messageData: T) => Promise<unknown>): void;

  /**
   * Windowメッセージの購読を解除します。
   */
  removeWindowMessageListener(): void;

  /**
   * ランタイムメッセージの購読を解除します。
   */
  removeRuntimeMessageListener(): void;
}

/** メッセージオブジェクト */
export interface MessageDataObject {
  /**
   * 拡張機能のID。
   */
  readonly runtimeId: string;

  /**
   * メッセージ本文。
   */
  readonly message: string;
}

/** MessageValidatorを管理し、トークンを自動で更新 */
export interface MessageValidatorManager<T extends MessageDataObject> {
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
   * 管理下のValidatorのリストを返します。
   */
  getValidators(): MessageValidator<T>[];
}

/** メッセージの正当性を検証 */
export interface MessageValidator<T extends MessageDataObject> {
  /** 検証設定オブジェクトを返します。 */
  getConfig(): ValidatorConfig;

  /** トークンを供給するオブジェクトを返します。 */
  getProvider(): SessionStaticValueProvider;

  /** 暗号化に使うCrypotAgentオブジェクトを返します。 */
  getCryptoAgent(): CryptoAgent<T> | undefined;

  /**
   * メッセージが正当か検証します。
   * @param origin メッセージの送信元オリジン
   * @param message 検証するメッセージ
   * @returns メッセージデータ
   */
  isValid(origin: string, message: unknown): T | undefined;
}

/** セッションで静的な値 */
export interface SessionStaticValueProvider {
  /**
   * 保持している値を返します。
   */
  getValue(): string;

  /**
   * セッションで静的な値を生成します。すでに生成されている場合は同じ値が返ります。
   * @param regenerate すでに生成されている場合でも強制的に再生成する
   */
  generateValue(regenerate: boolean): Promise<string>;
}

/** メッセージの正当性の検証設定 */
export interface ValidatorConfig {
  /**
   * 拡張機能のID。
   */
  readonly runtimeId: string;

  /**
   * 許可するオリジンの一覧。
   */
  readonly allowedOrigins: string[];
}
