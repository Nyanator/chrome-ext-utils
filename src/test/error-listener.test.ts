import { ErrorListener } from "../utils/error-listener";

describe("ErrorListenerクラスのテスト", () => {
  let listener: ErrorListener;

  beforeEach(() => {
    listener = new ErrorListener();
  });

  afterEach(() => {
    // 全てのイベントリスナーを解除する
    jest.restoreAllMocks();
  });

  describe("listenメソッド", () => {
    it("エラーハンドラを設定し、エラーイベントをリッスンする", () => {
      const errorHandlerMock = jest.fn();
      const addEventListenerMock = jest.spyOn(self, "addEventListener");

      listener.listen(errorHandlerMock);

      expect(addEventListenerMock).toHaveBeenCalledWith("error", expect.any(Function));
      expect(addEventListenerMock).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );
    });
  });

  describe("unlistenメソッド", () => {
    it("エラーハンドラを解除し、エラーイベントのリッスンを停止する", () => {
      const errorHandlerMock = jest.fn();
      const addEventListenerMock = jest.spyOn(self, "addEventListener");
      const removeEventListenerMock = jest.spyOn(self, "removeEventListener");

      listener.listen(errorHandlerMock);
      listener.unlisten();

      expect(addEventListenerMock).toHaveBeenCalledWith("error", expect.any(Function));
      expect(addEventListenerMock).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );
      expect(removeEventListenerMock).toHaveBeenCalledWith("error", expect.any(Function));
      expect(removeEventListenerMock).toHaveBeenCalledWith(
        "unhandledrejection",
        expect.any(Function),
      );
    });
  });

  describe("handleErrorメソッド", () => {
    it("設定されたエラーハンドラが呼び出される", () => {
      const errorHandlerMock = jest.fn();
      const mockEvent = new ErrorEvent("error");

      listener.listen(errorHandlerMock);
      listener["handleError"](mockEvent);
      expect(errorHandlerMock).toHaveBeenCalledWith(mockEvent);
    });
  });
});
