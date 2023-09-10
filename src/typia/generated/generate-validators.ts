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
    const $io0 = (input: any): boolean => "string" === typeof input.runtimeId && (undefined === input.key || "string" === typeof input.key) && "string" === typeof input.message;
    return "object" === typeof input && null !== input && $io0(input);
}; input = JSON.parse(input); return is(input) ? input as any : null; };
export const isMessageDataStringfy = (input: MessageData): string | null => { const is = (input: any): input is MessageData => {
    const $io0 = (input: any): boolean => "string" === typeof input.runtimeId && (undefined === input.key || "string" === typeof input.key) && "string" === typeof input.message;
    return "object" === typeof input && null !== input && $io0(input);
}; const stringify = (input: MessageData): string => {
    const $string = (typia.json.createIsStringify as any).string;
    const $so0 = (input: any): any => `{${undefined === input.key ? "" : `"key":${undefined !== input.key ? $string(input.key) : undefined},`}"runtimeId":${$string(input.runtimeId)},"message":${$string(input.message)}}`;
    return $so0(input);
}; return is(input) ? stringify(input) : null; };
