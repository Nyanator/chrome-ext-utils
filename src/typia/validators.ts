/**
 * ランタイムバリデータtypiaのジェネレータ定義。
 * テストをSWCでビルドしているためGenerationにしか対応していない。
 * typiaが出力するコードがeslintに引っかかるため警告を強制的に抑止している。
 */

/* eslint-disable */
import typia from "typia";

import { MessageData, TypedRealMessage } from "../message-validator";

export const equalsTypedRealMessage = typia.createEquals<TypedRealMessage>();

export const isMessageDataParse = typia.json.createIsParse<MessageData>();
export const isMessageDataStringfy = typia.json.createIsStringify<MessageData>();
/* eslint-enable */
