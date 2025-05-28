[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ModuleSpecifierCache

# Interface: ModuleSpecifierCache

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4368

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4373

#### Returns

`void`

***

### count()

> **count**(): `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4374

#### Returns

`number`

***

### get()

> **get**(`fromFileName`, `toFileName`, `preferences`, `options`): `undefined` \| `Readonly`\<[`ResolvedModuleSpecifierInfo`](ResolvedModuleSpecifierInfo.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4369

#### Parameters

##### fromFileName

[`Path`](../type-aliases/Path.md)

##### toFileName

[`Path`](../type-aliases/Path.md)

##### preferences

[`UserPreferences`](UserPreferences.md)

##### options

[`ModuleSpecifierOptions`](ModuleSpecifierOptions.md)

#### Returns

`undefined` \| `Readonly`\<[`ResolvedModuleSpecifierInfo`](ResolvedModuleSpecifierInfo.md)\>

***

### set()

> **set**(`fromFileName`, `toFileName`, `preferences`, `options`, `modulePaths`, `moduleSpecifiers`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4370

#### Parameters

##### fromFileName

[`Path`](../type-aliases/Path.md)

##### toFileName

[`Path`](../type-aliases/Path.md)

##### preferences

[`UserPreferences`](UserPreferences.md)

##### options

[`ModuleSpecifierOptions`](ModuleSpecifierOptions.md)

##### modulePaths

readonly [`ModulePath`](ModulePath.md)[]

##### moduleSpecifiers

readonly `string`[]

#### Returns

`void`

***

### setBlockedByPackageJsonDependencies()

> **setBlockedByPackageJsonDependencies**(`fromFileName`, `toFileName`, `preferences`, `options`, `isBlockedByPackageJsonDependencies`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4371

#### Parameters

##### fromFileName

[`Path`](../type-aliases/Path.md)

##### toFileName

[`Path`](../type-aliases/Path.md)

##### preferences

[`UserPreferences`](UserPreferences.md)

##### options

[`ModuleSpecifierOptions`](ModuleSpecifierOptions.md)

##### isBlockedByPackageJsonDependencies

`boolean`

#### Returns

`void`

***

### setModulePaths()

> **setModulePaths**(`fromFileName`, `toFileName`, `preferences`, `options`, `modulePaths`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4372

#### Parameters

##### fromFileName

[`Path`](../type-aliases/Path.md)

##### toFileName

[`Path`](../type-aliases/Path.md)

##### preferences

[`UserPreferences`](UserPreferences.md)

##### options

[`ModuleSpecifierOptions`](ModuleSpecifierOptions.md)

##### modulePaths

readonly [`ModulePath`](ModulePath.md)[]

#### Returns

`void`
