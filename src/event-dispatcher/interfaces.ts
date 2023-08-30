/**
 * @file 型付けイベントディスパッチャークラスインターフェース
 */

/** 型付けされたデータと応答を持つイベント(継承して使用してください) */
export interface TypedEventMap {
  [key: string]: {
    readonly data: unknown;
    readonly response: unknown;
  };
}

/** 型付けされたイベントハンドラ */
export type TypedEventHandler<Data, Response> = (
  data: Data,
) => Response | Promise<Response>;

/**  型付けイベントディスパッチャー */
export interface EventDispatcher<T extends TypedEventMap> {
  /**
   * イベントハンドラーを登録します
   * @param handlers TypedEventMap
   */
  addEventHandlers<K extends keyof T>(handlers: {
    [Key in K]: TypedEventHandler<T[Key]["data"], T[Key]["response"]>;
  }): void;

  /**
   * イベントをディスパッチします
   * @param eventKey ディスパッチするイベントのキー
   * @param eventData ディスパッチするイベントのデータ
   * @returns ハンドラーからの応答リスト
   */
  dispatchEvent<K extends keyof T>(
    eventKey: K,
    eventData: T[K]["data"],
  ): Promise<T[K]["response"][]>;

  /**
   * イベントハンドラーを登録解除します
   * @param eventKey 解除するイベントのキー
   * @param handlerToRemove 解除したいハンドラー
   */
  removeHandler<K extends keyof T>(
    eventKey: K,
    handlerToRemove: TypedEventHandler<T[K]["data"], T[K]["response"]>,
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
