import "reflect-metadata";
import { container } from "tsyringe";
import { ChannelMap } from "../../channel-listener-map";
import { CrossDispatcher } from "../../cross-dispathcher";
import { MessageData } from "../../message-validator";
import { RuntimeMessageAgent } from "../../runtime-message-agent";
import * as DIUtils from "../../utils/di-container-utils";
import * as MockUtils from "../mocks/mock-utils";

describe("DIコンテナのユーティリティ", () => {
    it("initializeDIContainer DIコンテナに各クラスを登録します", async () => {
        DIUtils.initializeDIContainer(MockUtils.allowedOrigins);

        const runtimeMessageAgent1 = container.resolve<
            RuntimeMessageAgent<MessageData>
        >("RuntimeMessageAgent");

        const runtimeMessageAgent2 = container.resolve<
            RuntimeMessageAgent<MessageData>
        >("RuntimeMessageAgent");

        // ValidatorManagerはシングルトン
        expect(
            runtimeMessageAgent1["validatorManager"] ===
                runtimeMessageAgent2["validatorManager"],
        ).toBe(true);

        let called = false;
        const crossDispathcer1 =
            container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");
        crossDispathcer1.channel({
            channel1: () => {
                called = true;
            },
        });

        const crossDispathcer2 =
            container.resolve<CrossDispatcher<ChannelMap>>("CrossDispatcher");

        await crossDispathcer2.dispatch({
            channelKey: "channel1",
            channelData: "test",
        });
        expect(called).toBe(true);
        expect(crossDispathcer1 === crossDispathcer2);
    });
});
