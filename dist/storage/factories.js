"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabaseAgent = void 0;
const indexed_database_agent_1 = require("./indexed-database-agent");
/**
 * DatabaseAgentを生成します。
 * @param databaseName データベースの名前
 * @param storeName オブジェクトストア（テーブル）の名前
 * @returns DatabaseAgent
 */
const createDatabaseAgent = (databaseName, storeName) => {
    const databaseAgent = new indexed_database_agent_1.IndexdDBDatabaseAgent(databaseName, storeName);
    return databaseAgent;
};
exports.createDatabaseAgent = createDatabaseAgent;
