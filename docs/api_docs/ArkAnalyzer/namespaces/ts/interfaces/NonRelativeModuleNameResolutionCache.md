[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / NonRelativeModuleNameResolutionCache

# Interface: NonRelativeModuleNameResolutionCache

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5392

Stored map from non-relative module name to a table: directory -> result of module lookup in this directory
We support only non-relative module names because resolution of relative module names is usually more deterministic and thus less expensive.

## Extends

- [`PackageJsonInfoCache`](PackageJsonInfoCache.md)

## Extended by

- [`ModuleResolutionCache`](ModuleResolutionCache.md)

## Methods

### clear()

> **clear**(): `void`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5396

#### Returns

`void`

#### Inherited from

[`PackageJsonInfoCache`](PackageJsonInfoCache.md).[`clear`](PackageJsonInfoCache.md#clear)

***

### getOrCreateCacheForModuleName()

> **getOrCreateCacheForModuleName**(`nonRelativeModuleName`, `mode`, `redirectedReference?`): [`PerModuleNameCache`](PerModuleNameCache.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5393

#### Parameters

##### nonRelativeModuleName

`string`

##### mode

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

##### redirectedReference?

[`ResolvedProjectReference`](ResolvedProjectReference.md)

#### Returns

[`PerModuleNameCache`](PerModuleNameCache.md)
