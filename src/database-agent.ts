/**
 * 永続化データーベース
 */
import "reflect-metadata";

import { inject, injectable } from "tsyringe";

import { Logger } from "./logger";

export interface DatabaseAgent {
  /**
   * データベースを開きます。存在しない場合は新しく作成します。
   * @returns データベースのオープンが完了したときに解決されるプロミス
   */
  open(): Promise<void>;
  /**
   * データを保存します。
   * @param key データのキー
   * @param data 保存するデータ
   * @returns データの保存が完了したときに解決されるプロミス
   */
  save(key: string, data: unknown): Promise<void>;
  /**
   * キーに対応するデータを取得します。
   * @param key データのキー
   * @returns 取得したデータ
   */
  get(key: string): Promise<unknown>;
  /**
   * キーに対応するデータを削除します。
   * @param key データのキー
   * @returns データの削除が完了したときに解決されるプロミス
   */
  delete(key: string): Promise<void>;
  /**
   * データベースを閉じます。
   */
  close(): void;
}

/** 構築設定 */
export type DatabaseAgentConfig = Readonly<{
  databaseName: string; // データベースの名前
  storeName: string; // オブジェクトストア（テーブル）の名前
}>;

@injectable()
export class IndexdDBDatabaseAgent implements DatabaseAgent {
  private db: IDBDatabase | null = null;

  constructor(
    @inject("DatabaseAgentConfig")
    private readonly config: DatabaseAgentConfig,
    @inject("Logger") private readonly logger: Logger,
  ) {}

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.databaseName);

      request.onerror = () => {
        reject(new Error());
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.config.storeName)) {
          db.createObjectStore(this.config.storeName);
        }
      };
    });
  }

  async save(key: string, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.config.storeName);
      const request = objectStore.put(data, key);

      request.onerror = () => {
        reject(new Error());
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async get(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], "readonly");
      const objectStore = transaction.objectStore(this.config.storeName);
      const request = objectStore.get(key);

      request.onerror = () => {
        reject(new Error());
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.config.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.config.storeName);
      const request = objectStore.delete(key);

      request.onerror = () => {
        reject(new Error());
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  close(): void {
    this.db?.close();
  }
}
