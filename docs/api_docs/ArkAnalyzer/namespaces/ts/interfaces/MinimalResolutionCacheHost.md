[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / MinimalResolutionCacheHost

# Interface: MinimalResolutionCacheHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3359

Used by services to specify the minimum host area required to set up source files under any compilation settings

## Extends

- [`ModuleResolutionHost`](ModuleResolutionHost.md)

## Extended by

- [`LanguageServiceHost`](LanguageServiceHost.md)

## Properties

### useCaseSensitiveFileNames?

> `optional` **useCaseSensitiveFileNames**: `boolean` \| () => `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3351

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`useCaseSensitiveFileNames`](ModuleResolutionHost.md#usecasesensitivefilenames)

## Methods

### directoryExists()?

> `optional` **directoryExists**(`directoryName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3343

#### Parameters

##### directoryName

`string`

#### Returns

`boolean`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`directoryExists`](ModuleResolutionHost.md#directoryexists)

***

### fileExists()

> **fileExists**(`fileName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3340

#### Parameters

##### fileName

`string`

#### Returns

`boolean`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`fileExists`](ModuleResolutionHost.md#fileexists)

***

### getCompilationSettings()

> **getCompilationSettings**(): [`CompilerOptions`](CompilerOptions.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3360

#### Returns

[`CompilerOptions`](CompilerOptions.md)

***

### getCompilerHost()?

> `optional` **getCompilerHost**(): `undefined` \| [`CompilerHost`](CompilerHost.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3361

#### Returns

`undefined` \| [`CompilerHost`](CompilerHost.md)

***

### getCurrentDirectory()?

> `optional` **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3349

#### Returns

`string`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getCurrentDirectory`](ModuleResolutionHost.md#getcurrentdirectory)

***

### getDirectories()?

> `optional` **getDirectories**(`path`): `string`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3350

#### Parameters

##### path

`string`

#### Returns

`string`[]

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getDirectories`](ModuleResolutionHost.md#getdirectories)

***

### getFileCheckedModuleInfo()?

> `optional` **getFileCheckedModuleInfo**(`containFilePath`): [`FileCheckModuleInfo`](FileCheckModuleInfo.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3354

#### Parameters

##### containFilePath

`string`

#### Returns

[`FileCheckModuleInfo`](FileCheckModuleInfo.md)

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getFileCheckedModuleInfo`](ModuleResolutionHost.md#getfilecheckedmoduleinfo)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getJsDocNodeCheckedConfig`](ModuleResolutionHost.md#getjsdocnodecheckedconfig)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`getJsDocNodeConditionCheckedResult`](ModuleResolutionHost.md#getjsdocnodeconditioncheckedresult)

***

### readFile()

> **readFile**(`fileName`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3341

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| `string`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`readFile`](ModuleResolutionHost.md#readfile)

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

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`realpath`](ModuleResolutionHost.md#realpath)

***

### trace()?

> `optional` **trace**(`s`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3342

#### Parameters

##### s

`string`

#### Returns

`void`

#### Inherited from

[`ModuleResolutionHost`](ModuleResolutionHost.md).[`trace`](ModuleResolutionHost.md#trace)
