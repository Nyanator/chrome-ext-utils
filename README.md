[![Version](https://img.shields.io/npm/v/@nyanator/chrome-ext-utils.svg)](https://www.npmjs.com/package/@nyanator/chrome-ext-utils)
[![License: MIT](https://img.shields.io/github/license/Nyanator/@nyanator/chrome-ext-utils)](https://github.com/Nyanator/chrome-ext-utils/blob/master/LICENSE)

# chrome-ext-utils
Chrome拡張のユーティリティクラスライブラリ。tsyringeによるコンストラクタインジェクションに対応します。

主要な機能:

- AES暗号化されたコンテキスト通信に対応。

- 未処理例外をユーザーに通知する仕組みの提供。

- IndexedDBなどの外部依存の抽象化層を設定することで、アプリケーションを外部依存と切り離します。 

## Setup

### Install

```bash
$ npm i @nyanator/chrome-ext-utils --save-dev
```

## Run tests

```sh
npm run test
```

## API
### `initializeDIContainer(arg: { databaseName?: string; storeName?: string; allowedOrigins: string[]; }): Promise<MessageData | void>`

tsyringe DIコンテナを初期化してメッセージングクラスや各種機能を登録します。

##### `databaseName`

> Optional | `string`
IndexedDBの初期化に使用するデータベース名称。

##### `storeName`

> Optional | `string`
IndexedDBの初期化に使用するストア名称。

##### `allowedOrigins`

> Optional | `string[]`
メッセージングクラスがデータの送受信を許可するオリジンの一覧。

## Example

<a name="example"></a>

```typescript
// entrypoint.ts
import { initializeDIContainer } from "@nyanator/chrome-ext-utils";

initializeDIContainer({
  databaseName: "databaseName",
  storeName: "storeName",
  allowedOrigins: ["https://www.example.com/"],
});

```

```typescript
// module-class.ts
import {
  DatabaseAgent,
  Logger,
  RuntimeMessageAgent,
  WindowMessageAgent,
} from "@nyanator/chrome-ext-utils";
import { inject, injectable } from "tsyringe";

@injectable()
export class ModuleClass {
  constructor(
    @inject("CrossDispatcher") crossDispatcher: CrossDispatcher,
    @inject("DatabaseAgent") databaseAgent: DatabaseAgent,
    @inject("Logger") logger: Logger,
    @inject("RuntimeMessageAgent") runtimeMessageAgent: RuntimeMessageAgent,
    @inject("WindowMessageAgent") windowMessageAgent: WindowMessageAgent,
    ) { }
}

```
---

### `RuntimeMessageAgent`

暗号化されたランタイムメッセージの送受信を管理します。chrome.runtime.sendMessageのラップクラス。

### Methods
### `sendMessage(channel: string, message?: MessageData, tabId?: number): Promise<MessageData | void>`

暗号化されたランタイムメッセージを送信します。指定したchannelへメッセージを送信します。tabIdが指定されている場合、そのIDのタブにメッセージを送信します。

##### `channel`

> Require | `string`
送信先を識別する文字列キー。

##### `message`

> Optional | `MessageData`
送信する本文データ。この部分がAES暗号化されます。

##### `tabId`

> Optional | `number`
送信先のタブID。バックグラウンドスクリプトからコンテンツスクリプトへ送信する際などに指定します。

---

### `addListener(channel: string, listener: (messageData: MessageData) => Promise<MessageData | void> | void): void`

指定したchannelでのランタイムメッセージを受信し、復号化してリスナー関数に渡します。

##### `channel`

> Require | `string`
受信データをフィルタリングするための文字列キー。

##### `listener`

> Require | `fn`
チャンネルがデータを受信したときに実行されるリスナー。

---

## Example

<a name="example"></a>

```typescript
// content.ts
import { initializeDIContainer } from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

initializeDIContainer({
  allowedOrigins: ["https://www.example.com/"],
});

const messageAgent = container.resolve<RuntimeMessageAgent>("RuntimeMessageAgent");
messageAgent.sentMessage("channel", {message: "hello message"});

```

```typescript
// background.ts
import { initializeDIContainer } from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

initializeDIContainer({
  allowedOrigins: ["https://www.example.com/"],
});

const messageAgent = container.resolve<RuntimeMessageAgent>("RuntimeMessageAgent");
messageAgent.addListener("channel", (messageData) => {
  console.log(messageData.message);
});
```

### `WindowMessageAgent`

暗号化されたウィンドウメッセージの送受信を管理します。winodow.postMessageのラップクラス。

### Methods
### `postMessage(target: Window,　targetOrigin: string, channel: string, message?: MessageData,): Promise<void>`

暗号化されたウィンドウメッセージを送信します。指定したウィンドウ、オリジンのchannelへメッセージを送信します。

##### `target`

> Require | `Window`
送信先ウィンドウ。

##### `targetOrigin`

> Require | `string`
送信先オリジン。initializeDIContainerで許可したオリジン以外を指定すると例外が発生します。

##### `channel`

> Require | `string`
送信先を識別する文字列キー。

##### `message`

> Optional | `MessageData`
送信する本文データ。この部分がAES暗号化されます。

---

### `addListener(channel: string, listener: (event: MessageData) => void): void`

指定したchannelでのウィンドウメッセージを受信し、復号化してリスナー関数に渡します。

##### `channel`

> Require | `string`
受信データをフィルタリングするための文字列キー。

##### `listener`

> Require | `fn`
チャンネルがデータを受信したときに実行されるリスナー。

---

## Example

<a name="example"></a>

```typescript
// content.ts
import { initializeDIContainer } from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

initializeDIContainer({
  allowedOrigins: ["https://www.example.com/"],
});

const messageAgent = container.resolve<RuntimeMessageAgent>("RuntimeMessageAgent");
messageAgent.sentMessage("channel", {message: "hello message"});

```

```typescript
// background.ts
import { initializeDIContainer } from "@nyanator/chrome-ext-utils";
import { container } from "tsyringe";

initializeDIContainer({
  allowedOrigins: ["https://www.example.com/"],
});

const messageAgent = container.resolve<RuntimeMessageAgent>("RuntimeMessageAgent");
messageAgent.addListener("channel", (messageData) => {
  console.log(messageData.message);
});
```

---

## Author

👤 **nyanator**

* Github: [@Nyanator](https://github.com/Nyanator)

## 📝 License

Copyright © 2023 [nyanator](https://github.com/Nyanator).

This project is [MIT](https://github.com/Nyanator/chrome-ext-utils/blob/master/LICENSE) licensed.

***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_

