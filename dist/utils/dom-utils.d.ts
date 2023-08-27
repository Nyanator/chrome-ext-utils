/**
 * HTML要素のHEAD内にHTML要素を追加します。
 * HEADがない場合は、新しくHEADを作ります。
 * @param element 挿入先の要素
 * @param appendElement 追加する要素
 */
export declare const appendElementToHead: (element: HTMLElement, appendElement: HTMLElement) => void;
/**
 * HTML要素にscriptを追加します。
 * @param element 挿入先の要素
 * @param scriptText 追加するスクリプトのテキスト
 */
export declare const appendScriptText: (element: HTMLElement, scriptText: string) => void;
/**
 * HEAD要素にSTYLE要素を追加します。
 * @param element 挿入先の要素
 * @param styleText 追加するスタイルのテキスト
 */
export declare const appendStyleTextToHead: (element: HTMLElement, styleText: string) => void;
/**
 * ドキュメントの高さを計算します。
 * clientHeight、scrollHeightの中で最も高いものを返します。
 * @param doc ドキュメントオブジェクト
 * @returns ドキュメントの高さ
 */
export declare const documentHeight: (doc: Document) => number;
/**
 * HTML要素の親を探し、指定されたクエリに一致する親要素を返します。
 * @param element 対象の要素
 * @param query クエリ文字列
 * @returns 一致する親要素またはnull
 */
export declare const findMatchParent: (element: HTMLElement, query: string) => HTMLElement | null;
/**
 * 指定された要素から親方向にpre要素を探します。
 * @param htmlElement 処理対象のHTML要素
 * @returns 見つかった祖先要素またはnull
 */
export declare const findParentPreElement: (htmlElement: HTMLElement) => HTMLPreElement | null;
/**
 * HTMLテキストをパースしてHTML要素に変換します。
 * @param htmlText パースするHTMLテキスト
 * @returns パースされたHTML要素
 */
export declare const htmlTextToHtmlElement: (htmlText: string) => HTMLElement;
/**
 * HTML要素が画面内に表示されているかどうかを判定します。
 * @param checkWindow windowオブジェクト
 * @param element 判定する要素
 * @returns 要素が画面内に表示されている場合はtrue、それ以外はfalse
 */
export declare const isInView: (checkWindow: Window, element: Element) => boolean;
/**
 * 子要素の最大Zインデックスを返します。
 * @param parentElement 親要素
 * @returns 親要素の中で一番前面にある子要素のZインデックス
 */
export declare const maxZIndex: (parentElement: HTMLElement) => number;
/**
 * 子要素の高さの合計を計算します。
 * @param parentElement 親要素
 * @returns 子要素の高さの合計(offsetHeightの合計値)
 */
export declare const totalHeight: (parentElement: HTMLElement) => number;
/** テストでグローバルオブジェクトのモックが必要になったときに差し替えるラップ関数 */
export declare const getDocument: () => Document;
export declare const getLocation: () => Location;
