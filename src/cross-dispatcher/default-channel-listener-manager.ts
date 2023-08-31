import {
  ChannelListener,
  ChannelListenerManager,
  TypedChannelMap,
} from "./interfaces";

/**
 * チャンネルを管理するマネージャー。
 */
export class DefaultChanneListenerManager<T extends TypedChannelMap>
  implements ChannelListenerManager<T>
{
  private readonly channelListeners: Map<
    keyof T,
    ChannelListener<T, keyof T>[]
  > = new Map();

  /**
   * ChanneListenerManager クラスのインスタンスを初期化します。
   */
  constructor() {}

  /**
   * チャンネルを開通します。
   * @param listeners TypedChannelMap
   */
  channel<K extends keyof T>(listeners: {
    [Key in K]: ChannelListener<T, Key>;
  }): void {
    for (const channelKey in listeners) {
      if (!this.channelListeners.has(channelKey)) {
        this.channelListeners.set(channelKey, []);
      }
      const listener = listeners[channelKey];
      const listenersArray = this.channelListeners.get(channelKey);
      if (listener && listenersArray) {
        listenersArray.push(listener as unknown as ChannelListener<T, keyof T>);
      }
    }
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
    const listeners = this.channelListeners.get(channelKey);
    if (!listeners) {
      return;
    }

    const index = listeners.findIndex(
      (listener) => listener === listenerToRemove,
    );
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * チャンネルに紐づく全てのリスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   */
  removeAllListenersForChannel<K extends keyof T>(channelKey: K): void {
    this.channelListeners.set(channelKey, []);
  }

  /**
   * 全てのリスナーを登録解除します
   */
  clearAllListeners(): void {
    this.channelListeners.clear();
  }

  /** 全てのチャンネルのリスナーを取得する */
  getAllChannelListeners(): Map<keyof T, ChannelListener<T, keyof T>[]> {
    return this.channelListeners;
  }
}
