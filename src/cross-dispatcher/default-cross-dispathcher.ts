import { createLogger } from "../logger/factories";

import { createChannelListenerManager } from "./factories";
import {
  ChannelData,
  ChannelListener,
  ChannelResponse,
  CrossDispatcher,
  TypedChannelMap,
} from "./interfaces";

/**
 * 型付けされた相互通信チャンネルクラス。
 */
export class DefaultCrossDispatcher<T extends TypedChannelMap>
  implements CrossDispatcher<T>
{
  private readonly channelListenerManager = createChannelListenerManager<T>();
  private readonly dispatchingChannel: Set<keyof T> = new Set();

  /**
   * DefaultCrossDispatcher クラスのインスタンスを初期化します。
   * @param strictMode 例外安全にしたければfalse、それ以外は例外を送出します
   */
  constructor(private readonly strictMode: boolean = false) {}

  /**
   * チャンネルを開通します。
   * @param listeners TypedChannelMap
   */
  channel<K extends keyof T>(listeners: {
    [Key in K]: ChannelListener<T, Key>;
  }): void {
    this.channelListenerManager.channel(listeners);
  }

  /**
   * チャンネルに送信します。
   * @param channelKey ディスパッチするチャンネルのキー
   * @param channelData ディスパッチするデータ
   * @returns リスナーからの応答リスト
   */
  async dispatch<K extends keyof T>(
    channelKey: K,
    channelData: ChannelData<T, K>,
  ): Promise<ChannelResponse<T, K>[]> {
    const listeners = this.channelListenerManager
      .getAllChannelListeners()
      .get(channelKey);

    // 疎結合にするためのディスパッチなのでリスナーがいない場合は空を返す
    if (!listeners) {
      this.handleError(
        `No listeners registered for channel: ${channelKey.toString()}`,
      );
      return [];
    }

    const responses: ChannelResponse<T, K>[] = [];
    if (this.dispatchingChannel.has(channelKey)) {
      this.handleError(
        `recursively called. Stop to prevent stack overflow. for channel: ${channelKey.toString()}`,
      );
      return []; // すでに同じチャンネルが呼び出し中なので何もしない
    }
    this.dispatchingChannel.add(channelKey); // チャンネルを呼び出し中としてマーク

    // 本来例外を握りつぶすべきではないが、
    // この場合疎結合性を担保するべきであり、例外処理をしないリスナーに責務がある
    try {
      for (const listener of listeners) {
        const response = listener(channelData);
        if (response instanceof Promise) {
          const result = await response;
          responses.push(result);
        } else {
          responses.push(response);
        }
      }
    } catch (error) {
      // 何故かリスナーがError以外をスローしたときプログラム上のミスである可能性が高いため報告する
      if (!(error instanceof Error)) {
        throw new Error(
          `Attempting to throw an invalid exception channel: ${channelKey.toString()}`,
        );
      }
      this.handleError(
        `Error handling channel: ${channelKey.toString()}: ${
          error.message + error.stack
        }`,
      );
    } finally {
      this.dispatchingChannel.delete(channelKey); // チャンネル呼び出し終了
    }

    return responses;
  }

  /**
   * リスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   * @param listenerToRemove 解除したいリスナー
   */
  removeListener<K extends keyof T>(
    channelKey: K,
    listenerToRemove: ChannelListener<T, keyof T>,
  ): void {
    this.channelListenerManager.removeListener(channelKey, listenerToRemove);
  }

  /**
   * チャンネルに紐づく全てのリスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   */
  removeAllListenersForChannel<K extends keyof T>(channelKey: K): void {
    this.channelListenerManager.removeAllListenersForChannel(channelKey);
  }

  /**
   * 全てのリスナーを登録解除します
   */
  clearAllListeners(): void {
    this.channelListenerManager.clearAllListeners();
  }

  /** 全てのチャンネルのリスナーを取得する */
  getAllChannelListeners(): Map<keyof T, ChannelListener<T, keyof T>[]> {
    return this.channelListenerManager.getAllChannelListeners();
  }

  /**
   * エラー処理
   */
  private handleError(errorMessage: string) {
    if (this.strictMode) {
      throw new Error(errorMessage);
    }

    const logger = createLogger();
    logger.error(errorMessage);
  }
}
