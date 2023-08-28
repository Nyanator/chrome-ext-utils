/**
 * @file 永続化データーベースクラスインターフェース
 */

/** 永続化データベース */
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
