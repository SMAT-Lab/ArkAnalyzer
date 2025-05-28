[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ModuleSpecifierResolutionHost

# Interface: ModuleSpecifierResolutionHost

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4340

## Extended by

- [`EmitHost`](EmitHost.md)

## Properties

### redirectTargetsMap

> `readonly` **redirectTargetsMap**: [`RedirectTargetsMap`](../type-aliases/RedirectTargetsMap.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4351

## Methods

### directoryExists()?

> `optional` **directoryExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4344

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### fileExists()

> **fileExists**(`path`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4342

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### getCurrentDirectory()

> **getCurrentDirectory**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4343

#### Returns

`string`

***

### getGlobalTypingsCacheLocation()?

> `optional` **getGlobalTypingsCacheLocation**(): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4349

#### Returns

`undefined` \| `string`

***

### getModuleSpecifierCache()?

> `optional` **getModuleSpecifierCache**(): [`ModuleSpecifierCache`](ModuleSpecifierCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4347

#### Returns

[`ModuleSpecifierCache`](ModuleSpecifierCache.md)

***

### getNearestAncestorDirectoryWithPackageJson()?

> `optional` **getNearestAncestorDirectoryWithPackageJson**(`fileName`, `rootDir?`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4350

#### Parameters

##### fileName

`string`

##### rootDir?

`string`

#### Returns

`undefined` \| `string`

***

### getPackageJsonInfoCache()?

> `optional` **getPackageJsonInfoCache**(): `undefined` \| [`PackageJsonInfoCache`](PackageJsonInfoCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4348

#### Returns

`undefined` \| [`PackageJsonInfoCache`](PackageJsonInfoCache.md)

***

### getProjectReferenceRedirect()

> **getProjectReferenceRedirect**(`fileName`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4352

#### Parameters

##### fileName

`string`

#### Returns

`undefined` \| `string`

***

### isSourceOfProjectReferenceRedirect()

> **isSourceOfProjectReferenceRedirect**(`fileName`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4353

#### Parameters

##### fileName

`string`

#### Returns

`boolean`

***

### readFile()?

> `optional` **readFile**(`path`): `undefined` \| `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4345

#### Parameters

##### path

`string`

#### Returns

`undefined` \| `string`

***

### realpath()?

> `optional` **realpath**(`path`): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4346

#### Parameters

##### path

`string`

#### Returns

`string`

***

### useCaseSensitiveFileNames()?

> `optional` **useCaseSensitiveFileNames**(): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4341

#### Returns

`boolean`
