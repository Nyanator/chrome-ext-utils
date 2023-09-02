/**
 * ファクトリ関数の設定の基底
 * 原則ファクトリ関数はInjectionCofigを引数にする。
 * 依存関係がある場合は、extendsして設定を追加しても良い。
 */
import { Logger } from "./logger";

export interface InjectionConfig {
    readonly logger?: Logger;
}
