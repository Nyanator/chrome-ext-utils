/**
 * IndexedDBデータベースを操作します。
 */
export class IndexdDBDatabaseAgent {
    /**
     * データベースのインスタンスを生成します。
     * @param databaseName データベースの名前
     * @param storeName オブジェクトストア（テーブル）の名前
     */
    constructor(databaseName, storeName) {
        this.databaseName = databaseName;
        this.storeName = storeName;
        this.db = null;
    }
    /**
     * データベースを開きます。存在しない場合は新しく作成します。
     * @returns データベースのオープンが完了したときに解決されるプロミス
     */
    async open() {
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
                const db = event.target.result;
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
    async save(key, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
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
    async get(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readonly");
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
    async delete(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
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
    close() {
        this.db?.close();
    }
}
