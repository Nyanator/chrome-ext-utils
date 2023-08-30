/**
 * @file 型付けイベントディスパッチャークラスファクトリ関数
 */

import { DefaultEventDispatcher } from "./default-event-dispathcher";
import { EventDispatcher, TypedEventMap } from "./interfaces";

/**
 * 型付けされたイベントディスパッチサポートクラス EventDispatcherを返します。
 * @param strictMode 例外安全にしたければfalse、それ以外は例外を送出します
 */
export const createEventDispatcher = <T extends TypedEventMap>(
  strictMode: boolean = false,
): EventDispatcher<T> => {
  return new DefaultEventDispatcher<T>(strictMode);
};
