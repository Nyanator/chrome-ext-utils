/**
 * Elementを型安全に読み込むローダー
 */

import { EventListenerMap } from "./event-listener-map";
import { loadResourceText } from "./utils/chrome-ext-utils";
import { htmlTextToHtmlElement } from "./utils/dom-utils";

// ElementSpecifier の型引数を修正
export interface ElementLoader<Elements extends { [key: string]: Element }> {
  /** 読み込んだElementのマップ */
  readonly elements: Elements;
  /** Elementを読み込みます */
  load(): Promise<this>;
  /** 読み込んだElementにリスナーを一括設定 */
  addListeners(configs: EventListenerConfig[]): this;
  /** リスナーを一括で解除 */
  removeAllListeners(): void;
}

// ElementSpecifier の elementType プロパティの型に合わせて Spec 型を修正
export type ElementSpecifier<T extends Element> = {
  id: string;
  elementType: { new (): T };
};

// ElementSpecifier の elementType プロパティの型に合わせて Spec 型を修正
export type ElementMap<Specs> = {
  [K in keyof Specs]: ExtractElement<Specs[K]>;
};

export type ExtractElement<T> = T extends ElementSpecifier<infer E> ? E : never;

/** Elementへのリスナーの設定を宣言的に行う設定 */
export type EventListenerConfig = {
  element: string;
  events: { [key: string]: EventListener };
};

/** ElementLoader用 型ガード*/
export const defineElements = <
  T extends { [key: string]: ElementSpecifier<Element> },
>(
  elements: T,
): T => {
  // 引数をそのまま返すだけだが、それによりTypeScriptの型システムがTであることを保証する
  return elements;
};

/** 構築設定 */
export interface ElementLoaderConfig<
  Spec extends { [key: string]: ElementSpecifier<Element> },
> {
  spec: Spec;
  path: string;
}

/**
 * ファクトリ関数
 * @param config 構築設定
 */
export const FetchElementLoader = <
  Spec extends { [key: string]: ElementSpecifier<Element> },
>(
  config: ElementLoaderConfig<Spec>,
): ElementLoader<ElementMap<Spec>> => {
  return new FetchElementLoaderImpl(config);
};

class FetchElementLoaderImpl<
  Spec extends { [key: string]: ElementSpecifier<Element> },
> implements ElementLoader<ElementMap<Spec>>
{
  readonly elements = {} as ElementMap<Spec>;
  private readonly listenersMap = new EventListenerMap();

  constructor(private readonly config: ElementLoaderConfig<Spec>) {}

  async load() {
    // パスからFetchして
    const htmlText = await loadResourceText(this.config.path);
    const htmlElemnt = htmlTextToHtmlElement(htmlText);

    for (const key in this.config.spec) {
      const elType = this.config.spec[key].elementType;
      const element = htmlElemnt.querySelector(this.config.spec[key].id);

      // 取得したエレメントが期待される型と一致するか検証
      if (!(element instanceof elType)) {
        throw new TypeError(
          `The fetched element for ${key} does not match the expected type.`,
        );
      }

      this.elements[key] = element as ExtractElement<Spec[keyof Spec]>;
    }
    return this;
  }

  addListeners(configs: EventListenerConfig[]) {
    this.listenersMap.addListeners({
      configs: configs,
      elementsMap: this.elements,
    });
    return this;
  }

  removeAllListeners() {
    this.listenersMap.removeAllListeners();
  }
}
