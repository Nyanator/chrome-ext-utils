export type ValidationMethod = (value: unknown) => void;

export interface ValidationMethods {
  argsValidator?: ValidationMethod;
  resultValidator?: ValidationMethod;
}

/**
 * メソッドの事前条件と事後条件をランタイムチェックするバリデータを織り込むデコレータ関数
 * @param validationMethods 検証メソッド(引数、戻り)
 * @returns デコレータ
 */
export function validateMethod(validationMethods: ValidationMethods) {
  return function (
    _target: unknown,
    _propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    // 呼び先がasyncかどうかで例外処理に影響するので関数のプロトタイプから非同期か判定
    const isAsyncFunction = isAsync(originalMethod);

    if (isAsyncFunction) {
      descriptor.value = async function (...args: unknown[]) {
        // 事前条件の検証
        if (validationMethods.argsValidator) {
          validationMethods.argsValidator(args);
        }

        const result = await originalMethod.apply(this, args);

        // 事後条件の検証
        if (validationMethods.resultValidator) {
          validationMethods.resultValidator(result);
        }

        return result;
      };
    } else {
      descriptor.value = function (...args: unknown[]) {
        // 事前条件の検証
        if (validationMethods.argsValidator) {
          validationMethods.argsValidator(args);
        }

        const result = originalMethod.apply(this, args);

        // 事後条件の検証
        if (validationMethods.resultValidator) {
          validationMethods.resultValidator(result);
        }
        return result;
      };
    }
  };
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isAsync(func: Function): boolean {
  return Object.getPrototypeOf(func) === Object.getPrototypeOf(async function () {});
}
