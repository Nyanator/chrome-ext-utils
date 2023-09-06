import { container } from "tsyringe";

import { ConsoleInjectableLogger, Logger } from "../logger";

describe("Logger クラス", () => {
    container.registerSingleton<Logger>("Logger", ConsoleInjectableLogger);
    const logger = container.resolve<Logger>("Logger");

    it("正常に実行できる", () => {
        logger.debug("debug", "debug", "debug");
        logger.info("info", "info", "info");
        logger.warn("warn", "warn", "warn");
        logger.error("error", "error", "error");
    });
});
