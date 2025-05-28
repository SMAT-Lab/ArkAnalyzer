[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ResolvedModuleFull

# Interface: ResolvedModuleFull

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3381

ResolvedModule with an explicitly provided `extension` property.
Prefer this over `ResolvedModule`.
If changing this, remember to change `moduleResolutionIsEqualTo`.

## Extends

- [`ResolvedModule`](ResolvedModule.md)

## Properties

### extension

> **extension**: [`Extension`](../enumerations/Extension.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3386

Extension of resolvedFileName. This must match what's at the end of resolvedFileName.
This is optional for backwards-compatibility, but will be added if not provided.

***

### isExternalLibraryImport?

> `optional` **isExternalLibraryImport**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3374

True if `resolvedFileName` comes from `node_modules`.

#### Inherited from

[`ResolvedModule`](ResolvedModule.md).[`isExternalLibraryImport`](ResolvedModule.md#isexternallibraryimport)

***

### packageId?

> `optional` **packageId**: [`PackageId`](PackageId.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3387

***

### resolvedFileName

> **resolvedFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3372

Path of the file the module was resolved to.

#### Inherited from

[`ResolvedModule`](ResolvedModule.md).[`resolvedFileName`](ResolvedModule.md#resolvedfilename)
