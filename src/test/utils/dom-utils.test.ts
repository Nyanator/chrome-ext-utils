import * as DomUtils from "../../utils/dom-utils";

describe("DOM操作ユーティリティ", () => {
    it("appendElementToHead 要素のヘッド内に別の要素を追加する", () => {
        const element = document.createElement("div");
        const appendElem = document.createElement("span");
        DomUtils.appendElementToHead(element, appendElem);
        expect(element.querySelector("head")?.contains(appendElem)).toBe(true);
    });

    it("appendScriptText 要素にスクリプト要素を追加する", () => {
        const element = document.createElement("div");
        DomUtils.appendScriptText(element, 'console.log("test");');
        expect(element.querySelector("script")?.textContent).toBe(
            'console.log("test");',
        );
    });

    it("appendStyleTextToHead ヘッド要素にスタイル要素を追加する", () => {
        const element = document.createElement("div");
        DomUtils.appendStyleTextToHead(element, ".test { color: red; }");
        expect(element.querySelector("style")?.textContent).toBe(
            ".test { color: red; }",
        );
    });

    it("documentHeight ドキュメントの高さを計算する", () => {
        // 4つの中で一番高いものを返す
        expect(
            DomUtils.documentHeight({
                body: { clientHeight: 10, scrollHeight: 11 },
                documentElement: { clientHeight: 12, scrollHeight: 13 },
            } as Document),
        ).toBe(13);
    });

    it("findMatchParent 条件に一致する親要素を探す", () => {
        const parent = document.createElement("div");
        parent.classList.add("parent");
        const child = document.createElement("span");
        parent.appendChild(child);
        document.body.appendChild(parent);
        expect(DomUtils.findMatchParent(child, ".parent")).toBe(parent);
        expect(DomUtils.findMatchParent(child, ".nonexistent")).toBe(null);
    });

    it("findParentPreElement 指定された要素から親方向にpre要素を探す", () => {
        const pre = document.createElement("pre");
        const child = document.createElement("span");
        pre.appendChild(child);
        document.body.appendChild(pre);
        expect(DomUtils.findParentPreElement(child)).toBe(pre);
        expect(DomUtils.findParentPreElement(pre)).toBe(pre);
    });

    it("htmlTextToHtmlElement HTMLテキストをHTML要素に変換する", () => {
        const html = "<div>Test</div>";
        const element = DomUtils.htmlTextToHtmlElement(html);
        expect(element.outerHTML).toEqual(
            "<html><head></head><body><div>Test</div></body></html>",
        );
    });

    it("isInView 要素が画面内に表示されているかどうかを判定する", () => {
        const mockWindow = {
            innerHeight: 1000,
            innerWidth: 1000,
        };

        const mockElement = {
            getBoundingClientRect: jest.fn(),
        };

        // 要素が画面内に表示されている場合、trueを返す
        (mockElement.getBoundingClientRect as jest.Mock).mockReturnValue({
            top: 500,
            bottom: 700,
            left: 500,
            right: 700,
        });
        expect(
            DomUtils.isInView(
                mockWindow as Window,
                mockElement as unknown as Element,
            ),
        ).toBe(true);

        // 要素が画面外（上）に表示されている場合、falseを返す
        (mockElement.getBoundingClientRect as jest.Mock).mockReturnValue({
            top: -200,
            bottom: -100,
            left: 500,
            right: 700,
        });
        expect(
            DomUtils.isInView(
                mockWindow as Window,
                mockElement as unknown as Element,
            ),
        ).toBe(false);

        // 要素が画面外（下）に表示されている場合、falseを返す
        (mockElement.getBoundingClientRect as jest.Mock).mockReturnValue({
            top: 1100,
            bottom: 1200,
            left: 500,
            right: 700,
        });
        expect(
            DomUtils.isInView(
                mockWindow as Window,
                mockElement as unknown as Element,
            ),
        ).toBe(false);

        // 要素が画面外（左）に表示されている場合、falseを返す
        (mockElement.getBoundingClientRect as jest.Mock).mockReturnValue({
            top: 500,
            bottom: 700,
            left: -200,
            right: -100,
        });
        expect(
            DomUtils.isInView(
                mockWindow as Window,
                mockElement as unknown as Element,
            ),
        ).toBe(false);

        // 要素が画面外（右）に表示されている場合、falseを返す
        (mockElement.getBoundingClientRect as jest.Mock).mockReturnValue({
            top: 500,
            bottom: 700,
            left: 1100,
            right: 1200,
        });
        expect(
            DomUtils.isInView(
                mockWindow as Window,
                mockElement as unknown as Element,
            ),
        ).toBe(false);
    });

    it("maxZIndex 子要素の最大Zインデックスを計算する", () => {
        const parent = document.createElement("div");
        const child1 = document.createElement("div");
        child1.style.zIndex = "1";
        const child2 = document.createElement("div");
        child2.style.zIndex = "10";
        parent.appendChild(child1);
        parent.appendChild(child2);
        expect(DomUtils.maxZIndex(parent)).toBe(10);
    });

    it("totalHeight 子要素の高さの合計を計算する", () => {
        const parent = document.createElement("div");
        const child1 = document.createElement("div");
        const child2 = document.createElement("div");

        // 子要素のoffsetHeightの合計値
        Object.defineProperty(child1, "offsetHeight", {
            get: jest.fn(() => 50),
        });
        Object.defineProperty(child2, "offsetHeight", {
            get: jest.fn(() => 100),
        });
        parent.appendChild(child1);
        parent.appendChild(child2);

        expect(DomUtils.totalHeight(parent)).toBe(150);
    });
});
