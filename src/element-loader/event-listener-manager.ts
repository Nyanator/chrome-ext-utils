import { assertNotNull, uniqueSet } from "../utils/ts-utils";

import { EventListenerConfig } from "./interfaces";

/**
 * リスナーの購読と解除を管理するオブジェクト。
 */
export class EventListenerManager {
  private readonly eventListeners: Map<Element, Map<string, EventListener>> =
    new Map();

  /**
   * Elementにリスナーを設定しマップに保存する
   * @param configs リスナー設定のリスト
   * @param elementsMap Elementのマップ
   */
  addEventListeners(
    configs: EventListenerConfig[],
    elementsMap: { [key: string]: Element },
  ): void {
    configs.forEach((config) => {
      const element = elementsMap[config.element];

      uniqueSet(this.eventListeners, element, new Map());
      const ListenersForElement = assertNotNull(
        this.eventListeners.get(element),
      );

      Object.entries(config.events).forEach(([eventType, listener]) => {
        uniqueSet(ListenersForElement, eventType, listener);
        element.addEventListener(eventType, listener);
      });
    });
  }

  /**
   * マップに保存したリスナーを一括解除
   */
  removeAllEventListeners(): void {
    this.eventListeners.forEach((eventMap, element) => {
      eventMap.forEach((listener, eventType) => {
        element.removeEventListener(eventType, listener);
      });
    });
    this.eventListeners.clear();
  }
}
