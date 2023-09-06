import { container } from "tsyringe";

import { loadResourceText } from "../utils/chrome-ext-utils";
import { ElementLoader } from "../utils/element-loader";

// モック関数を定義
jest.mock("../utils/chrome-ext-utils");

const spec = {
  wrapdiv: { id: "#wrapdiv", elementType: HTMLDivElement },
  someButton: { id: "#someButton", elementType: HTMLButtonElement },
};

describe("ElementLoaderクラス", () => {
  beforeEach(() => {
    container.clearInstances();

    (loadResourceText as jest.Mock).mockResolvedValue(
      '<div id="wrapdiv"></div><button id="someButton"></button>',
    );
  });

  it("指定されたpathからElementを正しくロードする", async () => {
    const loader = new ElementLoader(spec);
    await loader.loadFromURL("/path/to/resource.html");
    expect(loader.elements.wrapdiv).toBeInstanceOf(HTMLDivElement);
    expect(loader.elements.someButton).toBeInstanceOf(HTMLButtonElement);
  });

  it("指定した要素が存在しない場合、例外が発生する", async () => {
    (loadResourceText as jest.Mock).mockResolvedValue('<h1 id="unexpectedElement"></h1>');
    const loader = new ElementLoader(spec);
    await expect(loader.loadFromURL("/path/to/resource.html")).rejects.toThrow();
  });

  it("指定した要素の型が想定外の場合、例外が発生する", async () => {
    (loadResourceText as jest.Mock).mockResolvedValue(
      '<h1 id="wrapdiv"></h1><button id="someButton"></button>',
    );
    const loader = new ElementLoader(spec);
    await expect(loader.loadFromURL("/path/to/resource.html")).rejects.toThrow();
  });

  it("ElementMapを併用することで任意の型を持ったElementLoader<T>をインジェクションできる", async () => {
    const loader = new ElementLoader<typeof spec>(spec);
    await loader.loadFromURL("/path/to/resource.html");

    // 型付けされているので引数に渡せる
    const typedLoaderParamTest = (typedLoaderParam: ElementLoader<typeof spec>) => {
      expect(typedLoaderParam.elements.wrapdiv).toBeInstanceOf(HTMLDivElement);
      expect(typedLoaderParam.elements.someButton).toBeInstanceOf(HTMLButtonElement);
    };
    typedLoaderParamTest(loader);
  });
});
