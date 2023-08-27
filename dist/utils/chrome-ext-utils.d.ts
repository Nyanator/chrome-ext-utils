/** Chrome拡張のURLオリジン */
export declare const EXT_ORIGIN: string;
/**
 * Chromeのセッションに不変な値を保存します。
 * コンテンツスクリプトからセッションにアクセスするには、
 * アクセスレベルを指定する必要があるためバックグラウンドが先に起動している必要があります。
 * すでに該当のキーに値が保存されている場合、valueは無視されます。
 * @param key セッションに値を保存する場所を識別するキー
 * @param value セッションに保存する値
 * @param regenerate 既存の値があっても強制的に再作成する
 * @returns セッション保存時に解決されるプロミス
 */
export declare const generateSessionStaticValue: (key: string, value: string, regenerate: boolean) => Promise<string>;
/**
 * スクリプトが拡張機能のバッググラウンドスクリプトとして実行されているかを判定します。
 * @returns バッググラウンドスクリプトの場合は true、そうでない場合は false
 */
export declare const isBackground: () => boolean;
/**
 * Chrome拡張のリソースを読み込みテキストで返します。
 * @param path リソースのURL
 * @returns テキストデータの読み込み完了時に解決されるプロミス
 */
export declare const loadResourceText: (path: string) => Promise<string>;
/**
 * DOM の読み込み完了タイミングに実行されるアクションを予約します。
 * DOM が既に読み込まれている場合、アクションはすぐに実行されます。
 * DOM がまだ読み込まれていない場合、アクションは "DOMContentLoaded" イベント発生時に実行されます。
 * @param doc Documentオブジェクト
 * @param action DOM が準備できたときに実行されるアクション
 */
export declare const reserveLoadedAction: (doc: Document, action: {
    (): void;
}) => void;
/**
 * 条件が満たされるまで非同期に待機します。
 * 条件が満たされるかタイムアウトすると、予約されたアクションが実行されます。
 * @param action 実行されるアクション
 * @param check 条件をチェックする関数
 * @param timeout タイムアウトまでの待機時間（ミリ秒）デフォルトは 30 ミリ秒です
 * @param maxCheck 最大チェック回数デフォルトは 6000 回です
 * @returns 実行後に解決されるプロミス
 */
export declare const waitForAction: (action: {
    (): void;
}, check: {
    (): boolean;
}, timeout?: number, maxCheck?: number) => Promise<void>;
