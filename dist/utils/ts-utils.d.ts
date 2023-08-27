/**
 * 宣言的null例外サポートです。
 * nullableを許容しないコンテキストで非nullableへの変換に使います。
 * @param value 検査対象
 * @returns 非nullableな値
 */
export declare const assertNotNull: <T>(value: T | null | undefined) => T;
