import "fake-indexeddb/auto";

import { DatabaseAgent, createDatabaseAgent } from "../../";

describe("IndexdDBDatabaseAgentクラス", () => {
  const dbName = "testDB";
  const storeName = "testStore";
  const key = "testKey";
  const data = "testData";

  let db: DatabaseAgent;
  beforeEach(async () => {
    db = createDatabaseAgent(dbName, storeName);
  });

  it("データベースが正常に開けるか", async () => {
    await expect(db.open()).resolves.not.toThrow();
  });

  it("データを保存し、再取得する", async () => {
    await db.open();

    await expect(db.save(key, data)).resolves.not.toThrow();
    const retrievedData = await db.get(key);
    expect(retrievedData).toBe(data);
  });

  it("データを保存し、削除する", async () => {
    await db.open();

    await db.save(key, data);
    await db.delete(key);
    const retrievedData = await db.get(key);
    expect(retrievedData).toBeUndefined();
  });

  afterEach(() => {
    db.close();
  });
});
