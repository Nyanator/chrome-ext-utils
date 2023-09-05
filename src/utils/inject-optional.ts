import { container, injectWithTransform } from "tsyringe";

/**
 * tsyringeで依存関係を解決するときに、オプショナルな解決ができないため
 * 自作デコレータでinjectOptionalを作るハック
 */
class Optional {
    getOptionalValue(token: string): unknown {
        try {
            return container.resolve(token);
        } catch (e) {
            return undefined;
        }
    }
}

class OptionalTransform {
    public transform(optional: Optional, token: string): unknown {
        return optional.getOptionalValue(token);
    }
}

export function injectOptional(token: string) {
    return injectWithTransform(Optional, OptionalTransform, token);
}
