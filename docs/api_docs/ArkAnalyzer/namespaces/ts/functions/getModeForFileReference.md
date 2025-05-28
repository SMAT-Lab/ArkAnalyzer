[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getModeForFileReference

# Function: getModeForFileReference()

> **getModeForFileReference**(`ref`, `containingFileMode`): `undefined` \| [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5560

Calculates the resulting resolution mode for some reference in some file - this is generally the explicitly
provided resolution mode in the reference, unless one is not present, in which case it is the mode of the containing file.

## Parameters

### ref

`string` | [`FileReference`](../interfaces/FileReference.md)

### containingFileMode

`undefined` | [`CommonJS`](../enumerations/ModuleKind.md#commonjs) | [`ESNext`](../enumerations/ModuleKind.md#esnext)

## Returns

`undefined` \| [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)
