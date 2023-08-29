import { EventHandlerManager } from "../../element-loader/event-handler-manager";

describe("EventHandlerManager クラス", () => {
  let manager: EventHandlerManager;
  let element: HTMLElement;
  let anotherElement: HTMLElement;
  let handler: jest.Mock;
  let anotherHandler: jest.Mock;

  beforeEach(() => {
    manager = new EventHandlerManager();
    element = document.createElement("div");
    anotherElement = document.createElement("span");
    handler = jest.fn();
    anotherHandler = jest.fn();
  });

  it("要素にイベントハンドラを追加できる", () => {
    manager.addEventHandlers(
      [{ element: "testElement", events: { click: handler } }],
      { testElement: element },
    );
    element.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("すべてのイベントハンドラを削除できる", () => {
    manager.addEventHandlers(
      [{ element: "testElement", events: { click: handler } }],
      { testElement: element },
    );
    manager.removeAllEventHandlers();
    element.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it("1つの要素に対して複数のイベントタイプを処理できる", () => {
    manager.addEventHandlers(
      [
        {
          element: "testElement",
          events: { click: handler, mousedown: anotherHandler },
        },
      ],
      { testElement: element },
    );

    element.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(anotherHandler).not.toHaveBeenCalled();

    element.dispatchEvent(new Event("mousedown"));
    expect(anotherHandler).toHaveBeenCalledTimes(1);
  });

  it("複数の要素に対するイベントを処理できる", () => {
    manager.addEventHandlers(
      [
        { element: "testElement", events: { click: handler } },
        { element: "anotherTestElement", events: { click: anotherHandler } },
      ],
      { testElement: element, anotherTestElement: anotherElement },
    );

    element.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(anotherHandler).not.toHaveBeenCalled();

    anotherElement.click();
    expect(anotherHandler).toHaveBeenCalledTimes(1);
  });
});
