import { EventListenerMap } from "../event-listener-map";

describe("EventListenerMap クラス", () => {
  let map: EventListenerMap;
  let element: HTMLElement;
  let anotherElement: HTMLElement;
  let listener: jest.Mock;
  let anotherListener: jest.Mock;

  beforeEach(() => {
    map = new EventListenerMap();
    element = document.createElement("div");
    anotherElement = document.createElement("span");
    listener = jest.fn();
    anotherListener = jest.fn();
  });

  it("要素にリスナーを追加できる", () => {
    map.addListeners({
      configs: [{ element: "testElement", events: { click: listener } }],
      elementsMap: {
        testElement: element,
      },
    });
    element.click();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("すべてのリスナーを削除できる", () => {
    map.addListeners({
      configs: [{ element: "testElement", events: { click: listener } }],
      elementsMap: {
        testElement: element,
      },
    });
    map.removeAllListeners();
    element.click();
    expect(listener).not.toHaveBeenCalled();
  });

  it("1つの要素に対して複数のイベントタイプを処理できる", () => {
    map.addListeners({
      configs: [
        {
          element: "testElement",
          events: { click: listener, mousedown: anotherListener },
        },
      ],
      elementsMap: { testElement: element },
    });

    element.click();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(anotherListener).not.toHaveBeenCalled();

    element.dispatchEvent(new Event("mousedown"));
    expect(anotherListener).toHaveBeenCalledTimes(1);
  });

  it("複数の要素に対するイベントを処理できる", () => {
    map.addListeners({
      configs: [
        { element: "testElement", events: { click: listener } },
        { element: "anotherTestElement", events: { click: anotherListener } },
      ],
      elementsMap: { testElement: element, anotherTestElement: anotherElement },
    });

    element.click();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(anotherListener).not.toHaveBeenCalled();

    anotherElement.click();
    expect(anotherListener).toHaveBeenCalledTimes(1);
  });
});
