/**
 * @file 暗号化クラスファクトリ関数
 */

import { AESCryptoAgent } from "../encryption/aes-crypto-agent";
import { MessageData } from "../messaging/interfaces";
import { SessionStaticKeyProvider } from "../session/session-static-key-provider";

import { CryptoAgent } from "./interfaces";

/**
 * CryptoAgentを生成します。
 * @returns CryptoAgent
 */
export const createCryptoAgent = async <T extends MessageData>(): Promise<
  CryptoAgent<T>
> => {
  const keyProvider = new SessionStaticKeyProvider();
  await keyProvider.generateValue(false);

  const cryptoAgent = new AESCryptoAgent<T>(keyProvider);
  return cryptoAgent;
};
