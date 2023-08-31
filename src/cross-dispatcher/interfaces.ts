/**
 * @file 型付けされた相互通信チャンネルクラスインターフェース
 */

/** 型付けされたデータと応答を持つチャンネル(継承して使用してください) */
export interface TypedChannelMap {
  [key: string]: {
    readonly data: unknown | undefined;
    readonly response: unknown | undefined;
  };
}

/** チャンネルデータの型 */
export type ChannelData<
  T extends TypedChannelMap,
  K extends keyof T,
> = T[K]["data"];

/** チャンネル応答の型 */
export type ChannelResponse<
  T extends TypedChannelMap,
  K extends keyof T,
> = T[K]["response"];

/** 型付けされたリスナー */
export type ChannelListener<T extends TypedChannelMap, K extends keyof T> = (
  data: ChannelData<T, K>,
) => ChannelResponse<T, K> | Promise<ChannelResponse<T, K>>;

/**  チャンネルリスナーを管理するオブジェクト */
export interface ChannelListenerManager<T extends TypedChannelMap> {
  /**
   * チャンネルを開通します。
   * @param listeners TypedChannelMap
   */
  channel<K extends keyof T>(listeners: {
    [Key in K]: ChannelListener<T, Key>;
  }): void;
  /**
   * リスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   * @param listenerToRemove 解除したいリスナー
   */
  removeListener<K extends keyof T>(
    channelKey: K,
    listenerToRemove: ChannelListener<T, K>,
  ): void;

  /**
   * チャンネルに紐づく全てのリスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   */
  removeAllListenersForChannel<K extends keyof T>(channelKey: K): void;

  /**
   * 全てのリスナーを登録解除します。
   */
  clearAllListeners(): void;

  /** 全てのチャンネルのリスナーを取得する */
  getAllChannelListeners(): Map<keyof T, ChannelListener<T, keyof T>[]>;
}

/**  型付けされた相互通信チャンネル */
export interface CrossDispatcher<T extends TypedChannelMap>
  extends ChannelListenerManager<T> {
  /**
   * チャンネルに送信します。
   * @param channelKey ディスパッチするチャンネルのキー
   * @param channelData ディスパッチするチャンネルのデータ
   * @returns リスナーからの応答リスト
   */
  dispatch<K extends keyof T>(
    channelKey: K,
    channelData: ChannelData<T, K>,
  ): Promise<ChannelResponse<T, K>[]>;
}
