/**
 * @file Elementローダークラスインターフェース
 */

/** Elementを型安全に読み込むローダー */
export interface ElementLoader<Elements extends { [key: string]: Element }> {
  /** 読み込んだElementのマップ */
  readonly elements: Elements;
  /** Elementを読み込みます */
  loadElements(): Promise<this>;
  /** 読み込んだElementにリスナーを一括設定 */
  addEventListeners(configs: EventListenerConfig[]): this;
  /** リスナーを一括で解除 */
  removeAllEventListeners(): void;
}

/** idを持つElemntのタイプ定義 */
export type ElementSpecifier<T extends Element> = {
  id: string;
  elementType: { new (): T };
};

/** ElementSpecifierの型推論 Eが何らかの型を持つ場合はEそれ以外はneverにする */
export type ExtractElement<T> = T extends ElementSpecifier<infer E> ? E : never;

/** Specsの各キーに対するElementSpecifierのelementTypeの具体的な型をマッピングする */
export type ElementMap<Specs> = {
  [K in keyof Specs]: ExtractElement<Specs[K]>;
};

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
