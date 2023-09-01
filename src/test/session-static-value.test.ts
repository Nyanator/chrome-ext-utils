import { SessionStaticKey, SessionStaticToken } from "../session-static-value";

import * as MockUtils from "./mocks/mock-utils";

describe("SessionStaticKey", () => {
  it("generateValue 鍵を正しく生成する", async () => {
    MockUtils.initMockFetch();
    MockUtils.initChromeSession();

    const provider = new SessionStaticKey();
    // getterをカバレージのためにテストする(Uncovered Lineを残すべきではない)
    provider.getValue();
    const result = await provider.generateValue(false);

    // ランダムな鍵が発行されること
    expect(result.length).toBe(44);
    expect(result).not.toBe(await provider.generateValue(false));
  });
});

describe("SessionStaticTokenクラス", () => {
  it("generateValue トークンを正しく生成する", async () => {
    MockUtils.initChromeSession();
    await MockUtils.initMockCrypto();

    const provider = new SessionStaticToken();
    // getterをカバレージのためにテストする(Uncovered Lineを残すべきではない)
    provider.getValue();
    const result = await provider.generateValue(false);

    // ランダムなトークンが発行されること
    expect(result.length).toBe(36);
    expect(result).not.toBe(await provider.generateValue(false));
  });
});
