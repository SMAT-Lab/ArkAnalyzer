[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / PerDirectoryResolutionCache

# Interface: PerDirectoryResolutionCache\<T\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5376

Cached resolutions per containing directory.
This assumes that any module id will have the same resolution for sibling files located in the same folder.

## Extended by

- [`TypeReferenceDirectiveResolutionCache`](TypeReferenceDirectiveResolutionCache.md)
- [`ModuleResolutionCache`](ModuleResolutionCache.md)

## Type Parameters

### T

`T`

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5378

#### Returns

`void`

***

### getOrCreateCacheForDirectory()

> **getOrCreateCacheForDirectory**(`directoryName`, `redirectedReference?`): [`ModeAwareCache`](ModeAwareCache.md)\<`T`\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5377

#### Parameters

##### directoryName

`string`

##### redirectedReference?

[`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`ModeAwareCache`](ModeAwareCache.md)\<`T`\>

***

### update()

> **update**(`options`): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5383

Updates with the current compilerOptions the cache will operate with.
 This updates the redirects map as well if needed so module resolutions are cached if they can across the projects

#### Parameters

##### options

[`CompilerOptions`](CompilerOptions.md)

#### Returns

`void`
