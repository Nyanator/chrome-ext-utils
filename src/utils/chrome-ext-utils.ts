import { getDocument, getLocation } from "./dom-utils";

/** Chrome拡張のURLオリジン */
export const EXT_ORIGIN = "chrome-extension://" + chrome.runtime.id;

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
export const generateSessionStaticValue = async (
    key: string,
    value: string,
    regenerate: boolean,
): Promise<string> => {
    if (isBackground()) {
        chrome.storage.session.setAccessLevel({
            accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
        });
    }

    if (!regenerate) {
        const prevObect = await chrome.storage.session.get([key]);
        const prevValue = prevObect[key];
        if (prevValue) {
            return prevValue;
        }
    }

    await chrome.storage.session.set({
        [key]: value,
    });

    return value;
};

/**
 * スクリプトが拡張機能のバッググラウンドスクリプトとして実行されているかを判定します。
 * @returns バッググラウンドスクリプトの場合は true、そうでない場合は false
 */
export const isBackground = (): boolean => {
    if (getLocation().origin === EXT_ORIGIN) {
        // 正確な判定方法がわからないため例外を発生させます
        try {
            return typeof getDocument() === "undefined";
        } catch (error) {
            return true;
        }
    }
    return false;
};

/**
 * Chrome拡張のリソースを読み込みテキストで返します。
 * @param path リソースのURL
 * @returns テキストデータの読み込み完了時に解決されるプロミス
 */
export const loadResourceText = async (path: string): Promise<string> => {
    const fileURL = chrome.runtime.getURL(path);
    const result = await fetch(fileURL);
    const text = await result.text();
    return text;
};

/**
 * DOM の読み込み完了タイミングに実行されるアクションを予約します。
 * DOM が既に読み込まれている場合、アクションはすぐに実行されます。
 * DOM がまだ読み込まれていない場合、アクションは "DOMContentLoaded" イベント発生時に実行されます。
 * @param doc Documentオブジェクト
 * @param action DOM が準備できたときに実行されるアクション
 */
export const reserveLoadedAction = (doc: Document, action: { (): void }) => {
    if (doc.readyState === "interactive" || doc.readyState === "complete") {
        action();
        return;
    }

    document.addEventListener("DOMContentLoaded", () => {
        action();
    });
};

/**
 * 条件が満たされるまで非同期に待機します。
 * 条件が満たされるかタイムアウトすると、予約されたアクションが実行されます。
 * @param action 実行されるアクション
 * @param check 条件をチェックする関数
 * @param timeout タイムアウトまでの待機時間（ミリ秒）デフォルトは 30 ミリ秒です
 * @param maxCheck 最大チェック回数デフォルトは 6000 回です
 * @returns 実行後に解決されるプロミス
 */
export const waitForAction = async (
    action: { (): void },
    check: { (): boolean },
    timeout: number = 30,
    maxCheck: number = 6000,
): Promise<void> => {
    let checkedCount = 0;
    while (checkedCount < maxCheck) {
        if (check() === true) {
            break;
        }
        await new Promise((resolve) => setTimeout(resolve, timeout));
        checkedCount++;
    }
    action();
};
