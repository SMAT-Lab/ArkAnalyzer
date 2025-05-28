[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / System

# Interface: System

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4523

## Properties

### args

> **args**: `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4524

***

### newLine

> **newLine**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4525

***

### useCaseSensitiveFileNames

> **useCaseSensitiveFileNames**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4526

## Methods

### base64decode()?

> `optional` **base64decode**(`input`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4562

#### Parameters

##### input

`string`

#### Returns

`string`

***

### base64encode()?

> `optional` **base64encode**(`input`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4563

#### Parameters

##### input

`string`

#### Returns

`string`

***

### clearScreen()?

> `optional` **clearScreen**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4561

#### Returns

`void`

***

### clearTimeout()?

> `optional` **clearTimeout**(`timeoutId`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4560

#### Parameters

##### timeoutId

`any`

#### Returns

`void`

***

### createDirectory()

> **createDirectory**(`path`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4542

#### Parameters

##### path

`string`

#### Returns

`void`

***

### createHash()?

> `optional` **createHash**(`data`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4553

A good implementation is node.js' `crypto.createHash`. (https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm)

#### Parameters

##### data

`string`

#### Returns

`string`

***

### createSHA256Hash()?

> `optional` **createSHA256Hash**(`data`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4555

This must be cryptographically secure. Only implement this method using `crypto.createHash("sha256")`.

#### Parameters

##### data

`string`

#### Returns

`string`

***

### deleteFile()?

> `optional` **deleteFile**(`path`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4549

#### Parameters

##### path

`string`

#### Returns

`void`

***

### directoryExists()

> **directoryExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4541

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### exit()

> **exit**(`exitCode?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4557

#### Parameters

##### exitCode?

`number`

#### Returns

`void`

***

### fileExists()

> **fileExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4540

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4544

#### Returns

`string`

***

### getDirectories()

> **getDirectories**(`path`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4545

#### Parameters

##### path

`string`

#### Returns

`string`[]

***

### getExecutingFilePath()

> **getExecutingFilePath**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4543

#### Returns

`string`

***

### getFileSize()?

> `optional` **getFileSize**(`path`): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4531

#### Parameters

##### path

`string`

#### Returns

`number`

***

### getMemoryUsage()?

> `optional` **getMemoryUsage**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4556

#### Returns

`number`

***

### getModifiedTime()?

> `optional` **getModifiedTime**(`path`): `undefined` \| `Date`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4547

#### Parameters

##### path

`string`

#### Returns

`undefined` \| `Date`

***

### getWidthOfTerminal()?

> `optional` **getWidthOfTerminal**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4529

#### Returns

`number`

***

### readDirectory()

> **readDirectory**(`path`, `extensions?`, `exclude?`, `include?`, `depth?`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4546

#### Parameters

##### path

`string`

##### extensions?

readonly `string`[]

##### exclude?

readonly `string`[]

##### include?

readonly `string`[]

##### depth?

`number`

#### Returns

`string`[]

***

### readFile()

> **readFile**(`path`, `encoding?`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4530

#### Parameters

##### path

`string`

##### encoding?

`string`

#### Returns

`undefined` \| `string`

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4558

#### Parameters

##### path

`string`

#### Returns

`string`

***

### resolvePath()

> **resolvePath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4539

#### Parameters

##### path

`string`

#### Returns

`string`

***

### setModifiedTime()?

> `optional` **setModifiedTime**(`path`, `time`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4548

#### Parameters

##### path

`string`

##### time

`Date`

#### Returns

`void`

***

### setTimeout()?

> `optional` **setTimeout**(`callback`, `ms`, ...`args`): `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4559

#### Parameters

##### callback

(...`args`) => `void`

##### ms

`number`

##### args

...`any`[]

#### Returns

`any`

***

### watchDirectory()?

> `optional` **watchDirectory**(`path`, `callback`, `recursive?`, `options?`): [`FileWatcher`](FileWatcher.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4538

#### Parameters

##### path

`string`

##### callback

[`DirectoryWatcherCallback`](../type-aliases/DirectoryWatcherCallback.md)

##### recursive?

`boolean`

##### options?

[`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

***

### watchFile()?

> `optional` **watchFile**(`path`, `callback`, `pollingInterval?`, `options?`): [`FileWatcher`](FileWatcher.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4537

#### Parameters

##### path

`string`

##### callback

[`FileWatcherCallback`](../type-aliases/FileWatcherCallback.md)

##### pollingInterval?

`number`

##### options?

[`WatchOptions`](WatchOptions.md)

#### Returns

[`FileWatcher`](FileWatcher.md)

#### Polling Interval

- this parameter is used in polling-based watchers and ignored in watchers that
use native OS file watching

***

### write()

> **write**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4527

#### Parameters

##### s

`string`

#### Returns

`void`

***

### writeFile()

> **writeFile**(`path`, `data`, `writeByteOrderMark?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4532

#### Parameters

##### path

`string`

##### data

`string`

##### writeByteOrderMark?

`boolean`

#### Returns

`void`

***

### writeOutputIsTTY()?

> `optional` **writeOutputIsTTY**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4528

#### Returns

`boolean`
