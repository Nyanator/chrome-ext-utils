/**
 * @file ロギングインターフェース
 */

/** ロギングライブラリをいつでも入れ替えられるように抽象化層を設けています */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
