/**
 * @file ロギングクラスファクトリ関数
 */

import { ConsoleLogger } from "./console-logger";
import { Logger } from "./interfaces";

/**
 * ロガー生成します
 */
export const createLogger = (): Logger => {
  return new ConsoleLogger();
};
