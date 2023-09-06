/**
 * グローバルエラーイベントを監視し後処理を実装
 */

import "reflect-metadata";
import { inject, injectable } from "tsyringe";
import { ErrorListener } from "utils/error-listener";

import { Logger } from "./logger";
import { AlertNamedError } from "./utils/alert-named-error";

/** グローバルエラーイベントを監視 */
export interface ErrorObserver {
    /** グローバルエラーイベントの監視を開始します。 */
    observe(): void;
    /** グローバルエラーイベントを監視を停止します。 */
    unobserve(): void;
}

/** アラート機能付きグローバルエラーオブザーバーの実装 */
@injectable()
export class DisplayAlertErrorObserver implements ErrorObserver {
    constructor(
        @inject("Logger") private readonly logger: Logger,
        @inject("ErrorListener")
        private readonly errorListener: ErrorListener,
    ) {}

    observe(): void {
        this.errorListener.listen(this.errorHandler.bind(this));
    }

    unobserve(): void {
        this.errorListener.unlisten();
    }

    private errorHandler(event: ErrorEvent | PromiseRejectionEvent) {
        // エラー処理中に自身の中で例外が発生すると再帰するのでブロックするためのtry
        try {
            let message: string;
            let errorDetail: string | undefined;

            const error =
                event instanceof ErrorEvent ? event.error : event.reason;

            if (error instanceof AlertNamedError) {
                message = `AlertNamedError: ${error.name}`;
                // 名前付きアラートエラーはユーザーに通知するための仕組み
                // messages.jsonから多言語対応のメッセージを取得して表示する
                // ただし、バックグランドにはalertは実装されないので表示しない
                if (alert) {
                    const message = chrome.i18n.getMessage(error.name);
                    alert(message);
                }
                errorDetail = error.stack;
            } else if (error instanceof Error) {
                message = error.message;
                errorDetail = error.stack;
            } else {
                message = `Unknown error event: ${event}`;
            }

            this.logger.error(message, errorDetail);
        } catch (internalError) {
            this.logger.error(
                "Error occurred while handling error:",
                internalError,
            );
        }
    }
}
