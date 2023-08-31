import { MessageData } from "../..";
import { createCryptoAgent } from "../../encryption/factories";
import { CryptoAgent } from "../../encryption/interfaces";
import { SessionStaticKeyProvider } from "../../session/session-static-key-provider";
import { assertNotNull } from "../../utils/ts-utils";
import { mockMessageData } from "../mocks/mock-utils";

describe("CryptoAgentクラス", () => {
  let cryptoAgent: CryptoAgent<MessageData>;

  beforeEach(async () => {
    jest
      .spyOn(SessionStaticKeyProvider.prototype, "generateValue")
      .mockResolvedValue("");

    cryptoAgent = assertNotNull(await createCryptoAgent());

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
