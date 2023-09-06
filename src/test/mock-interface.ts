import { ChannelMap } from "../channel-listener-map";

export interface TestInterface {
  value: number;
}

export type TestType = {
  value: number;
};

export interface TestChannelMap extends ChannelMap {
  channel1: {
    readonly data: number;
    readonly response: number;
  };
  channel2: {
    readonly data: string;
    readonly response: string;
  };
  channel3: {
    readonly data: Map<string, string>;
    readonly response: Map<string, string>;
  };
  channel4: {
    readonly data: TestInterface;
    readonly response: TestInterface;
  };
  channel5: {
    readonly data: TestType;
    readonly response: TestType;
  };
  channel6: {
    readonly data: Record<string, number>;
    readonly response: Record<string, number>;
  };
  channel7: {
    readonly data: undefined;
    readonly response: undefined;
  };
  channel8: {
    readonly data: unknown;
    readonly response: unknown;
  };
  channel9: {
    readonly data: null;
    readonly response: null;
  };
  channel10: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly data: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly response: any;
  };
}
