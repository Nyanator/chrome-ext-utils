import { ChannelListener, ChannelListenerMap, ChannelMap } from "./interfaces";

/**
 * チャンネルを管理するマップ
 */
export class ChanneListenerMapImpl<T extends ChannelMap>
  implements ChannelListenerMap<T>
{
  private readonly listeners: Map<keyof T, ChannelListener<T, keyof T>[]> =
    new Map();

  /**
   * チャンネルを開通します。
   * @param channelMap チャンネルのマップ
   */
  channel<K extends keyof T>(channelMap: {
    [Key in K]: ChannelListener<T, Key>;
  }): void {
    for (const channelKey in channelMap) {
      if (!this.listeners.has(channelKey)) {
        this.listeners.set(channelKey, []);
      }
      const listener = channelMap[channelKey];
      const listenersArray = this.listeners.get(channelKey);
      if (listener && listenersArray) {
        listenersArray.push(listener as unknown as ChannelListener<T, keyof T>);
      }
    }
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
    const listeners = this.listeners.get(channelKey);
    if (!listeners) {
      return;
    }

    const index = listeners.findIndex(
      (listener) => listener === targetListener,
    );
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * チャンネルに紐づく全てのリスナーを登録解除します。
   * @param channelKey 解除するチャンネルのキー
   */
  removeForChannel<K extends keyof T>(channelKey: K): void {
    this.listeners.set(channelKey, []);
  }

  /**
   * 全てのリスナーを登録解除します
   */
  clear(): void {
    this.listeners.clear();
  }

  /** 全てのチャンネルのリスナーを取得する */
  getListeners(): Map<keyof T, ChannelListener<T, keyof T>[]> {
    return this.listeners;
  }
}
