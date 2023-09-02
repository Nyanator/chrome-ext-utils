/**
 * コンソールロガー
 * ロギングライブラリをいつでも入れ替えられるように抽象化層を設けています
 */

export interface Logger {
    debug(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
}

/** ファクトリ関数 */
export const Logger = (): Logger => {
    return new ConsoleLogger();
};

/**
 * コンソール出力のLogger実装
 */
class ConsoleLogger implements Logger {
    debug(message: string, ...args: unknown[]): void {
        console.debug(message, ...args);
    }
    info(message: string, ...args: unknown[]): void {
        console.info(message, ...args);
    }
    warn(message: string, ...args: unknown[]): void {
        console.warn(message, ...args);
    }
    error(message: string, ...args: unknown[]): void {
        console.error(message, ...args);
    }
}
