import { EventListenerManager } from "../../element-loader/event-listener-manager";

describe("EventListenerManager クラス", () => {
  let manager: EventListenerManager;
  let element: HTMLElement;
  let anotherElement: HTMLElement;
  let listener: jest.Mock;
  let anotherListener: jest.Mock;

  beforeEach(() => {
    manager = new EventListenerManager();
    element = document.createElement("div");
    anotherElement = document.createElement("span");
    listener = jest.fn();
    anotherListener = jest.fn();
  });

  it("要素にリスナーを追加できる", () => {
    manager.addEventListeners(
      [{ element: "testElement", events: { click: listener } }],
      {
        testElement: element,
      },
    );
    element.click();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("すべてのリスナーを削除できる", () => {
    manager.addEventListeners(
      [{ element: "testElement", events: { click: listener } }],
      {
        testElement: element,
      },
    );
    manager.removeAllEventListeners();
    element.click();
    expect(listener).not.toHaveBeenCalled();
  });

  it("1つの要素に対して複数のイベントタイプを処理できる", () => {
    manager.addEventListeners(
      [
        {
          element: "testElement",
          events: { click: listener, mousedown: anotherListener },
        },
      ],
      { testElement: element },
    );

    element.click();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(anotherListener).not.toHaveBeenCalled();

    element.dispatchEvent(new Event("mousedown"));
    expect(anotherListener).toHaveBeenCalledTimes(1);
  });

  it("複数の要素に対するイベントを処理できる", () => {
    manager.addEventListeners(
      [
        { element: "testElement", events: { click: listener } },
        { element: "anotherTestElement", events: { click: anotherListener } },
      ],
      { testElement: element, anotherTestElement: anotherElement },
    );

    element.click();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(anotherListener).not.toHaveBeenCalled();

    anotherElement.click();
    expect(anotherListener).toHaveBeenCalledTimes(1);
  });
});
