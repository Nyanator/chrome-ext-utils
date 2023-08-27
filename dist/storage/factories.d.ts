import { DatabaseAgent } from "./interfaces";
/**
 * DatabaseAgentを生成します。
 * @param databaseName データベースの名前
 * @param storeName オブジェクトストア（テーブル）の名前
 * @returns DatabaseAgent
 */
export declare const createDatabaseAgent: (databaseName: string, storeName: string) => DatabaseAgent;
