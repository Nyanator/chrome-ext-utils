/**
 * 型付けされたHTMLローダー
 */

import { loadResourceText } from "./chrome-ext-utils";
import { htmlTextToHtmlElement } from "./dom-utils";

export type ElementSpecifier<T extends Element> = {
  id: string;
  elementType: { new (): T };
};

export type ElementMap<Specs> = {
  [K in keyof Specs]: ExtractElement<Specs[K]>;
};

export type ExtractElement<T> = T extends ElementSpecifier<infer E> ? E : never;

export class ElementLoader<Spec extends { [key: string]: ElementSpecifier<Element> }> {
  readonly elements = {} as ElementMap<Spec>;
  private readonly spec: Spec;

  /**
   * ElementLoaderのインスタンスを初期化します
   * @param spec 型情報
   */
  constructor(spec: Spec) {
    this.spec = spec;
  }

  /**
   * URLからHTMLを読み込みます
   * @param path URLパス
   */
  async loadFromURL(path: string) {
    const htmlText = await loadResourceText(path);
    return this.loadFromString(htmlText);
  }

  /**
   * 文字列からHTMLを読み込みます
   * @param htmlString html形式文字列
   */
  async loadFromString(htmlString: string) {
    const htmlElement = htmlTextToHtmlElement(htmlString);

    for (const key in this.spec) {
      const elType = this.spec[key].elementType;
      const element = htmlElement.querySelector(this.spec[key].id);

      if (!(element instanceof elType)) {
        throw new TypeError(
          `The fetched element for ${key} does not match the expected type.`,
        );
      }

      this.elements[key] = element as ExtractElement<Spec[keyof Spec]>;
    }
    return this;
  }
}
