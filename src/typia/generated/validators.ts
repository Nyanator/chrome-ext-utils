/**
 * ランタイムバリデータtypiaのジェネレータ定義。
 * テストをSWCでビルドしているためGenerationにしか対応していない。
 * typiaが出力するコードがeslintに引っかかるため警告を強制的に抑止している。
 */
/* eslint-disable */
import typia from "typia";
import { MessageData, TypedRealMessage } from "../../message-validator";
export const equalsTypedRealMessage = (
  input: any,
  _exceptionable: boolean = true,
): input is TypedRealMessage => {
  const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
    "string" === typeof input.token &&
    (undefined === input.channel || "string" === typeof input.channel) &&
    "string" === typeof input.messageData &&
    (2 === Object.keys(input).length ||
      Object.keys(input).every((key: any) => {
        if (["token", "channel", "messageData"].some((prop: any) => key === prop))
          return true;
        const value = input[key];
        if (undefined === value) return true;
        return false;
      }));
  return "object" === typeof input && null !== input && $io0(input, true);
};
export const isMessageDataParse = (input: any): typia.Primitive<MessageData> => {
  const is = (input: any): input is MessageData => {
    return (
      "object" === typeof input &&
      null !== input &&
      "string" === typeof (input as any).runtimeId &&
      "string" === typeof (input as any).message
    );
  };
  input = JSON.parse(input);
  return is(input) ? (input as any) : null;
};
export const isMessageDataStringfy = (input: MessageData): string | null => {
  const is = (input: any): input is MessageData => {
    return (
      "object" === typeof input &&
      null !== input &&
      "string" === typeof (input as any).runtimeId &&
      "string" === typeof (input as any).message
    );
  };
  const stringify = (input: MessageData): string => {
    const $string = (typia.json.createIsStringify as any).string;
    return `{"runtimeId":${$string((input as any).runtimeId)},"message":${$string(
      (input as any).message,
    )}}`;
  };
  return is(input) ? stringify(input) : null;
};
/* eslint-enable */
