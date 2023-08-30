/**
 * @file 型付けイベントディスパッチャークラスインターフェース
 */

/** 型付けされたデータと応答を持つイベント(継承して使用してください) */
export interface TypedEventMap {
  [key: string]: {
    readonly data: unknown | undefined;
    readonly response: unknown | undefined;
  };
}

/** イベントデータの型 */
export type EventData<
  T extends TypedEventMap,
  K extends keyof T,
> = T[K]["data"];

/** イベント応答の型 */
export type EventResponse<
  T extends TypedEventMap,
  K extends keyof T,
> = T[K]["response"];

/** 型付けされたイベントハンドラ */
export type TypedEventHandler<T extends TypedEventMap, K extends keyof T> = (
  data: EventData<T, K>,
) => EventResponse<T, K> | Promise<EventResponse<T, K>>;

/**  型付けイベントディスパッチャー */
export interface EventDispatcher<T extends TypedEventMap> {
  /**
   * イベントハンドラーを登録します
   * @param handlers TypedEventMap
   */
  addEventHandlers<K extends keyof T>(handlers: {
    [Key in K]: TypedEventHandler<T, Key>;
  }): void;

  /**
   * イベントをディスパッチします
   * @param eventKey ディスパッチするイベントのキー
   * @param eventData ディスパッチするイベントのデータ
   * @returns ハンドラーからの応答リスト
   */
  dispatchEvent<K extends keyof T>(
    eventKey: K,
    eventData: EventData<T, K>,
  ): Promise<EventResponse<T, K>[]>;

  /**
   * イベントハンドラーを登録解除します
   * @param eventKey 解除するイベントのキー
   * @param handlerToRemove 解除したいハンドラー
   */
  removeHandler<K extends keyof T>(
    eventKey: K,
    handlerToRemove: TypedEventHandler<T, K>,
  ): void;

  /**
   * イベントキーに紐づく全てのハンドラーを登録解除します
   * @param eventKey 解除するイベントのキー
   */
  removeAllHandlersForEvent<K extends keyof T>(eventKey: K): void;

  /**
   * 全てのハンドラーを登録解除します
   */
  clearAllHandlers(): void;
}
