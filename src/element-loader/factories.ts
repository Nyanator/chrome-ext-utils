/**
 * @file Elementローダークラスファクトリ関数
 */

import { FetchElementLoader } from "./fetch-element-loader";
import { ElementSpecifier } from "./interfaces";

/**
 * Elementをフェッチして型安全にロードするElmentLoaderを返します。
 * @param spec Elementのidと型定義
 * @param path fetchするパス
 */
export const createFetchElementLoader = <
  Spec extends { [key: string]: ElementSpecifier<Element> },
>(
  spec: Spec,
  path: string,
): FetchElementLoader<Spec> => {
  return new FetchElementLoader(spec, path);
};
