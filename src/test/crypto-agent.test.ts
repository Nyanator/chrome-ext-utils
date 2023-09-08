import { container } from "tsyringe";

import { AESCryptoAgent, CryptoAgent } from "../crypto-agent";
import { MessageData } from "../message-validator";
import { SessionStaticKey } from "../session-static-value";
import * as typiaValidators from "../typia/generated/generate-validators";

import {
  initChromeSession,
  initMockCrypto,
  initMockFetch,
  mockMessageData,
} from "./mocks/mock-utils";

describe("CryptoAgentクラス", () => {
  let cryptoAgent: CryptoAgent<MessageData>;

  beforeEach(async () => {
    initMockCrypto();
    initChromeSession();
    initMockFetch();

    container.clearInstances();

    container.register("SessionStaticKey", {
      useClass: SessionStaticKey,
    });

    container.register<CryptoAgent<MessageData>>("CryptoAgent", {
      useClass: AESCryptoAgent,
    });

    cryptoAgent = container.resolve<CryptoAgent<MessageData>>("CryptoAgent");
    await cryptoAgent.getProvider().generateValue(true);

    // getterをカバレージのためにテストする(Uncovered Lineを残すべきではない)
    cryptoAgent.getProvider();
  });

  it("メッセージデータを暗号化し、再度複合化する。", () => {
    const encryptedData = cryptoAgent.encrypt(mockMessageData);

    // 暗号化した結果が元のデータと等しくない
    expect(encryptedData).not.toEqual(mockMessageData);

    const decryptedData = cryptoAgent.decrypt(encryptedData);

    // 復号化した結果が元のデータと等しい
    expect(decryptedData).toEqual(mockMessageData);
  });

  it("メッセージデータを暗号化する際にstringfyに失敗すると例外が発生する。", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(typiaValidators, "isMessageDataStringfy").mockReturnValueOnce(null);

    expect(() => {
      cryptoAgent.encrypt(mockMessageData);
    }).toThrow();
  });
});
