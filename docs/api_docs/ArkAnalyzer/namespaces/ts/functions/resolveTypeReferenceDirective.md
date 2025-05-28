[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / resolveTypeReferenceDirective

# Function: resolveTypeReferenceDirective()

> **resolveTypeReferenceDirective**(`typeReferenceDirectiveName`, `containingFile`, `options`, `host`, `redirectedReference?`, `cache?`, `resolutionMode?`): [`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](../interfaces/ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5352

## Parameters

### typeReferenceDirectiveName

`string`

### containingFile

file that contains type reference directive, can be undefined if containing file is unknown.
This is possible in case if resolution is performed for directives specified via 'types' parameter. In this case initial path for secondary lookups
is assumed to be the same as root directory of the project.

`undefined` | `string`

### options

[`CompilerOptions`](../interfaces/CompilerOptions.md)

### host

[`ModuleResolutionHost`](../interfaces/ModuleResolutionHost.md)

### redirectedReference?

[`ResolvedProjectReference`](../interfaces/ResolvedProjectReference.md)

### cache?

[`TypeReferenceDirectiveResolutionCache`](../interfaces/TypeReferenceDirectiveResolutionCache.md)

### resolutionMode?

[`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

## Returns

[`ResolvedTypeReferenceDirectiveWithFailedLookupLocations`](../interfaces/ResolvedTypeReferenceDirectiveWithFailedLookupLocations.md)
