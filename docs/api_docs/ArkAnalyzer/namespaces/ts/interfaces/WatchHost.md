[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / WatchHost

# Interface: WatchHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5796

Host that has watch functionality used in --watch mode

## Extended by

- [`WatchCompilerHost`](WatchCompilerHost.md)
- [`SolutionBuilderWithWatchHost`](SolutionBuilderWithWatchHost.md)

## Methods

### clearTimeout()?

> `optional` **clearTimeout**(`timeoutId`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5806

If provided, will be used to reset existing delayed compilation

#### Parameters

##### timeoutId

`any`

#### Returns

`void`

***

### onWatchStatusChange()?

> `optional` **onWatchStatusChange**(`diagnostic`, `newLine`, `options`, `errorCount?`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5798

If provided, called with Diagnostic message that informs about change in watch status

#### Parameters

##### diagnostic

[`Diagnostic`](Diagnostic.md)

##### newLine

`string`

##### options

[`CompilerOptions`](CompilerOptions.md)

##### errorCount?

`number`

#### Returns

`void`

***

### setTimeout()?

> `optional` **setTimeout**(`callback`, `ms`, ...`args`): `any`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5804

If provided, will be used to set delayed compilation, so that multiple changes in short span are compiled together

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

### watchDirectory()

> **watchDirectory**(`path`, `callback`, `recursive?`, `options?`): [`FileWatcher`](FileWatcher.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5802

Used to watch resolved module's failed lookup locations, config file specs, type roots where auto type reference directives are added

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

### watchFile()

> **watchFile**(`path`, `callback`, `pollingInterval?`, `options?`): [`FileWatcher`](FileWatcher.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5800

Used to watch changes in source files, missing files needed to update the program or config file

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
