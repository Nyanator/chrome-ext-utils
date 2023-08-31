import { createLogger } from "../logger/factories";

import { createChannelListenerMap } from "./factories";
import {
  ChannelData,
  ChannelListener,
  ChannelMap,
  ChannelResponse,
  CrossDispatcher,
} from "./interfaces";

/**
 * 型付けされた相互通信チャンネルクラス。
 */
export class CrossDispatcherImpl<T extends ChannelMap>
  implements CrossDispatcher<T>
{
  private readonly channelListenerMap = createChannelListenerMap<T>();
  private readonly dispatchingChannel: Set<keyof T> = new Set();

  /**
   * CrossDispatcherImpl クラスのインスタンスを初期化します。
   * @param strictMode 例外安全にしたければfalse、それ以外は例外を送出します
   */
  constructor(private readonly strictMode: boolean = false) {}

  /**
   * チャンネルを開通します。
   * @param channelMap ChannelMap
   */
  channel<K extends keyof T>(channelMap: {
    [Key in K]: ChannelListener<T, Key>;
  }): void {
    this.channelListenerMap.channel(channelMap);
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
    const listeners = this.channelListenerMap.getListeners().get(channelKey);

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
      this.handleError(
        `Error handling channel: ${channelKey.toString()}: ${error}`,
      );
    } finally {
      this.dispatchingChannel.delete(channelKey); // チャンネル呼び出し終了
    }

    return responses;
  }

  /**
   * リスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   * @param targetListener 解除したいリスナー
   */
  remove<K extends keyof T>(
    channelKey: K,
    targetListener: ChannelListener<T, keyof T>,
  ): void {
    this.channelListenerMap.remove(channelKey, targetListener);
  }

  /**
   * チャンネルに紐づく全てのリスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   */
  removeForChannel<K extends keyof T>(channelKey: K): void {
    this.channelListenerMap.removeForChannel(channelKey);
  }

  /**
   * 全てのリスナーを登録解除します
   */
  clear(): void {
    this.channelListenerMap.clear();
  }

  /** 全てのチャンネルのリスナーを取得する */
  getListeners(): Map<keyof T, ChannelListener<T, keyof T>[]> {
    return this.channelListenerMap.getListeners();
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
