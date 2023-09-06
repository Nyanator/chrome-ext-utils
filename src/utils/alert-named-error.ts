/** alert識別子で名前付けされたErrorの実装 */
export class AlertNamedError extends Error {
    constructor(
        errorName: string,
        readonly originalError: unknown,
    ) {
        super(errorName);
        this.name = errorName;

        // エラーがスローされた場所の適切なスタックトレースを維持します
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
