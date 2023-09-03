/**
 * 宣言的null例外サポートです。
 * nullableを許容しないコンテキストで非nullableへの変換に使います。
 * @param value 検査対象
 * @returns 非nullableな値
 */
export const assertNotNull = function <T>(value: T | null | undefined): T {
    if (value === null || value === undefined) {
        throw new ReferenceError();
    }
    return value;
};

/**
 * 一度しか同一キーに対してsetできない機能をMapにコンポジションする。
 * Mapを継承することも考えたが、Mapがインターフェースとして提供されている利点を削ぐため関数にした。
 * @param map セット対象のmap
 * @param key キー値
 * @param value 設定する値
 */
export const uniqueSet = <K, V>(map: Map<K, V>, key: K, value: V): void => {
    if (map.has(key)) {
        throw new Error(`Duplicate set for key: ${key}`);
    }
    map.set(key, value);
};
