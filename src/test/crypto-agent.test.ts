import { CryptoAgent } from "../crypto-agent";
import { MessageData } from "../message-validator";
import { assertNotNull } from "../utils/ts-utils";

import { mockMessageData, mockSessionStaticValue } from "./mocks/mock-utils";

describe("CryptoAgentクラス", () => {
  let cryptoAgent: CryptoAgent<MessageData>;

  beforeEach(async () => {
    cryptoAgent = assertNotNull(
      await CryptoAgent({
        keyProvider: mockSessionStaticValue,
      }),
    );

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
});
