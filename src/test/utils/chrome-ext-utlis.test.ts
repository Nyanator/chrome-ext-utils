import * as ChromeExtensionUtils from "../../utils/chrome-ext-utils";
import * as DomUtils from "../../utils/dom-utils";
import * as MockUtils from "../mocks/mock-utils";

describe("Chrome拡張のユーティリティ関数", () => {
  it("generateSessionStaticValue Chromeのセッションに静的な値を保存する", async () => {
    const mockKey = "testKey";
    const mockValue = "testValue";

    MockUtils.initChromeSession();

    const isBackgroundSpy = jest.spyOn(ChromeExtensionUtils, "isBackground");
    isBackgroundSpy.mockReturnValue(true);

    let result = await ChromeExtensionUtils.generateSessionStaticValue(
      mockKey,
      mockValue,
      false,
    );

    // バックグラウンドの時権限を設定しているか
    expect(chrome.storage.session.setAccessLevel).toBeCalledWith({
      accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
    });

    // set関数の呼び出しを確認する
    expect(chrome.storage.session.set).toBeCalledWith({ [mockKey]: mockValue });
    expect(result).toBe(mockValue);

    // 前回値がある場合前回値を返す
    const oldValue = "oldValue";
    global.chrome.storage.session.get = jest
      .fn()
      .mockReturnValue({ [mockKey]: oldValue });

    result = await ChromeExtensionUtils.generateSessionStaticValue(
      mockKey,
      mockValue,
      false,
    );

    expect(result).toBe(oldValue);
    isBackgroundSpy.mockRestore();
  });

  it("isBackground スクリプトがバックグラウンドとして実行されているか判定する", () => {
    expect(DomUtils.getLocation()).toBe(location);
    expect(DomUtils.getDocument()).toBe(document);

    // オリジンが違う時バックグラウンドではない
    const locationSpy = jest.spyOn(DomUtils, "getLocation");
    const documentSpy = jest.spyOn(DomUtils, "getDocument");

    locationSpy.mockReturnValue({ origin: "http://origincheck/" } as Location);
    documentSpy.mockReturnValue(document);
    expect(ChromeExtensionUtils.isBackground()).toBe(false);

    // オリジンが一致していてドキュメントがあるバックグラウンドではない
    locationSpy.mockReturnValue({
      origin: ChromeExtensionUtils.EXT_ORIGIN,
    } as Location);
    documentSpy.mockReturnValue(document);

    expect(ChromeExtensionUtils.isBackground()).toBe(false);

    // オリジンが一致していてドキュメントがundefinedはバックグラウンド
    locationSpy.mockReturnValue({
      origin: ChromeExtensionUtils.EXT_ORIGIN,
    } as Location);
    documentSpy.mockReturnValue(undefined as unknown as Document);

    expect(ChromeExtensionUtils.isBackground()).toBe(true);

    // オリジンが一致していてドキュメントのアクセス時に例外が発生すればバックグラウンド
    locationSpy.mockReturnValue({
      origin: ChromeExtensionUtils.EXT_ORIGIN,
    } as Location);
    documentSpy.mockImplementation(() => {
      throw new Error();
    });

    expect(ChromeExtensionUtils.isBackground()).toBe(true);
  });

  it("loadResourceText Chrome拡張からリソーステキストを読み込む", async () => {
    const mockText = "mockText";
    // fetchの結果textが返却される
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(mockText),
    });

    expect(await ChromeExtensionUtils.loadResourceText("test/path")).toBe(
      mockText,
    );
  });

  it("reserveLoadedAction DOMの読み込み状態によってactionが実行される", () => {
    const action = jest.fn();

    // 読み込み済み 実行
    ChromeExtensionUtils.reserveLoadedAction(
      { readyState: "interactive" } as Document,
      action,
    );
    expect(action).toBeCalled();
    action.mockClear();

    // 読み込み済み 実行
    ChromeExtensionUtils.reserveLoadedAction(
      { readyState: "complete" } as Document,
      action,
    );
    expect(action).toBeCalled();
    action.mockClear();

    // 読み込み前 実行されない
    ChromeExtensionUtils.reserveLoadedAction(
      { readyState: "loading" } as Document,
      action,
    );
    expect(action).not.toBeCalled();
    action.mockClear();

    // マニュアルでDOMContentLoadedイベントを発火させる 実行される
    const event = new Event("DOMContentLoaded", {
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
    expect(action).toBeCalled();
    action.mockClear();
  });

  it("waitForAction 条件によってactionが実行されるかが変わる", async () => {
    let condition = false;
    const action = jest.fn(() => {});
    const check = jest.fn(() => condition);

    // 条件を満たすとactionが実行される
    process.nextTick(() => {
      condition = true;
    });

    await ChromeExtensionUtils.waitForAction(action, check);

    expect(check).toBeCalled();
    expect(action).toBeCalled();

    check.mockClear();
    action.mockClear();

    // 条件を満たさない場合もアクションは実行される
    condition = false;
    await ChromeExtensionUtils.waitForAction(action, check, 5, 10);

    expect(check).toBeCalled();
    expect(action).toBeCalled();
  });
});
