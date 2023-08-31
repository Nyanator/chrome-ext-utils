/**
 * @file 型付けされた相互通信チャンネルクラスファクトリ関数
 */

import { DefaultChanneListenerManager } from "./default-channel-listener-manager";
import { DefaultCrossDispatcher } from "./default-cross-dispathcher";
import {
  ChannelListenerManager,
  CrossDispatcher,
  TypedChannelMap,
} from "./interfaces";

/**
 * 型付けされた相互通信チャンネルディスパッチサポートクラス CrossDispatcherを返します。
 * @param strictMode 例外安全にしたければfalse、それ以外は例外を送出します
 */
export const createCrossDispatcher = <T extends TypedChannelMap>(
  strictMode: boolean = false,
): CrossDispatcher<T> => {
  return new DefaultCrossDispatcher(strictMode);
};

/**
 * チャンネルリスナーを管理するクラス ChannelListenerManagerを返します。
 */
export const createChannelListenerManager = <
  T extends TypedChannelMap,
>(): ChannelListenerManager<T> => {
  return new DefaultChanneListenerManager();
};
