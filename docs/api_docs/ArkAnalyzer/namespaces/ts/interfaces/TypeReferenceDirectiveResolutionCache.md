[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / TypeReferenceDirectiveResolutionCache

# Interface: TypeReferenceDirectiveResolutionCache

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5362

Cached resolutions per containing directory.
This assumes that any module id will have the same resolution for sibling files located in the same folder.

## Extends

- [`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>.[`PackageJsonInfoCache`](PackageJsonInfoCache.md)

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5378

#### Returns

`void`

#### Inherited from

[`PackageJsonInfoCache`](PackageJsonInfoCache.md).[`clear`](PackageJsonInfoCache.md#clear)

***

### getOrCreateCacheForDirectory()

> **getOrCreateCacheForDirectory**(`directoryName`, `redirectedReference?`): [`ModeAwareCache`](ModeAwareCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5377

#### Parameters

##### directoryName

`string`

##### redirectedReference?

[`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`ModeAwareCache`](ModeAwareCache.md)\<[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)\>

#### Inherited from

[`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md).[`getOrCreateCacheForDirectory`](PerDirectoryResolutionCache.md#getorcreatecachefordirectory)

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

#### Inherited from

[`PerDirectoryResolutionCache`](PerDirectoryResolutionCache.md).[`update`](PerDirectoryResolutionCache.md#update)
