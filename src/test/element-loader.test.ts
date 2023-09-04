import { container } from "tsyringe";
import {
    ElementLoader,
    ElementLoaderConfig,
    ElementMap,
    FetchElementLoaderImpl,
    defineElements,
} from "../element-loader";
import { EventListenerMap } from "../event-listener-map";
import { loadResourceText } from "../utils/chrome-ext-utils";

// モック関数を定義
jest.mock("../utils/chrome-ext-utils");

const spec = defineElements({
    wrapdiv: { id: "#wrapdiv", elementType: HTMLDivElement },
    someButton: { id: "#someButton", elementType: HTMLButtonElement },
});
type Spec = ElementMap<typeof spec>;

describe("FetchElementLoaderクラス", () => {
    beforeEach(() => {
        container.clearInstances();

        container.register("EventListenerMap", {
            useClass: EventListenerMap,
        });

        container.register<ElementLoaderConfig<typeof spec>>(
            "ElementLoaderConfig",
            {
                useValue: {
                    spec: spec,
                    path: "/path/to/resource.html",
                },
            },
        );

        container.register<ElementLoader<Spec>>("ElementLoader", {
            useClass: FetchElementLoaderImpl,
        });

        (loadResourceText as jest.Mock).mockResolvedValue(
            '<div id="wrapdiv"></div><button id="someButton"></button>',
        );
    });

    it("指定されたpathからElementを正しくロードする", async () => {
        const loader = container.resolve<ElementLoader<Spec>>("ElementLoader");
        await loader.load();
        expect(loader.elements.wrapdiv).toBeInstanceOf(HTMLDivElement);
        expect(loader.elements.someButton).toBeInstanceOf(HTMLButtonElement);
    });

    it("指定した要素が存在しない場合、例外が発生する", async () => {
        (loadResourceText as jest.Mock).mockResolvedValue(
            '<h1 id="unexpectedElement"></h1>',
        );
        const loader = container.resolve<ElementLoader<Spec>>("ElementLoader");
        await expect(loader.load()).rejects.toThrow();
    });

    it("指定した要素の型が想定外の場合、例外が発生する", async () => {
        (loadResourceText as jest.Mock).mockResolvedValue(
            '<h1 id="wrapdiv"></h1><button id="someButton"></button>',
        );
        const loader = container.resolve<ElementLoader<Spec>>("ElementLoader");
        await expect(loader.load()).rejects.toThrow();
    });

    it("ElementMapを併用することで任意の型を持ったElmentLoader<T>をインジェクションできる", async () => {
        const typedLoader =
            container.resolve<ElementLoader<Spec>>("ElementLoader");
        await typedLoader.load();

        // 型付けされているので引数に渡せる
        const typedLoaderParamTest = (
            typedLoaderParam: ElementLoader<Spec>,
        ) => {
            expect(typedLoaderParam.elements.wrapdiv).toBeInstanceOf(
                HTMLDivElement,
            );
            expect(typedLoaderParam.elements.someButton).toBeInstanceOf(
                HTMLButtonElement,
            );
        };
        typedLoaderParamTest(typedLoader);
    });

    it("宣言的な記法でリスナーの設定ができる", async () => {
        const handleClick = jest.fn();
        const loader = container.resolve<ElementLoader<Spec>>("ElementLoader");
        await loader.load();
        loader.addListeners([
            {
                element: "someButton",
                events: {
                    click: handleClick,
                },
            },
            {
                element: "wrapdiv",
                events: {
                    click: handleClick,
                },
            },
        ]);
        loader.elements.someButton.click();
        loader.elements.wrapdiv.click();
        expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("リスナーが削除できる", async () => {
        const handleClick = jest.fn();
        const loader = container.resolve<ElementLoader<Spec>>("ElementLoader");
        await loader.load();
        loader.addListeners([
            {
                element: "someButton",
                events: {
                    click: handleClick,
                },
            },
        ]);
        loader.removeAllListeners();
        loader.elements.someButton.click();
        expect(handleClick).toHaveBeenCalledTimes(0);
    });
});
