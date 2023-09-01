import { Logger } from "../logger";

describe("Logger クラス", () => {
  const logger = Logger();

  it("正常に実行できる", () => {
    logger.debug("debug", "debug", "debug");
    logger.info("info", "info", "info");
    logger.warn("warn", "warn", "warn");
    logger.error("error", "error", "error");
  });
});
