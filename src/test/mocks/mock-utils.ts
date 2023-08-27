import {
  CryptoAgent,
  MessageDataObject,
  SessionStaticKeyProvider,
  SessionStaticTokenProvider,
} from "../../";

export const runtimeId = "runtimeId";
export const invalidRuntimeId = "invalidRuntimeId";
export const message = "message";
export const token = "providedValue";
export const invalidToken = "invalidToken";
export const provideVedalue = "providedValue";
export const allowedOrigins = ["origin1", "orgin2"];
export const invalidOrigin = "invalidOrigin";
export const invalidStructureMessage = {};

export const mockCryptoAgent = {
  getProvider: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn(),
};

export const mockMessageAgent = {
  postWindowMessage: jest.fn(),
  sendRuntimeMessage: jest.fn(),
  windowMessageListener: jest.fn(),
  runtimeMessageListener: jest.fn(),
  removeWindowMessageListener: jest.fn(),
  removeRuntimeMessageListener: jest.fn(),
};

export const mockMessageDataObject = {
  runtimeId: runtimeId,
  message: message,
};

export const mockInvalidRuntimeIdMessageDataObject = {
  runtimeId: invalidRuntimeId,
  message: message,
};

export const mockMessageValidatorManager = {
  validationProcess: jest.fn(),
  refreshValidator: jest.fn(),
  getValidators: jest.fn(),
};

export const mockValidatorConfig = {
  runtimeId: runtimeId,
  allowedOrigins: allowedOrigins,
};

export const mockSessionStaticValueProvider = {
  getValue: jest.fn().mockReturnValue(provideVedalue),
  generateValue: jest.fn().mockReturnValue(provideVedalue),
};

export const mockMessageValidator = {
  getConfig: jest.fn().mockReturnValue(mockValidatorConfig),
  getProvider: jest.fn().mockReturnValue(mockSessionStaticValueProvider),
  getCryptoAgent: jest.fn().mockReturnValue(mockCryptoAgent),
  isValid: jest.fn(),
};

export const rawValidMessage = {
  token: token,
  messageData: `{
    "runtimeId": "${runtimeId}",
    "message": "${message}"
  }`,
};

export const createMockValidMessage = <T extends MessageDataObject>(
  cryptoAgent: CryptoAgent<T>,
) => {
  return {
    token: token,
    messageData: cryptoAgent.encrypt(mockMessageDataObject as T),
  };
};

export const createMockInvalidTokenMessage = <T extends MessageDataObject>(
  cryptoAgent: CryptoAgent<T>,
) => {
  return {
    token: invalidToken,
    messageData: cryptoAgent.encrypt(mockMessageDataObject as T),
  };
};

export const createMockInvalidRuntimeIdMessage = <T extends MessageDataObject>(
  cryptoAgent: CryptoAgent<T>,
) => {
  return {
    token: token,
    messageData: cryptoAgent.encrypt(
      mockInvalidRuntimeIdMessageDataObject as T,
    ),
  };
};

export const initMockCrypto = async () => {
  // Node.jsのcryptoモジュールをインポート
  const nodeCrypto = await import("crypto");

  // windowのcryptoオブジェクトにrandomUUIDをモックする
  Object.defineProperty(window, "crypto", {
    value: {
      randomUUID: jest.fn().mockImplementation(() => nodeCrypto.randomUUID()),
    },
  });
};

export const initMockFetch = () => {
  global.fetch = jest.fn().mockResolvedValue({
    text: jest.fn().mockResolvedValue("fetchedText"),
  });
};

export const initChromeSession = () => {
  // sessionのモックjest-chromeが未対応なためオブジェクトから構築
  global.chrome.storage.session = {
    set: jest.fn(),
    get: jest.fn().mockReturnValue({ key: provideVedalue }),
    setAccessLevel: jest.fn(),
  } as unknown as chrome.storage.SessionStorageArea;
};

export const mockAllSessionValues = () => {
  jest
    .spyOn(SessionStaticKeyProvider.prototype, "generateValue")
    .mockResolvedValue(provideVedalue);

  jest
    .spyOn(SessionStaticKeyProvider.prototype, "getValue")
    .mockReturnValue(provideVedalue);

  jest
    .spyOn(SessionStaticTokenProvider.prototype, "generateValue")
    .mockResolvedValue(token);

  jest
    .spyOn(SessionStaticTokenProvider.prototype, "getValue")
    .mockReturnValue(token);
};
