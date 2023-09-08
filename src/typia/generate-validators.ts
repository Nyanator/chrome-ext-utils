import typia from "typia";

import { MessageData, TypedRealMessage } from "../message-validator";
import { RuntimeMessageAgentImpl } from "../runtime-message-agent";
import { ValidationMethods } from "../utils/validate-method";
import { WindowMessageAgentImpl } from "../window-message-agent";

export const equalsTypedRealMessage = typia.createEquals<TypedRealMessage>();

export const isMessageDataParse = typia.json.createIsParse<MessageData>();
export const isMessageDataStringfy = typia.json.createIsStringify<MessageData>();

/** RuntimeMessageAgentImplのバリデータ */
export const runtimeMessageAgentImplValidators: Record<string, ValidationMethods> = {};
runtimeMessageAgentImplValidators.sendMessage = {
  argsValidator:
    typia.createAssertEquals<Parameters<RuntimeMessageAgentImpl["sendMessage"]>>(),
  resultValidator:
    typia.createAssertEquals<
      Awaited<ReturnType<RuntimeMessageAgentImpl["sendMessage"]>>
    >(),
};

runtimeMessageAgentImplValidators.addListener = {
  argsValidator:
    typia.createAssertEquals<Parameters<RuntimeMessageAgentImpl["addListener"]>>(),
  resultValidator:
    typia.createAssertEquals<ReturnType<RuntimeMessageAgentImpl["addListener"]>>(),
};

runtimeMessageAgentImplValidators.removeListener = {
  argsValidator:
    typia.createAssertEquals<Parameters<RuntimeMessageAgentImpl["removeListener"]>>(),
  resultValidator:
    typia.createAssertEquals<ReturnType<RuntimeMessageAgentImpl["removeListener"]>>(),
};

runtimeMessageAgentImplValidators.clearListeners = {
  argsValidator:
    typia.createAssertEquals<Parameters<RuntimeMessageAgentImpl["clearListeners"]>>(),
  resultValidator:
    typia.createAssertEquals<ReturnType<RuntimeMessageAgentImpl["clearListeners"]>>(),
};

/** WindowMessageAgentImplのバリデータ */
export const windowMessageAgentImplValidators: Record<string, ValidationMethods> = {};
type PostMessageArgs = Parameters<WindowMessageAgentImpl["postMessage"]>;
// Windowを正確にバリデーションしようとすると膨大な量のプロパティを比較する必要がある
// ブラウザ環境での型定義とテスト時の型が同じ保証もないのでWindowの検証はスキップする
type OverriddenPostMessageArgs = [
  {
    target: unknown;
  } & Omit<PostMessageArgs[0], "target">,
];
windowMessageAgentImplValidators.postMessage = {
  argsValidator: typia.createAssertEquals<OverriddenPostMessageArgs>(),
  resultValidator:
    typia.createAssertEquals<
      Awaited<ReturnType<WindowMessageAgentImpl["postMessage"]>>
    >(),
};

windowMessageAgentImplValidators.addListener = {
  argsValidator:
    typia.createAssertEquals<Parameters<WindowMessageAgentImpl["addListener"]>>(),
  resultValidator:
    typia.createAssertEquals<ReturnType<WindowMessageAgentImpl["addListener"]>>(),
};

windowMessageAgentImplValidators.removeListener = {
  argsValidator:
    typia.createAssertEquals<Parameters<WindowMessageAgentImpl["removeListener"]>>(),
  resultValidator:
    typia.createAssertEquals<ReturnType<WindowMessageAgentImpl["removeListener"]>>(),
};

windowMessageAgentImplValidators.clearListeners = {
  argsValidator:
    typia.createAssertEquals<Parameters<WindowMessageAgentImpl["clearListeners"]>>(),
  resultValidator:
    typia.createAssertEquals<ReturnType<WindowMessageAgentImpl["clearListeners"]>>(),
};
