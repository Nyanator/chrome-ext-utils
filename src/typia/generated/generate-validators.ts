import typia from "typia";
import { MessageData, TypedRealMessage } from "../../message-validator";
export const equalsTypedRealMessage = (input: any, _exceptionable: boolean = true): input is TypedRealMessage => {
    const $io0 = (input: any, _exceptionable: boolean = true): boolean => "string" === typeof input.token && "string" === typeof input.channel && "string" === typeof input.messageData && (3 === Object.keys(input).length || Object.keys(input).every((key: any) => {
        if (["token", "channel", "messageData"].some((prop: any) => key === prop))
            return true;
        const value = input[key];
        if (undefined === value)
            return true;
        return false;
    }));
    return "object" === typeof input && null !== input && $io0(input, true);
};
export const isMessageDataParse = (input: any): typia.Primitive<MessageData> => { const is = (input: any): input is MessageData => {
    const $io0 = (input: any): boolean => (undefined === input.runtimeId || "string" === typeof input.runtimeId) && (undefined === input.key || "string" === typeof input.key) && (undefined === input.message || "string" === typeof input.message);
    return "object" === typeof input && null !== input && false === Array.isArray(input) && $io0(input);
}; input = JSON.parse(input); return is(input) ? input as any : null; };
export const isMessageDataStringfy = (input: MessageData): string | null => { const is = (input: any): input is MessageData => {
    const $io0 = (input: any): boolean => (undefined === input.runtimeId || "string" === typeof input.runtimeId) && (undefined === input.key || "string" === typeof input.key) && (undefined === input.message || "string" === typeof input.message);
    return "object" === typeof input && null !== input && false === Array.isArray(input) && $io0(input);
}; const stringify = (input: MessageData): string => {
    const $string = (typia.json.createIsStringify as any).string;
    const $tail = (typia.json.createIsStringify as any).tail;
    const $so0 = (input: any): any => `{${$tail(`${undefined === input.runtimeId ? "" : `"runtimeId":${undefined !== input.runtimeId ? $string(input.runtimeId) : undefined},`}${undefined === input.key ? "" : `"key":${undefined !== input.key ? $string(input.key) : undefined},`}${undefined === input.message ? "" : `"message":${undefined !== input.message ? $string(input.message) : undefined}`}`)}}`;
    return $so0(input);
}; return is(input) ? stringify(input) : null; };
