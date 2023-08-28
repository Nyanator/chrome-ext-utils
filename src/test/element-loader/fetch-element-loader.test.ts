import { createFetchElementLoader } from "../../element-loader/factories";
import {
  ElementLoader,
  ElementMap,
  defineElements,
} from "../../element-loader/interfaces";
import { loadResourceText } from "../../utils/chrome-ext-utils";

// モック関数を定義
jest.mock("../../utils/chrome-ext-utils");

describe("FetchElementLoaderのテスト", () => {
  it("指定されたpathからElementを正しくロードする", async () => {
    // モックの戻り値を設定
    (loadResourceText as jest.Mock).mockResolvedValue(
      '<div id="wrapdiv"></div><button id="someButton"></button>',
    );

    const spec = {
      wrapdiv: { id: "#wrapdiv", elementType: HTMLDivElement },
      someButton: { id: "#someButton", elementType: HTMLButtonElement },
    };

    const loader = createFetchElementLoader(spec, "/path/to/resource.html");
    await loader.loadElements();

    expect(loader.elements.wrapdiv).toBeInstanceOf(HTMLDivElement);
    expect(loader.elements.someButton).toBeInstanceOf(HTMLButtonElement);
  });

  it("指定した要素が存在しない場合、例外が発生する", async () => {
    (loadResourceText as jest.Mock).mockResolvedValue(
      '<h1 id="unexpectedElement"></h1>',
    );

    const spec = {
      wrapdiv: { id: "#wrapdiv", elementType: HTMLDivElement },
      someButton: { id: "#someButton", elementType: HTMLButtonElement },
      svg: { id: "#svgid", elementType: SVGElement },
    };

    const loader = createFetchElementLoader(spec, "/path/to/resource.html");

    await expect(loader.loadElements()).rejects.toThrow();
  });

  it("指定した要素の型が想定外の場合、例外が発生する", async () => {
    (loadResourceText as jest.Mock).mockResolvedValue(
      '<h1 id="wrapdiv"></h1><button id="someButton"></button>',
    );

    const spec = {
      wrapdiv: { id: "#wrapdiv", elementType: HTMLDivElement },
      someButton: { id: "#someButton", elementType: HTMLButtonElement },
    };

    const loader = createFetchElementLoader(spec, "/path/to/resource.html");

    await expect(loader.loadElements()).rejects.toThrow();
  });

  it("ElementMapを併用することで任意の型を持ったElmentLoader<T>をインジェクションできる", async () => {
    // モックの戻り値を設定
    (loadResourceText as jest.Mock).mockResolvedValue(
      '<div id="wrapdiv"></div><button id="someButton"></button>',
    );

    const spec = defineElements({
      wrapdiv: { id: "#wrapdiv", elementType: HTMLDivElement },
      someButton: { id: "#someButton", elementType: HTMLButtonElement },
    });
    type Spec = ElementMap<typeof spec>;

    const typedLoader: ElementLoader<Spec> = createFetchElementLoader(
      spec,
      "/path/to/resource.html",
    );
    await typedLoader.loadElements();

    // 型付けされているので引数に渡せる
    const typedLoaderParamTest = (typedLoaderParam: ElementLoader<Spec>) => {
      expect(typedLoaderParam.elements.wrapdiv).toBeInstanceOf(HTMLDivElement);
      expect(typedLoaderParam.elements.someButton).toBeInstanceOf(
        HTMLButtonElement,
      );
    };

    typedLoaderParamTest(typedLoader);
  });
});
