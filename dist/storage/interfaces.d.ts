/** 永続化データベース */
export interface DatabaseAgent {
    open(): Promise<void>;
    save(key: string, data: unknown): Promise<void>;
    get(key: string): Promise<unknown>;
    delete(key: string): Promise<void>;
    close(): void;
}
