import * as TsUtils from "../../utils/ts-utils";

describe("ts-utils TypeScriptのユーティリティ", () => {
  it("assertNotNull null安全サポート関数", () => {
    // nullの場合、ReferenceErrorをスローする
    expect(() => TsUtils.assertNotNull(null)).toThrow(ReferenceError);

    // undefinedの場合、ReferenceErrorをスローする
    expect(() => TsUtils.assertNotNull(undefined)).toThrow(ReferenceError);

    // falsyな値でもnullやundefinedでなければ例外をスローしない
    const falsyValues = [0, "", false];
    falsyValues.forEach((falsyValue) => {
      expect(() => TsUtils.assertNotNull(falsyValue)).not.toThrow();
    });

    // truthyな値の場合、例外をスローしない
    const truthyValues = [1, "test", {}, [], true];
    truthyValues.forEach((truthyValue) => {
      expect(() => TsUtils.assertNotNull(truthyValue)).not.toThrow();
    });

    // truthyな値の場合、同じ値を返す
    truthyValues.forEach((truthyValue) => {
      expect(TsUtils.assertNotNull(truthyValue)).toBe(truthyValue);
    });
  });
});
