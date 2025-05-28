[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ResolvedModule

# Interface: ResolvedModule

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3370

Represents the result of module resolution.
Module resolution will pick up tsx/jsx/js files even if '--jsx' and '--allowJs' are turned off.
The Program will then filter results based on these flags.

Prefer to return a `ResolvedModuleFull` so that the file type does not have to be inferred.

## Extended by

- [`ResolvedModuleFull`](ResolvedModuleFull.md)

## Properties

### isExternalLibraryImport?

> `optional` **isExternalLibraryImport**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3374

True if `resolvedFileName` comes from `node_modules`.

***

### resolvedFileName

> **resolvedFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3372

Path of the file the module was resolved to.
