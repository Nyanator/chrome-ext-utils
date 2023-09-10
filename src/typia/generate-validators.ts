import typia from "typia";

import { MessageData, TypedRealMessage } from "../message-validator";

export const equalsTypedRealMessage = typia.createEquals<TypedRealMessage>();

export const isMessageDataParse = typia.json.createIsParse<MessageData>();
export const isMessageDataStringfy = typia.json.createIsStringify<MessageData>();
