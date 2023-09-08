import typia from "typia";
import { MessageData, TypedRealMessage } from "../../message-validator";
import { RuntimeMessageAgentImpl } from "../../runtime-message-agent";
import { ValidationMethods } from "../../utils/validate-method";
import { WindowMessageAgentImpl } from "../../window-message-agent";
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
/** RuntimeMessageAgentImplのバリデータ */
export const runtimeMessageAgentImplValidators: Record<string, ValidationMethods> = {};
runtimeMessageAgentImplValidators.sendMessage = {
  argsValidator: (input: any): Parameters<RuntimeMessageAgentImpl["sendMessage"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<RuntimeMessageAgentImpl["sendMessage"]> => {
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        (undefined === input.channel || "string" === typeof input.channel) &&
        "object" === typeof input.message &&
        null !== input.message &&
        $io1(input.message, true && _exceptionable) &&
        (undefined === input.tabId || "number" === typeof input.tabId) &&
        (1 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (["channel", "message", "tabId"].some((prop: any) => key === prop))
              return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      const $io1 = (input: any, _exceptionable: boolean = true): boolean =>
        "string" === typeof input.runtimeId &&
        "string" === typeof input.message &&
        (2 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (["runtimeId", "message"].some((prop: any) => key === prop)) return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      return (
        Array.isArray(input) &&
        input.length === 1 &&
        "object" === typeof input[0] &&
        null !== input[0] &&
        $io0(input[0], true)
      );
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<RuntimeMessageAgentImpl["sendMessage"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        const $join = (typia.createAssertEquals as any).join;
        const $ao0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          (undefined === input.channel ||
            "string" === typeof input.channel ||
            $guard(_exceptionable, {
              path: _path + ".channel",
              expected: "(string | undefined)",
              value: input.channel,
            })) &&
          (((("object" === typeof input.message && null !== input.message) ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "MessageData",
              value: input.message,
            })) &&
            $ao1(input.message, _path + ".message", true && _exceptionable)) ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "MessageData",
              value: input.message,
            })) &&
          (undefined === input.tabId ||
            "number" === typeof input.tabId ||
            $guard(_exceptionable, {
              path: _path + ".tabId",
              expected: "(number | undefined)",
              value: input.tabId,
            })) &&
          (1 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (["channel", "message", "tabId"].some((prop: any) => key === prop))
                return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        const $ao1 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          ("string" === typeof input.runtimeId ||
            $guard(_exceptionable, {
              path: _path + ".runtimeId",
              expected: "string",
              value: input.runtimeId,
            })) &&
          ("string" === typeof input.message ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "string",
              value: input.message,
            })) &&
          (2 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (["runtimeId", "message"].some((prop: any) => key === prop)) return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected:
                "[arg: { channel?: string | undefined; message: MessageData; tabId?: number | undefined; }]",
              value: input,
            })) &&
            (input.length === 1 ||
              $guard(true, {
                path: _path + "",
                expected: "[__type]",
                value: input,
              })) &&
            (((("object" === typeof input[0] && null !== input[0]) ||
              $guard(true, {
                path: _path + "[0]",
                expected: "__type",
                value: input[0],
              })) &&
              $ao0(input[0], _path + "[0]", true)) ||
              $guard(true, {
                path: _path + "[0]",
                expected: "__type",
                value: input[0],
              }))) ||
          $guard(true, {
            path: _path + "",
            expected:
              "[arg: { channel?: string | undefined; message: MessageData; tabId?: number | undefined; }]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (
    input: any,
  ): Awaited<ReturnType<RuntimeMessageAgentImpl["sendMessage"]>> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Awaited<ReturnType<RuntimeMessageAgentImpl["sendMessage"]>> => {
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        "string" === typeof input.runtimeId &&
        "string" === typeof input.message &&
        (2 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (["runtimeId", "message"].some((prop: any) => key === prop)) return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      return (
        undefined === input ||
        ("object" === typeof input && null !== input && $io0(input, true))
      );
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Awaited<ReturnType<RuntimeMessageAgentImpl["sendMessage"]>> => {
        const $guard = (typia.createAssertEquals as any).guard;
        const $join = (typia.createAssertEquals as any).join;
        const $ao0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          ("string" === typeof input.runtimeId ||
            $guard(_exceptionable, {
              path: _path + ".runtimeId",
              expected: "string",
              value: input.runtimeId,
            })) &&
          ("string" === typeof input.message ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "string",
              value: input.message,
            })) &&
          (2 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (["runtimeId", "message"].some((prop: any) => key === prop)) return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        return (
          undefined === input ||
          ((("object" === typeof input && null !== input) ||
            $guard(true, {
              path: _path + "",
              expected: "(MessageData | undefined)",
              value: input,
            })) &&
            $ao0(input, _path + "", true)) ||
          $guard(true, {
            path: _path + "",
            expected: "(MessageData | undefined)",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
};
runtimeMessageAgentImplValidators.addListener = {
  argsValidator: (input: any): Parameters<RuntimeMessageAgentImpl["addListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<RuntimeMessageAgentImpl["addListener"]> => {
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        (undefined === input.channel || "string" === typeof input.channel) &&
        true &&
        (1 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (["channel", "listener"].some((prop: any) => key === prop)) return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      return (
        Array.isArray(input) &&
        input.length === 1 &&
        "object" === typeof input[0] &&
        null !== input[0] &&
        $io0(input[0], true)
      );
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<RuntimeMessageAgentImpl["addListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        const $join = (typia.createAssertEquals as any).join;
        const $ao0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          (undefined === input.channel ||
            "string" === typeof input.channel ||
            $guard(_exceptionable, {
              path: _path + ".channel",
              expected: "(string | undefined)",
              value: input.channel,
            })) &&
          (true ||
            $guard(_exceptionable, {
              path: _path + ".listener",
              expected: "unknown",
              value: input.listener,
            })) &&
          (1 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (["channel", "listener"].some((prop: any) => key === prop)) return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected:
                "[arg: { channel?: string | undefined; listener: (messageData: MessageData) => Promise<void | MessageData>; }]",
              value: input,
            })) &&
            (input.length === 1 ||
              $guard(true, {
                path: _path + "",
                expected: "[__type]",
                value: input,
              })) &&
            (((("object" === typeof input[0] && null !== input[0]) ||
              $guard(true, {
                path: _path + "[0]",
                expected: "__type",
                value: input[0],
              })) &&
              $ao0(input[0], _path + "[0]", true)) ||
              $guard(true, {
                path: _path + "[0]",
                expected: "__type",
                value: input[0],
              }))) ||
          $guard(true, {
            path: _path + "",
            expected:
              "[arg: { channel?: string | undefined; listener: (messageData: MessageData) => Promise<void | MessageData>; }]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (input: any): ReturnType<RuntimeMessageAgentImpl["addListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is ReturnType<RuntimeMessageAgentImpl["addListener"]> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is ReturnType<RuntimeMessageAgentImpl["addListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
};
runtimeMessageAgentImplValidators.removeListener = {
  argsValidator: (input: any): Parameters<RuntimeMessageAgentImpl["removeListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<RuntimeMessageAgentImpl["removeListener"]> => {
      return Array.isArray(input) && input.length === 1 && true;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<RuntimeMessageAgentImpl["removeListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected:
                "[listener: (messageData: MessageData) => Promise<void | MessageData>]",
              value: input,
            })) &&
            (input.length === 1 ||
              $guard(true, {
                path: _path + "",
                expected: "[unknown]",
                value: input,
              })) &&
            (true ||
              $guard(true, {
                path: _path + "[0]",
                expected: "unknown",
                value: input[0],
              }))) ||
          $guard(true, {
            path: _path + "",
            expected:
              "[listener: (messageData: MessageData) => Promise<void | MessageData>]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (
    input: any,
  ): ReturnType<RuntimeMessageAgentImpl["removeListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is ReturnType<RuntimeMessageAgentImpl["removeListener"]> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is ReturnType<RuntimeMessageAgentImpl["removeListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
};
runtimeMessageAgentImplValidators.clearListeners = {
  argsValidator: (input: any): Parameters<RuntimeMessageAgentImpl["clearListeners"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<RuntimeMessageAgentImpl["clearListeners"]> => {
      return Array.isArray(input) && input.length === 0;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<RuntimeMessageAgentImpl["clearListeners"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected: "[]",
              value: input,
            })) &&
            (input.length === 0 ||
              $guard(true, {
                path: _path + "",
                expected: "[]",
                value: input,
              }))) ||
          $guard(true, {
            path: _path + "",
            expected: "[]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (
    input: any,
  ): ReturnType<RuntimeMessageAgentImpl["clearListeners"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is ReturnType<RuntimeMessageAgentImpl["clearListeners"]> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is ReturnType<RuntimeMessageAgentImpl["clearListeners"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
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
  argsValidator: (input: any): OverriddenPostMessageArgs => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is OverriddenPostMessageArgs => {
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        true &&
        (undefined === input.channel || "string" === typeof input.channel) &&
        "string" === typeof input.targetOrigin &&
        "object" === typeof input.message &&
        null !== input.message &&
        $io1(input.message, true && _exceptionable) &&
        (3 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (
              ["target", "channel", "targetOrigin", "message"].some(
                (prop: any) => key === prop,
              )
            )
              return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      const $io1 = (input: any, _exceptionable: boolean = true): boolean =>
        "string" === typeof input.runtimeId &&
        "string" === typeof input.message &&
        (2 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (["runtimeId", "message"].some((prop: any) => key === prop)) return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      return (
        Array.isArray(input) &&
        input.length === 1 &&
        "object" === typeof input[0] &&
        null !== input[0] &&
        $io0(input[0], true)
      );
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is OverriddenPostMessageArgs => {
        const $guard = (typia.createAssertEquals as any).guard;
        const $join = (typia.createAssertEquals as any).join;
        const $ao0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          true &&
          (undefined === input.channel ||
            "string" === typeof input.channel ||
            $guard(_exceptionable, {
              path: _path + ".channel",
              expected: "(string | undefined)",
              value: input.channel,
            })) &&
          ("string" === typeof input.targetOrigin ||
            $guard(_exceptionable, {
              path: _path + ".targetOrigin",
              expected: "string",
              value: input.targetOrigin,
            })) &&
          (((("object" === typeof input.message && null !== input.message) ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "MessageData",
              value: input.message,
            })) &&
            $ao1(input.message, _path + ".message", true && _exceptionable)) ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "MessageData",
              value: input.message,
            })) &&
          (3 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (
                ["target", "channel", "targetOrigin", "message"].some(
                  (prop: any) => key === prop,
                )
              )
                return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        const $ao1 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          ("string" === typeof input.runtimeId ||
            $guard(_exceptionable, {
              path: _path + ".runtimeId",
              expected: "string",
              value: input.runtimeId,
            })) &&
          ("string" === typeof input.message ||
            $guard(_exceptionable, {
              path: _path + ".message",
              expected: "string",
              value: input.message,
            })) &&
          (2 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (["runtimeId", "message"].some((prop: any) => key === prop)) return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected: "OverriddenPostMessageArgs",
              value: input,
            })) &&
            (input.length === 1 ||
              $guard(true, {
                path: _path + "",
                expected:
                  '[{ target: unknown; } & Omit<{ target: Window; channel?: string | undefined; targetOrigin: string; message: MessageData; }, "target">]',
                value: input,
              })) &&
            (((("object" === typeof input[0] && null !== input[0]) ||
              $guard(true, {
                path: _path + "[0]",
                expected:
                  '{ target: unknown; } & Omit<{ target: Window; channel?: string | undefined; targetOrigin: string; message: MessageData; }, "target">',
                value: input[0],
              })) &&
              $ao0(input[0], _path + "[0]", true)) ||
              $guard(true, {
                path: _path + "[0]",
                expected:
                  '{ target: unknown; } & Omit<{ target: Window; channel?: string | undefined; targetOrigin: string; message: MessageData; }, "target">',
                value: input[0],
              }))) ||
          $guard(true, {
            path: _path + "",
            expected: "OverriddenPostMessageArgs",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (
    input: any,
  ): Awaited<ReturnType<WindowMessageAgentImpl["postMessage"]>> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Awaited<ReturnType<WindowMessageAgentImpl["postMessage"]>> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Awaited<ReturnType<WindowMessageAgentImpl["postMessage"]>> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
};
windowMessageAgentImplValidators.addListener = {
  argsValidator: (input: any): Parameters<WindowMessageAgentImpl["addListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<WindowMessageAgentImpl["addListener"]> => {
      const $io0 = (input: any, _exceptionable: boolean = true): boolean =>
        (undefined === input.channel || "string" === typeof input.channel) &&
        true &&
        (1 === Object.keys(input).length ||
          Object.keys(input).every((key: any) => {
            if (["channel", "listener"].some((prop: any) => key === prop)) return true;
            const value = input[key];
            if (undefined === value) return true;
            return false;
          }));
      return (
        Array.isArray(input) &&
        input.length === 1 &&
        "object" === typeof input[0] &&
        null !== input[0] &&
        $io0(input[0], true)
      );
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<WindowMessageAgentImpl["addListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        const $join = (typia.createAssertEquals as any).join;
        const $ao0 = (
          input: any,
          _path: string,
          _exceptionable: boolean = true,
        ): boolean =>
          (undefined === input.channel ||
            "string" === typeof input.channel ||
            $guard(_exceptionable, {
              path: _path + ".channel",
              expected: "(string | undefined)",
              value: input.channel,
            })) &&
          (true ||
            $guard(_exceptionable, {
              path: _path + ".listener",
              expected: "unknown",
              value: input.listener,
            })) &&
          (1 === Object.keys(input).length ||
            false === _exceptionable ||
            Object.keys(input).every((key: any) => {
              if (["channel", "listener"].some((prop: any) => key === prop)) return true;
              const value = input[key];
              if (undefined === value) return true;
              return $guard(_exceptionable, {
                path: _path + $join(key),
                expected: "undefined",
                value: value,
              });
            }));
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected:
                "[arg: { channel?: string | undefined; listener: (event: MessageData) => void; }]",
              value: input,
            })) &&
            (input.length === 1 ||
              $guard(true, {
                path: _path + "",
                expected: "[__type]",
                value: input,
              })) &&
            (((("object" === typeof input[0] && null !== input[0]) ||
              $guard(true, {
                path: _path + "[0]",
                expected: "__type",
                value: input[0],
              })) &&
              $ao0(input[0], _path + "[0]", true)) ||
              $guard(true, {
                path: _path + "[0]",
                expected: "__type",
                value: input[0],
              }))) ||
          $guard(true, {
            path: _path + "",
            expected:
              "[arg: { channel?: string | undefined; listener: (event: MessageData) => void; }]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (input: any): ReturnType<WindowMessageAgentImpl["addListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is ReturnType<WindowMessageAgentImpl["addListener"]> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is ReturnType<WindowMessageAgentImpl["addListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
};
windowMessageAgentImplValidators.removeListener = {
  argsValidator: (input: any): Parameters<WindowMessageAgentImpl["removeListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<WindowMessageAgentImpl["removeListener"]> => {
      return Array.isArray(input) && input.length === 1 && true;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<WindowMessageAgentImpl["removeListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected: "[listener: (event: MessageData) => void]",
              value: input,
            })) &&
            (input.length === 1 ||
              $guard(true, {
                path: _path + "",
                expected: "[unknown]",
                value: input,
              })) &&
            (true ||
              $guard(true, {
                path: _path + "[0]",
                expected: "unknown",
                value: input[0],
              }))) ||
          $guard(true, {
            path: _path + "",
            expected: "[listener: (event: MessageData) => void]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (input: any): ReturnType<WindowMessageAgentImpl["removeListener"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is ReturnType<WindowMessageAgentImpl["removeListener"]> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is ReturnType<WindowMessageAgentImpl["removeListener"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
};
windowMessageAgentImplValidators.clearListeners = {
  argsValidator: (input: any): Parameters<WindowMessageAgentImpl["clearListeners"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is Parameters<WindowMessageAgentImpl["clearListeners"]> => {
      return Array.isArray(input) && input.length === 0;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is Parameters<WindowMessageAgentImpl["clearListeners"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          ((Array.isArray(input) ||
            $guard(true, {
              path: _path + "",
              expected: "[]",
              value: input,
            })) &&
            (input.length === 0 ||
              $guard(true, {
                path: _path + "",
                expected: "[]",
                value: input,
              }))) ||
          $guard(true, {
            path: _path + "",
            expected: "[]",
            value: input,
          })
        );
      })(input, "$input", true);
    return input;
  },
  resultValidator: (input: any): ReturnType<WindowMessageAgentImpl["clearListeners"]> => {
    const __is = (
      input: any,
      _exceptionable: boolean = true,
    ): input is ReturnType<WindowMessageAgentImpl["clearListeners"]> => {
      return null !== input && undefined === input;
    };
    if (false === __is(input))
      ((
        input: any,
        _path: string,
        _exceptionable: boolean = true,
      ): input is ReturnType<WindowMessageAgentImpl["clearListeners"]> => {
        const $guard = (typia.createAssertEquals as any).guard;
        return (
          (null !== input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            })) &&
          (undefined === input ||
            $guard(true, {
              path: _path + "",
              expected: "undefined",
              value: input,
            }))
        );
      })(input, "$input", true);
    return input;
  },
};
