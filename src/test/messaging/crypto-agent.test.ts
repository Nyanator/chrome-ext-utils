import {
  CryptoAgent,
  MessageDataObject,
  SessionStaticKeyProvider,
  createCryptoAgent,
} from "../../";
import { assertNotNull } from "../../utils/ts-utils";
import { mockMessageDataObject } from "../mocks/mock-utils";

describe("CryptoAgentクラス", () => {
  let cryptoAgent: CryptoAgent<MessageDataObject>;

  beforeEach(async () => {
    jest
      .spyOn(SessionStaticKeyProvider.prototype, "generateValue")
      .mockResolvedValue("");

    cryptoAgent = assertNotNull(await createCryptoAgent());

    // getterをカバレージのためにテストする(Uncovered Lineを残すべきではない)
    cryptoAgent.getProvider();
  });

  it("メッセージデータを暗号化し、再度複合化する。", () => {
    const encryptedData = cryptoAgent.encrypt(mockMessageDataObject);

    // 暗号化した結果が元のデータと等しくない
    expect(encryptedData).not.toEqual(mockMessageDataObject);

    const decryptedData = cryptoAgent.decrypt(encryptedData);

    // 復号化した結果が元のデータと等しい
    expect(decryptedData).toEqual(mockMessageDataObject);
  });
});
