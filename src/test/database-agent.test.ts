import "fake-indexeddb/auto";

import { container } from "tsyringe";
import {
    DatabaseAgent,
    DatabaseAgentConfig,
    IndexdDBDatabaseAgent,
} from "../database-agent";

describe("DatabaseAgentクラス", () => {
    const dbName = "testDB";
    const storeName = "testStore";
    const key = "testKey";
    const data = "testData";

    let db: DatabaseAgent;
    beforeEach(async () => {
        container.clearInstances();

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

    afterEach(() => {
        db.close();
    });
});
