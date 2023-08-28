/**
 * @file 永続化データーベースクラスファクトリ関数
 */

import { IndexdDBDatabaseAgent } from "./indexed-database-agent";
import { DatabaseAgent } from "./interfaces";

/**
 * DatabaseAgentを生成します。
 * @param databaseName データベースの名前
 * @param storeName オブジェクトストア（テーブル）の名前
 * @returns DatabaseAgent
 */
export const createDatabaseAgent = (
  databaseName: string,
  storeName: string,
): DatabaseAgent => {
  const databaseAgent = new IndexdDBDatabaseAgent(databaseName, storeName);
  return databaseAgent;
};
