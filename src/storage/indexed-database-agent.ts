import { DatabaseAgent } from "./interfaces";

/**
 * IndexedDBデータベースを操作します。
 */
export class IndexdDBDatabaseAgent implements DatabaseAgent {
  private db: IDBDatabase | null = null;

  /**
   * データベースのインスタンスを生成します。
   * @param databaseName データベースの名前
   * @param storeName オブジェクトストア（テーブル）の名前
   */
  constructor(
    private readonly databaseName: string,
    private readonly storeName: string
  ) {}

  /**
   * データベースを開きます。存在しない場合は新しく作成します。
   * @returns データベースのオープンが完了したときに解決されるプロミス
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName);

      request.onerror = () => {
        /* istanbul ignore next */
        reject(new Error());
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * データを保存します。
   * @param key データのキー
   * @param data 保存するデータ
   * @returns データの保存が完了したときに解決されるプロミス
   */
  async save(key: string, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.put(data, key);

      request.onerror = () => {
        /* istanbul ignore next */
        reject(new Error());
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * キーに対応するデータを取得します。
   * @param key データのキー
   * @returns 取得したデータ
   */
  async get(key: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(key);

      request.onerror = () => {
        /* istanbul ignore next */
        reject(new Error());
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * キーに対応するデータを削除します。
   * @param key データのキー
   * @returns データの削除が完了したときに解決されるプロミス
   */
  async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.delete(key);

      request.onerror = () => {
        /* istanbul ignore next */
        reject(new Error());
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * データベースを閉じます。
   */
  close(): void {
    this.db?.close();
  }
}
