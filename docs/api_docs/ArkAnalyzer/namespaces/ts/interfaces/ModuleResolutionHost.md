[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ModuleResolutionHost

# Interface: ModuleResolutionHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3339

## Extended by

- [`MinimalResolutionCacheHost`](MinimalResolutionCacheHost.md)
- [`CompilerHost`](CompilerHost.md)

## Properties

### useCaseSensitiveFileNames?

> `optional` **useCaseSensitiveFileNames**: `boolean` \| () => `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3351

## Methods

### directoryExists()?

> `optional` **directoryExists**(`directoryName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3343

#### Parameters

##### directoryName

`string`

#### Returns

`boolean`

***

### fileExists()

> **fileExists**(`fileName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3340

#### Parameters

##### fileName

`string`

#### Returns

`boolean`

***

### getCurrentDirectory()?

> `optional` **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3349

#### Returns

`string`

***

### getDirectories()?

> `optional` **getDirectories**(`path`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3350

#### Parameters

##### path

`string`

#### Returns

`string`[]

***

### getFileCheckedModuleInfo()?

> `optional` **getFileCheckedModuleInfo**(`containFilePath`): [`FileCheckModuleInfo`](FileCheckModuleInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3354

#### Parameters

##### containFilePath

`string`

#### Returns

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

***

### getJsDocNodeCheckedConfig()?

> `optional` **getJsDocNodeCheckedConfig**(`jsDocFileCheckInfo`, `symbolSourceFilePath`): [`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3352

#### Parameters

##### jsDocFileCheckInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### symbolSourceFilePath

`string`

#### Returns

[`JsDocNodeCheckConfig`](JsDocNodeCheckConfig.md)

***

### getJsDocNodeConditionCheckedResult()?

> `optional` **getJsDocNodeConditionCheckedResult**(`jsDocFileCheckedInfo`, `jsDocs`): [`ConditionCheckResult`](ConditionCheckResult.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3353

#### Parameters

##### jsDocFileCheckedInfo

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

##### jsDocs

[`JsDocTagInfo`](JsDocTagInfo.md)[]

#### Returns

[`ConditionCheckResult`](ConditionCheckResult.md)

***

### readFile()

> **readFile**(`fileName`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3341

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| `string`

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3348

Resolve a symbolic link.

#### Parameters

##### path

`string`

#### Returns

`string`

#### See

https://nodejs.org/api/fs.html#fs_fs_realpathsync_path_options

***

### trace()?

> `optional` **trace**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3342

#### Parameters

##### s

`string`

#### Returns

`void`
