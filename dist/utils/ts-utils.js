"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertNotNull = void 0;
/**
 * 宣言的null例外サポートです。
 * nullableを許容しないコンテキストで非nullableへの変換に使います。
 * @param value 検査対象
 * @returns 非nullableな値
 */
const assertNotNull = function (value) {
    if (value === null || value === undefined) {
        throw new ReferenceError();
    }
    return value;
};
exports.assertNotNull = assertNotNull;
