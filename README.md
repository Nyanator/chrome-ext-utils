# chrome-ext-utils
Chrome拡張のユーティリティクラスライブラリ。tsyringeによるコンストラクタインジェクションに対応しています。

主要な機能:

- AES暗号化されたコンテキスト通信に対応。

- 未処理例外をユーザーに通知する仕組みの提供。

- IndexedDBなどの外部依存の抽象化層を設定することで、アプリケーションを外部依存の実装と切り離します。

## Setup

### Install

```bash
$ npm i @nyanator/chrome-ext-utils --save-dev
```

## API
### `initializeDIContainer(arg: { databaseName?: string; storeName?: string; allowedOrigins: string[]; }): Promise<MessageData | void>`

tsyringe DIコンテナを初期化してメッセージングクラスや各種機能を登録します。

##### `databaseName`

> Optional | `string`
IndexedDBの初期化に使用するデータベース名称です。

##### `storeName`

> Optional | `string`
IndexedDBの初期化に使用するストア名称です。

##### `allowedOrigins`

> Optional | `string[]`
メッセージングクラスがデータの送受信を許可するオリジンの一覧です。

## Example

<a name="example"></a>

```typescript

import { initializeDIContainer } from "@nyanator/chrome-ext-utils";

initializeDIContainer({
  databaseName: "databaseName",
  storeName: "storeName",
  allowedOrigins: ["https://www.example.com/"],
});

```

---

### `RuntimeMessageAgent`

暗号化されたランタイムメッセージの送受信を管理します。chrome.runtime.sendMessageのラップクラスです。

### Methods
### `sendMessage(channel: string, message?: MessageData, tabId?: number): Promise<MessageData | void>`

暗号化されたランタイムメッセージを送信します。指定したchannelへメッセージを送信します。tabIdが指定されている場合、そのIDのタブにメッセージを送信します。

##### `channel`

> Optional | `string`
送信先を識別する文字列キーです。

##### `message`

> Optional | `MessageData`
送信する本文データです。この部分がAES暗号化されます。

##### `tabId`

> Optional | `number`
送信先のタブIDです。バックグラウンドスクリプトからコンテンツスクリプトへ送信する際などに指定します。

---

### `addListener(channel: string, listener: (messageData: MessageData) => Promise<MessageData | void> | void): void`

指定したchannelでのランタイムメッセージを受信し、復号化してリスナー関数に渡します。

##### `channel`

> Require | `string`
受信データをフィルタリングするための文字列キーです。

##### `listener`

> Require | `fn`
チャンネルがデータを受信したときに実行されるリスナーです。

---

### `removeListener(listener: (messageData: MessageData) => Promise<MessageData | void> | void): void`

指定したリスナーを解除します。

##### `listener`

> Require | `fn`
解除するリスナーです。

---

### `clearListeners(): void`
リスナーをすべて解除します。

## Example

<a name="example"></a>

```typescript

import { initializeDIContainer } from "@nyanator/chrome-ext-utils";

initializeDIContainer({
  databaseName: "databaseName",
  storeName: "storeName",
  allowedOrigins: ["https://www.example.com/"],
});

```

---
