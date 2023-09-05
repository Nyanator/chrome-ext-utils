/**
 * チャンネルを管理するマップ
 */
import { Logger } from "logger";
import "reflect-metadata";
import { injectable } from "tsyringe";
import { injectOptional } from "./utils/inject-optional";

/** 型付けされたデータと応答を持つチャンネル(継承して使用してください) */
export interface ChannelMap {
    [key: string]: {
        readonly data: unknown | undefined;
        readonly response: unknown | undefined;
    };
}

/** チャンネルデータの型 */
export type ChannelData<T extends ChannelMap, K extends keyof T> = T[K]["data"];

/** チャンネル応答の型 */
export type ChannelResponse<
    T extends ChannelMap,
    K extends keyof T,
> = T[K]["response"];

/** 型付けされたリスナー */
export type ChannelListener<T extends ChannelMap, K extends keyof T> = (
    data: ChannelData<T, K>,
) => ChannelResponse<T, K> | Promise<ChannelResponse<T, K>>;

/**  チャンネルリスナーのマップ */
export interface ChannelListenerMap<T extends ChannelMap> {
    /**
     * チャンネルを開通します。
     * @param channelMap ChannelMap
     */
    channel<K extends keyof T>(channelMap: {
        [Key in K]: ChannelListener<T, Key>;
    }): void;
    /**
     * リスナーを登録解除します。
     * @param channelKey 解除するチャンネルのキー
     * @param removeTarget 解除したいリスナー
     */
    remove<K extends keyof T>(arg: {
        channelKey: K;
        removeTarget: ChannelListener<T, keyof T>;
    }): void;

    /**
     * チャンネルに紐づく全てのリスナーを登録解除します。
     * @param channelKey 解除するチャンネルのキー
     */
    removeForChannel<K extends keyof T>(channelKey: K): void;

    /**
     * 全てのリスナーを登録解除します。
     */
    clearListeners(): void;

    /** 全てのリスナーを取得する */
    getListeners(): Map<keyof T, ChannelListener<T, keyof T>[]>;
}

@injectable()
export class ChanneListenerMapImpl<T extends ChannelMap>
    implements ChannelListenerMap<T>
{
    constructor(@injectOptional("Logger") private readonly logger?: Logger) {}
    private readonly listeners: Map<keyof T, ChannelListener<T, keyof T>[]> =
        new Map();

    channel<K extends keyof T>(channelMap: {
        [Key in K]: ChannelListener<T, Key>;
    }): void {
        for (const channelKey in channelMap) {
            if (!this.listeners.has(channelKey)) {
                this.listeners.set(channelKey, []);
            }
            const listener = channelMap[channelKey];
            const listenersArray = this.listeners.get(channelKey);
            if (listener && listenersArray) {
                listenersArray.push(
                    listener as unknown as ChannelListener<T, keyof T>,
                );
            }
        }
    }

    remove<K extends keyof T>(arg: {
        channelKey: K;
        removeTarget: ChannelListener<T, keyof T>;
    }): void {
        const listeners = this.listeners.get(arg.channelKey);
        if (!listeners) {
            return;
        }

        const index = listeners.findIndex(
            (listener) => listener === arg.removeTarget,
        );
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    removeForChannel<K extends keyof T>(channelKey: K): void {
        this.listeners.set(channelKey, []);
    }

    clearListeners(): void {
        this.listeners.clear();
    }

    getListeners(): Map<keyof T, ChannelListener<T, keyof T>[]> {
        return this.listeners;
    }
}
