/**
 * 型付けされた相互通信チャンネルクラス
 */

import "reflect-metadata";

import { inject, injectable } from "tsyringe";

import {
    ChannelData,
    ChannelListener,
    ChannelListenerMap,
    ChannelMap,
    ChannelResponse,
} from "./channel-listener-map";
import { Logger } from "./logger";
import { injectOptional } from "./utils/inject-optional";

export interface CrossDispatcher<T extends ChannelMap>
    extends ChannelListenerMap<T> {
    /**
     * チャンネルに送信します。
     * @param channelKey ディスパッチするチャンネルのキー
     * @param channelData ディスパッチするチャンネルのデータ
     * @returns リスナーからの応答リスト
     */
    dispatch<K extends keyof T>(arg: {
        channelKey: K;
        channelData: ChannelData<T, K>;
    }): Promise<ChannelResponse<T, K>[]>;
}

/** 構築設定 */
export type CrossDispatcherConfig = Readonly<{
    strictMode?: boolean; // 例外安全にしたければfalse、それ以外は例外を送出します
}>;

@injectable()
export class CrossDispatcherImpl<T extends ChannelMap>
    implements CrossDispatcher<T>
{
    private readonly dispatchingChannel: Set<keyof T> = new Set();

    constructor(
        @inject("ChannelListenerMap")
        private readonly channelListenerMap: ChannelListenerMap<T>,
        @inject("Logger") private readonly logger: Logger,
        @injectOptional("CrossDispatcherConfig")
        private readonly config?: CrossDispatcherConfig,
    ) {}

    channel<K extends keyof T>(channelMap: {
        [Key in K]: ChannelListener<T, Key>;
    }): void {
        this.channelListenerMap.channel(channelMap);
    }

    async dispatch<K extends keyof T>(arg: {
        channelKey: K;
        channelData: ChannelData<T, K>;
    }): Promise<ChannelResponse<T, K>[]> {
        const listeners = this.channelListenerMap
            .getListeners()
            .get(arg.channelKey);

        // 疎結合にするためのディスパッチなのでリスナーがいない場合は空を返す
        if (!listeners) {
            this.handleError(
                `No listeners registered for channel: ${arg.channelKey.toString()}`,
            );
            return [];
        }

        const responses: ChannelResponse<T, K>[] = [];
        if (this.dispatchingChannel.has(arg.channelKey)) {
            this.handleError(
                `recursively called. Stop to prevent stack overflow. for channel: ${arg.channelKey.toString()}`,
            );
            return []; // すでに同じチャンネルが呼び出し中なので何もしない
        }
        this.dispatchingChannel.add(arg.channelKey); // チャンネルを呼び出し中としてマーク

        // 本来例外を握りつぶすべきではないが、
        // この場合疎結合性を担保するべきであり、例外処理をしないリスナーに責務がある
        try {
            for (const listener of listeners) {
                const response = listener(arg.channelData);
                if (response instanceof Promise) {
                    const result = await response;
                    responses.push(result);
                } else {
                    responses.push(response);
                }
            }
        } catch (error) {
            this.handleError(
                `Error handling channel: ${arg.channelKey.toString()}: ${error}`,
            );
        } finally {
            this.dispatchingChannel.delete(arg.channelKey); // チャンネル呼び出し終了
        }

        return responses;
    }

    remove<K extends keyof T>(arg: {
        channelKey: K;
        removeTarget: ChannelListener<T, keyof T>;
    }): void {
        this.channelListenerMap.remove({
            channelKey: arg.channelKey,
            removeTarget: arg.removeTarget,
        });
    }

    removeForChannel<K extends keyof T>(channelKey: K): void {
        this.channelListenerMap.removeForChannel(channelKey);
    }

    clearListeners(): void {
        this.channelListenerMap.clearListeners();
    }

    getListeners(): Map<keyof T, ChannelListener<T, keyof T>[]> {
        return this.channelListenerMap.getListeners();
    }

    private handleError(message: string) {
        this.logger.error(message);

        if (this.config?.strictMode !== false) {
            throw new Error(message);
        }
    }
}
