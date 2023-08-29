import { loadResourceText } from "../utils/chrome-ext-utils";
import { htmlTextToHtmlElement } from "../utils/dom-utils";

import { EventHandlerManager } from "./event-handler-manager";
import {
  ElementLoader,
  ElementSpecifier,
  EventHandlerConfig,
} from "./interfaces";

/**
 * Elementをフェッチして型安全にロードします。
 */
export class FetchElementLoader<
  Spec extends { [key: string]: ElementSpecifier<Element> },
> implements
    ElementLoader<{ [K in keyof Spec]: InstanceType<Spec[K]["elementType"]> }>
{
  readonly elements = {} as {
    [K in keyof Spec]: InstanceType<Spec[K]["elementType"]>;
  };

  private readonly eventHandlerManager = new EventHandlerManager();

  /**
   * FetchElementLoaderクラスのインスタンスを初期化します。
   * @param spec HTMLElementのidと型定義
   * @param path fetchするパス
   */
  constructor(
    private readonly spec: Spec,
    private readonly path: string,
  ) {}

  /**
   * Elementをロードします。
   */
  async loadElements() {
    // パスからFetchして
    const htmlText = await loadResourceText(this.path);
    const htmlElemnt = htmlTextToHtmlElement(htmlText);

    for (const key in this.spec) {
      const elType = this.spec[key].elementType;
      const element = htmlElemnt.querySelector(this.spec[key].id);

      // 取得したエレメントが期待される型と一致するか検証
      if (!(element instanceof elType)) {
        throw new TypeError(
          `The fetched element for ${key} does not match the expected type.`,
        );
      }

      this.elements[key as keyof Spec] = element as InstanceType<
        Spec[keyof Spec]["elementType"]
      >;
    }
    return this;
  }

  /**
   * 読み込んだElementにイベントハンドラーを一括設定
   * @param configs イベントハンドラー設定のリスト
   */
  eventHandlers(configs: EventHandlerConfig[]) {
    this.eventHandlerManager.addEventHandlers(configs, this.elements);
    return this;
  }

  /**
   * イベントハンドラーを一括で解除
   */
  removeAllEventHandlers() {
    this.eventHandlerManager.removeAllEventHandlers();
  }
}
