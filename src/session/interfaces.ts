/**
 * @file セッション関連クラスインターフェース
 */

/** セッションで静的な値 */
export interface SessionStaticValueProvider {
  /**
   * 保持している値を返します。
   */
  getValue(): string;

  /**
   * セッションで静的な値を生成します。すでに生成されている場合は同じ値が返ります。
   * @param regenerate すでに生成されている場合でも強制的に再生成する
   */
  generateValue(regenerate: boolean): Promise<string>;
}
