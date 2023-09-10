/**
 * グローバルなエラーイベントをリスニングするためのラップクラス
 */

import "reflect-metadata";
import { injectable } from "tsyringe";

export type ErrorHandler = (event: ErrorEvent | PromiseRejectionEvent) => void;

@injectable()
export class ErrorListener {
  private errorHandler?: ErrorHandler;

  /**
   * グローバルエラーイベントをリッスンします。
   * @param errorHandler エラーハンドラ
   */
  listen(errorHandler: ErrorHandler) {
    this.errorHandler = errorHandler;
    self.addEventListener("error", this.handleError);
    self.addEventListener("unhandledrejection", this.handleError);
  }

  /**
   * グローバルエラーイベントのリッスンを停止します。
   */
  unlisten() {
    if (this.errorHandler) {
      self.removeEventListener("error", this.handleError);
      self.removeEventListener("unhandledrejection", this.handleError);
      this.errorHandler = undefined;
    }
  }

  private handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
    this.errorHandler?.(event);
  };
}
