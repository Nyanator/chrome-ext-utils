import { createLogger } from "../../logger/factories";

describe("ConsoleLogger クラス", () => {
  const logger = createLogger();

  it("正常に実行できる", () => {
    logger.debug("debug", "debug", "debug");
    logger.info("info", "info", "info");
    logger.warn("warn", "warn", "warn");
    logger.error("error", "error", "error");
  });
});
