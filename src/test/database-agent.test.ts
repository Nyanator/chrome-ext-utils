import "fake-indexeddb/auto";

import { container } from "tsyringe";

import {
  DatabaseAgent,
  DatabaseAgentConfig,
  IndexdDBDatabaseAgent,
} from "../database-agent";
import { ConsoleInjectableLogger } from "../logger";

describe("DatabaseAgentクラス", () => {
  const dbName = "testDB";
  const storeName = "testStore";
  const key = "testKey";
  const data = "testData";

  let db: DatabaseAgent;
  beforeEach(async () => {
    container.clearInstances();

    container.register("Logger", {
      useClass: ConsoleInjectableLogger,
    });

    container.register<DatabaseAgentConfig>("DatabaseAgentConfig", {
      useValue: { databaseName: dbName, storeName: storeName },
    });

    container.register<DatabaseAgent>("DatabaseAgent", {
      useClass: IndexdDBDatabaseAgent,
    });

    db = container.resolve<DatabaseAgent>("DatabaseAgent");
  });

  it("データベースが正常に開けるか", async () => {
    await expect(db.open()).resolves.not.toThrow();
  });

  it("データを保存し、再取得する", async () => {
    await db.open();

    await expect(db.save({ key: key, data: data })).resolves.not.toThrow();
    const retrievedData = await db.get(key);
    expect(retrievedData).toBe(data);
  });

  it("データを保存し、削除する", async () => {
    await db.open();

    await db.save({ key: key, data: data });
    await db.delete(key);
    const retrievedData = await db.get(key);
    expect(retrievedData).toBeUndefined();
  });

  it("open エラー発生時にrejectするか", async () => {
    const mockOpen = jest.fn();
    const mockCreateObjectStore = jest.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).indexedDB = {
      open: mockOpen,
    };

    const mockResult = {
      createObjectStore: mockCreateObjectStore,
    };

    const mockRequest = {
      onerror: () => {},
      onsuccess: () => {},
      onupgradeneeded: () => {},
      result: mockResult,
    };
    mockOpen.mockReturnValue(mockRequest);

    process.nextTick(() => mockRequest.onerror());
    await expect(db.open()).rejects.toThrow();
  });

  it("save エラー発生時にrejectするか", async () => {
    const mockTransaction = jest.fn();
    const mockObjectStore = jest.fn();
    const mockPut = jest.fn();

    // IDBDatabase インスタンスのモック
    const mockDBInstance = {
      transaction: mockTransaction,
    };

    mockTransaction.mockReturnValue({
      objectStore: mockObjectStore,
    });

    mockObjectStore.mockReturnValue({
      put: mockPut,
    });

    // モックリクエスト
    const mockRequest = {
      onerror: () => {},
      onsuccess: () => {},
    };

    mockPut.mockReturnValue(mockRequest);

    // dbプロパティをモックしたIDBDatabaseインスタンスに置き換え
    const oldDb = db["db"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).db = mockDBInstance;

    // エラーハンドラをトリガ
    process.nextTick(() => mockRequest.onerror?.());
    await expect(db.save({ key, data })).rejects.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).db = oldDb;
  });

  it("get エラー発生時にrejectするか", async () => {
    const mockTransaction = jest.fn();
    const mockObjectStore = jest.fn();
    const mockGet = jest.fn();

    // IDBDatabase インスタンスのモック
    const mockDBInstance = {
      transaction: mockTransaction,
    };

    mockTransaction.mockReturnValue({
      objectStore: mockObjectStore,
    });

    mockObjectStore.mockReturnValue({
      get: mockGet,
    });

    // モックリクエスト
    const mockRequest = {
      onerror: () => {},
      onsuccess: () => {},
    };

    mockGet.mockReturnValue(mockRequest);

    // dbプロパティをモックしたIDBDatabaseインスタンスに置き換え
    const oldDb = db["db"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).db = mockDBInstance;

    // エラーハンドラをトリガ
    process.nextTick(() => mockRequest.onerror?.());
    await expect(db.get(key)).rejects.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).db = oldDb;
  });

  it("delete エラー発生時にrejectするか", async () => {
    const mockTransaction = jest.fn();
    const mockObjectStore = jest.fn();
    const mockDelete = jest.fn();

    // IDBDatabase インスタンスのモック
    const mockDBInstance = {
      transaction: mockTransaction,
    };

    mockTransaction.mockReturnValue({
      objectStore: mockObjectStore,
    });

    mockObjectStore.mockReturnValue({
      delete: mockDelete,
    });

    // モックリクエスト
    const mockRequest = {
      onerror: () => {},
      onsuccess: () => {},
    };

    mockDelete.mockReturnValue(mockRequest);

    // dbプロパティをモックしたIDBDatabaseインスタンスに置き換え
    const oldDb = db["db"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).db = mockDBInstance;

    // エラーハンドラをトリガ
    process.nextTick(() => mockRequest.onerror?.());
    await expect(db.delete(key)).rejects.toThrow();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).db = oldDb;
  });

  afterEach(() => {
    db.close();
  });
});
