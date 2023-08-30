import { assertNotNull, uniqueSet } from "../utils/ts-utils";

import { EventHandlerConfig } from "./interfaces";

/**
 * イベントハンドラーの購読と解除を管理するオブジェクト。
 */
export class EventHandlerManager {
  private readonly eventHandlers: Map<Element, Map<string, EventListener>> =
    new Map();

  /**
   * Elementにイベントハンドラーを設定しマップに保存する
   * @param configs イベントハンドラー設定のリスト
   * @param elementsMap Elementのマップ
   */
  addEventHandlers(
    configs: EventHandlerConfig[],
    elementsMap: { [key: string]: Element },
  ): void {
    configs.forEach((config) => {
      const element = elementsMap[config.element];

      uniqueSet(this.eventHandlers, element, new Map());
      const handlersForElement = assertNotNull(this.eventHandlers.get(element));

      Object.entries(config.events).forEach(([eventType, handler]) => {
        uniqueSet(handlersForElement, eventType, handler);
        element.addEventListener(eventType, handler);
      });
    });
  }

  /**
   * マップに保存したイベントハンドラーを一括解除
   */
  removeAllEventHandlers(): void {
    this.eventHandlers.forEach((eventMap, element) => {
      eventMap.forEach((handler, eventType) => {
        element.removeEventListener(eventType, handler);
      });
    });
    this.eventHandlers.clear();
  }
}
