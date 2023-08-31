/**
 * @file 型付けされた相互通信チャンネルクラスファクトリ関数
 */

import { ChanneListenerMapImpl } from "./channel-listener-map-impl";
import { CrossDispatcherImpl } from "./cross-dispathcher-impl";
import { ChannelListenerMap, ChannelMap, CrossDispatcher } from "./interfaces";

export const createCrossDispatcher = <T extends ChannelMap>(
  strictMode: boolean = false,
): CrossDispatcher<T> => {
  return new CrossDispatcherImpl(strictMode);
};

export const createChannelListenerMap = <
  T extends ChannelMap,
>(): ChannelListenerMap<T> => {
  return new ChanneListenerMapImpl();
};
