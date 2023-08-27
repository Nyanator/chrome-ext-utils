import { IndexdDBDatabaseAgent } from "./indexed-database-agent";
/**
 * DatabaseAgentを生成します。
 * @param databaseName データベースの名前
 * @param storeName オブジェクトストア（テーブル）の名前
 * @returns DatabaseAgent
 */
export const createDatabaseAgent = (databaseName, storeName) => {
    const databaseAgent = new IndexdDBDatabaseAgent(databaseName, storeName);
    return databaseAgent;
};
