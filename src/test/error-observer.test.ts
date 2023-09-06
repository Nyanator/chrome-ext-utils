import { container } from "tsyringe";

import { DisplayAlertErrorObserver, ErrorObserver } from "../error-observer";
import { Logger } from "../logger";
import { AlertNamedError } from "../utils/alert-named-error";
import { ErrorListener } from "../utils/error-listener";

describe("ErrorObserverクラスのテスト", () => {
  let errorObserver: ErrorObserver;
  let mockErrorListener: ErrorListener;
  let mockLogger: Logger;

  beforeEach(() => {
    container.clearInstances();

    mockLogger = { error: jest.fn() } as unknown as Logger;
    container.register("Logger", {
      useValue: mockLogger,
    });

    mockErrorListener = {
      listen: jest.fn(),
      unlisten: jest.fn(),
    } as unknown as ErrorListener;
    container.register("ErrorListener", {
      useValue: mockErrorListener,
    });

    // DisplayAlertErrorObserverのインスタンスを作成
    container.register<ErrorObserver>("ErrorObserver", {
      useClass: DisplayAlertErrorObserver,
    });
    errorObserver = container.resolve<ErrorObserver>("ErrorObserver");
  });

  it("observeを呼び出すと、エラーリスナーが追加される", () => {
    errorObserver.observe();
    expect(mockErrorListener.listen).toHaveBeenCalled();
  });

  it("unobserveを呼び出すと、エラーリスナーが削除される", () => {
    errorObserver.unobserve();
    expect(mockErrorListener.unlisten).toHaveBeenCalled();
  });

  it("AlertNamedErrorが発生した場合、名前付きアラートが表示される", () => {
    const fakeError = new AlertNamedError("testErrorName", new Error("original errro"));
    const fakeEvent = { reason: fakeError } as PromiseRejectionEvent;

    // alertのモック関数をセットアップ
    const alertMock = jest.spyOn(window, "alert").mockImplementation(() => {});

    chrome.i18n.getMessage = jest.fn().mockImplementation((arg) => arg);

    // エラーハンドラーを呼び出す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (errorObserver as any).errorHandler(fakeEvent);

    expect(alertMock).toHaveBeenCalledWith("testErrorName");
    alertMock.mockRestore();
  });

  it("一般的なエラーが発生した場合、エラーメッセージがロガーに渡される", () => {
    const fakeError = new Error("testErrorMessage");
    const fakeEvent = new ErrorEvent("error", {
      message: "Not an instance of error",
      filename: "somefile.js",
      lineno: 123,
      colno: 456,
      error: fakeError,
    });

    // エラーハンドラーを呼び出す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (errorObserver as any).errorHandler(fakeEvent);

    expect(mockLogger.error).toHaveBeenCalledWith(fakeError.message, fakeError.stack);
  });

  it("errorHandler内でエラーが発生した場合、そのエラーはキャッチされてログに記録される", () => {
    // Loggerのerrorメソッドをモックして、最初の呼び出しでエラーを発生させる
    let callCount = 0;
    mockLogger.error = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Internal Logger Error");
      }
    });

    const fakeError = new Error("Test Error");
    const fakeEvent = { reason: fakeError } as PromiseRejectionEvent;

    // エラーハンドラーを呼び出す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (errorObserver as any).errorHandler(fakeEvent);

    // 2回呼び出されていることを確認
    expect(mockLogger.error).toHaveBeenCalledTimes(2);

    // 1回目の呼び出しはfakeErrorを引数にしている
    expect(mockLogger.error).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      fakeError.stack,
    );

    // 2回目の呼び出しは新しく生成されたエラーオブジェクトを引数にしている
    expect(mockLogger.error).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.any(Error),
    );
  });

  it("errorHandlerがErrorインターフェースを実装しない例外を受け取った場合、それは適切に処理される", () => {
    const fakeErrorEvent = {
      type: "error",
      message: "Not an instance of error",
      filename: "somefile.js",
      lineno: 123,
      colno: 456,
      error: "Just a string, not an error.",
    } as ErrorEvent;

    // エラーハンドラーを呼び出す
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (errorObserver as any).errorHandler(fakeErrorEvent);

    // Loggerのerrorメソッドが正しく呼び出されたことを確認
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
  });
});
