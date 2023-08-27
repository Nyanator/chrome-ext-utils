import { SessionStaticValueProvider } from "./interfaces";
/**
 * セッションで静的なトークンを生成します。
 */
export declare class SessionStaticTokenProvider implements SessionStaticValueProvider {
    private token;
    getValue(): string;
    /**
     * ランダムなトークンを生成します。
     * @param regenerate true=既存の値があっても強制的に再作成する
     * @returns トークン
     */
    generateValue(regenerate: boolean): Promise<string>;
}
