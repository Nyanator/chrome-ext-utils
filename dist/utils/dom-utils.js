"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocation = exports.getDocument = exports.totalHeight = exports.maxZIndex = exports.isInView = exports.htmlTextToHtmlElement = exports.findParentPreElement = exports.findMatchParent = exports.documentHeight = exports.appendStyleTextToHead = exports.appendScriptText = exports.appendElementToHead = void 0;
/**
 * HTML要素のHEAD内にHTML要素を追加します。
 * HEADがない場合は、新しくHEADを作ります。
 * @param element 挿入先の要素
 * @param appendElement 追加する要素
 */
const appendElementToHead = (element, appendElement) => {
    let head = element.querySelector("head");
    if (!head) {
        head = document.createElement("head");
        element.insertBefore(head, element.firstChild);
    }
    head.appendChild(appendElement);
};
exports.appendElementToHead = appendElementToHead;
/**
 * HTML要素にscriptを追加します。
 * @param element 挿入先の要素
 * @param scriptText 追加するスクリプトのテキスト
 */
const appendScriptText = (element, scriptText) => {
    const script = document.createElement("script");
    script.textContent = scriptText;
    element.appendChild(script);
};
exports.appendScriptText = appendScriptText;
/**
 * HEAD要素にSTYLE要素を追加します。
 * @param element 挿入先の要素
 * @param styleText 追加するスタイルのテキスト
 */
const appendStyleTextToHead = (element, styleText) => {
    const style = document.createElement("style");
    style.textContent = styleText;
    (0, exports.appendElementToHead)(element, style);
};
exports.appendStyleTextToHead = appendStyleTextToHead;
/**
 * ドキュメントの高さを計算します。
 * clientHeight、scrollHeightの中で最も高いものを返します。
 * @param doc ドキュメントオブジェクト
 * @returns ドキュメントの高さ
 */
const documentHeight = (doc) => {
    const resultHeight = Math.max.apply(null, [
        doc.body.clientHeight,
        doc.body.scrollHeight,
        doc.documentElement.scrollHeight,
        doc.documentElement.clientHeight,
    ]);
    return resultHeight;
};
exports.documentHeight = documentHeight;
/**
 * HTML要素の親を探し、指定されたクエリに一致する親要素を返します。
 * @param element 対象の要素
 * @param query クエリ文字列
 * @returns 一致する親要素またはnull
 */
const findMatchParent = (element, query) => {
    let parent = element.parentElement;
    while (parent) {
        if (parent.matches(query)) {
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
};
exports.findMatchParent = findMatchParent;
/**
 * 指定された要素から親方向にpre要素を探します。
 * @param htmlElement 処理対象のHTML要素
 * @returns 見つかった祖先要素またはnull
 */
const findParentPreElement = (htmlElement) => {
    if (!(htmlElement instanceof HTMLPreElement)) {
        const preElement = (0, exports.findMatchParent)(htmlElement, "pre");
        return preElement;
    }
    return htmlElement;
};
exports.findParentPreElement = findParentPreElement;
/**
 * HTMLテキストをパースしてHTML要素に変換します。
 * @param htmlText パースするHTMLテキスト
 * @returns パースされたHTML要素
 */
const htmlTextToHtmlElement = (htmlText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const htmlElement = doc.documentElement;
    return htmlElement;
};
exports.htmlTextToHtmlElement = htmlTextToHtmlElement;
/**
 * HTML要素が画面内に表示されているかどうかを判定します。
 * @param checkWindow windowオブジェクト
 * @param element 判定する要素
 * @returns 要素が画面内に表示されている場合はtrue、それ以外はfalse
 */
const isInView = (checkWindow, element) => {
    const rect = element.getBoundingClientRect();
    const topIsInView = rect.top < checkWindow.innerHeight;
    const bottomIsInView = 0 < rect.bottom;
    const leftIsInView = rect.left < checkWindow.innerWidth;
    const rightIsInView = 0 < rect.right;
    const isInView = topIsInView && bottomIsInView && leftIsInView && rightIsInView;
    return isInView;
};
exports.isInView = isInView;
/**
 * 子要素の最大Zインデックスを返します。
 * @param parentElement 親要素
 * @returns 親要素の中で一番前面にある子要素のZインデックス
 */
const maxZIndex = (parentElement) => {
    const zIndexes = Array.from(parentElement.children).map((child) => {
        const elementZIndex = child?.style?.zIndex;
        /* istanbul ignore next */
        const childZIndex = elementZIndex ?? 0;
        const parsedZIndex = parseInt(childZIndex);
        /* istanbul ignore next */
        const resultZIndex = !isNaN(parsedZIndex) ? parsedZIndex : 0;
        return resultZIndex;
    });
    const resultMaxZIndex = Math.max(...zIndexes);
    return resultMaxZIndex;
};
exports.maxZIndex = maxZIndex;
/**
 * 子要素の高さの合計を計算します。
 * @param parentElement 親要素
 * @returns 子要素の高さの合計(offsetHeightの合計値)
 */
const totalHeight = (parentElement) => {
    const resultTotalHeight = Array.from(parentElement.children).reduce((sum, childElement) => {
        const elementOffsetHeight = childElement.offsetHeight;
        const calcedHeight = sum + elementOffsetHeight;
        return calcedHeight;
    }, 0);
    return resultTotalHeight;
};
exports.totalHeight = totalHeight;
/** テストでグローバルオブジェクトのモックが必要になったときに差し替えるラップ関数 */
const getDocument = () => document;
exports.getDocument = getDocument;
const getLocation = () => location;
exports.getLocation = getLocation;
