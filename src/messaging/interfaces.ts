/**
 * @file コンテキスト間メッセージパッシングクラスインターフェース
 */

import { CryptoAgent } from "encryption/interfaces";
import { SessionStaticValueProvider } from "session/interfaces";

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ランタイム) */
export interface RuntimeMessageAgent<T extends MessageData> {
  /**
   * 暗号化されたランタイムメッセージを送信します。
   * @param message 送信するメッセージデータ
   * @param tabId 送信先タブの ID
   */
  sendRuntimeMessage(message: T, tabId?: number): Promise<unknown>;

  /**
   * ランタイムメッセージを受信し、復号化してリスナー関数に渡します。
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  runtimeMessageListener(listener: (messageData: T) => Promise<unknown>): void;

  /**
   * ランタイムメッセージの購読を解除します。
   */
  removeRuntimeMessageListener(): void;
}

/** メッセージの暗号化と復号化を管理し、各コンテキスト間での送受信をサポート(ウィンドウ) */
export interface WindowMessageAgent<T extends MessageData> {
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
   * ウィンドウメッセージを受信し、復号化してリスナー関数に渡します。
   * @param listener メッセージ受信時に呼び出されるリスナー関数
   */
  windowMessageListener(listener: (event: T) => void): void;

  /**
   * Windowメッセージの購読を解除します。
   */
  removeWindowMessageListener(): void;
}

/** メッセージオブジェクト */
export interface MessageData {
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
export interface MessageValidatorManager<T extends MessageData> {
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
  refreshValidators(): Promise<void>;

  /**
   * 管理下のValidatorのリストを返します。
   */
  getValidators(): MessageValidator<T>[];
}

/** メッセージの正当性を検証 */
export interface MessageValidator<T extends MessageData> {
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
