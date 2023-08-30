import {
  EventData,
  EventDispatcher,
  EventResponse,
  TypedEventHandler,
  TypedEventMap,
} from "./interfaces";

/**
 * 型付けされたイベントディスパッチャーのデフォルト実装クラス。
 */
export class DefaultEventDispatcher<T extends TypedEventMap>
  implements EventDispatcher<T>
{
  private readonly eventHandlers: Map<
    keyof T,
    TypedEventHandler<T, keyof T>[]
  > = new Map();

  private readonly dispatchingEvents: Set<keyof T> = new Set();

  /**
   * DefaultEventDispatcher クラスのインスタンスを初期化します。
   * @param strictMode 例外安全にしたければfalse、それ以外は例外を送出します
   */
  constructor(private readonly strictMode: boolean = false) {}

  /**
   * イベントハンドラーを登録します
   * @param handlers TypedEventMap
   */
  addEventHandlers<K extends keyof T>(handlers: {
    [Key in K]: TypedEventHandler<T, Key>;
  }): void {
    for (const eventKey in handlers) {
      if (!this.eventHandlers.has(eventKey)) {
        this.eventHandlers.set(eventKey, []);
      }
      const handler = handlers[eventKey];
      const handlersArray = this.eventHandlers.get(eventKey);
      if (handler && handlersArray) {
        handlersArray.push(handler as unknown as TypedEventHandler<T, keyof T>);
      }
    }
  }

  /**
   * イベントをディスパッチします
   * @param eventKey ディスパッチするイベントのキー
   * @param eventData ディスパッチするイベントのデータ
   * @returns ハンドラーからの応答リスト
   */
  async dispatchEvent<K extends keyof T>(
    eventKey: K,
    eventData: EventData<T, K>,
  ): Promise<EventResponse<T, K>[]> {
    const handlers = this.eventHandlers.get(eventKey);
    // 疎結合にするためのイベントディスパッチなのでオブザーバーがいない場合は空を返す
    if (!handlers) {
      this.handleError(
        `No handlers registered for event: ${eventKey.toString()}`,
      );
      return [];
    }

    const responses: EventResponse<T, K>[] = [];
    if (this.dispatchingEvents.has(eventKey)) {
      this.handleError(
        `recursively called. Stop to prevent stack overflow. for event: ${eventKey.toString()}`,
      );
      return []; // すでに同じイベントが呼び出し中なので何もしない
    }
    this.dispatchingEvents.add(eventKey); // イベントを呼び出し中としてマーク

    // 本来例外を握りつぶすべきではないが、
    // この場合疎結合性を担保するべきであり、例外処理をしないオブザーバーに責務がある
    try {
      for (const handler of handlers) {
        const response = handler(eventData);
        if (response instanceof Promise) {
          const result = await response;
          responses.push(result);
        } else {
          responses.push(response);
        }
      }
    } catch (error) {
      // 何故かハンドラがError以外をスローしたときプログラム上のミスである可能性が高いため報告する
      if (!(error instanceof Error)) {
        throw new Error(
          `Attempting to throw an invalid exception event: ${eventKey.toString()}`,
        );
      }
      this.handleError(
        `Error handling event: ${eventKey.toString()}: ${
          error.message + error.stack
        }`,
      );
    } finally {
      this.dispatchingEvents.delete(eventKey); // イベント呼び出し終了
    }

    return responses;
  }

  /**
   * イベントハンドラーを登録解除します
   * @param eventKey 解除するイベントのキー
   * @param handlerToRemove 解除したいハンドラー
   */
  removeHandler<K extends keyof T>(
    eventKey: K,
    handlerToRemove: TypedEventHandler<T, keyof T>,
  ): void {
    const handlers = this.eventHandlers.get(eventKey);
    if (!handlers) {
      return;
    }

    const index = handlers.findIndex((handler) => handler === handlerToRemove);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * イベントキーに紐づく全てのハンドラーを登録解除します
   * @param eventKey 解除するイベントのキー
   */
  removeAllHandlersForEvent<K extends keyof T>(eventKey: K): void {
    this.eventHandlers.set(eventKey, []);
  }

  /**
   * 全てのハンドラーを登録解除します
   */
  clearAllHandlers(): void {
    this.eventHandlers.clear();
  }

  /**
   * エラー処理
   */
  private handleError(errorMessage: string) {
    if (this.strictMode) {
      throw new Error(errorMessage);
    }
    console.error(errorMessage);
  }
}
