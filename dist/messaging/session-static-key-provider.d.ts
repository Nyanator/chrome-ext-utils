import { SessionStaticValueProvider } from "./interfaces";
/**
 * セッションで静的な暗号化の鍵を生成します。
 */
export declare class SessionStaticKeyProvider implements SessionStaticValueProvider {
    private key;
    private aesInitial;
    getValue(): string;
    /**
     * 暗号化のための鍵を生成します。
     * @param regenerate true=既存の値があっても強制的に再作成する
     * @returns 鍵
     */
    generateValue(regenerate: boolean): Promise<string>;
}
