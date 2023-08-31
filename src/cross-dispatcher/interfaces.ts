/**
 * @file 型付けされた相互通信チャンネルクラスインターフェース
 */

/** 型付けされたデータと応答を持つチャンネル(継承して使用してください) */
export interface ChannelMap {
  [key: string]: {
    readonly data: unknown | undefined;
    readonly response: unknown | undefined;
  };
}

/** チャンネルデータの型 */
export type ChannelData<T extends ChannelMap, K extends keyof T> = T[K]["data"];

/** チャンネル応答の型 */
export type ChannelResponse<
  T extends ChannelMap,
  K extends keyof T,
> = T[K]["response"];

/** 型付けされたリスナー */
export type ChannelListener<T extends ChannelMap, K extends keyof T> = (
  data: ChannelData<T, K>,
) => ChannelResponse<T, K> | Promise<ChannelResponse<T, K>>;

/**  チャンネルリスナーのマップ */
export interface ChannelListenerMap<T extends ChannelMap> {
  /**
   * チャンネルを開通します。
   * @param channelMap ChannelMap
   */
  channel<K extends keyof T>(channelMap: {
    [Key in K]: ChannelListener<T, Key>;
  }): void;
  /**
   * リスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   * @param removeTarget 解除したいリスナー
   */
  remove<K extends keyof T>(
    channelKey: K,
    removeTarget: ChannelListener<T, K>,
  ): void;

  /**
   * チャンネルに紐づく全てのリスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   */
  removeForChannel<K extends keyof T>(channelKey: K): void;

  /**
   * 全てのリスナーを登録解除します。
   */
  clear(): void;

  /** 全てのリスナーを取得する */
  getListeners(): Map<keyof T, ChannelListener<T, keyof T>[]>;
}

/**  型付けされた相互通信チャンネル */
export interface CrossDispatcher<T extends ChannelMap>
  extends ChannelListenerMap<T> {
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
