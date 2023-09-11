# chrome-ext-utils
Chrome拡張のユーティリティクラスライブラリです。

## example

<a name="example"></a>

```javascript

import { initializeDIContainer } from "@nyanator/chrome-ext-utils";

initializeDIContainer({
  databaseName: "databaseName",
  storeName: "storeName",
  allowedOrigins: ["[http](https://www.example.com/)https://www.example.com/"],
});

```

