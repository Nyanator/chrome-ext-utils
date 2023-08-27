"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStaticKeyProvider = void 0;
const crypto_js_1 = __importDefault(require("crypto-js"));
const ChromeExtensionUtils = __importStar(require("../utils/chrome-ext-utils"));
/**
 * セッションで静的な暗号化の鍵を生成します。
 */
class SessionStaticKeyProvider {
    constructor() {
        this.key = "";
        this.aesInitial = "";
    }
    getValue() {
        return this.key;
    }
    /**
     * 暗号化のための鍵を生成します。
     * @param regenerate true=既存の値があっても強制的に再作成する
     * @returns 鍵
     */
    async generateValue(regenerate) {
        // バックグラウンド以外のスクリプトでも同じキーを再現できるように開始時刻をChromeセションに保存
        const dateTimeNow = Date.now().toString();
        const startTime = await ChromeExtensionUtils.generateSessionStaticValue("startTime", dateTimeNow, regenerate);
        // 初期化ベクトルを読み込み、鍵を生成
        if (!this.aesInitial) {
            this.aesInitial = await ChromeExtensionUtils.loadResourceText("cryptokey");
        }
        this.key = crypto_js_1.default.SHA256(this.aesInitial + startTime).toString(crypto_js_1.default.enc.Base64);
        return this.key;
    }
}
exports.SessionStaticKeyProvider = SessionStaticKeyProvider;
