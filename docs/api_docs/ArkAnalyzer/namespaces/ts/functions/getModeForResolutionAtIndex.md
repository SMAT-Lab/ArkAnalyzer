[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getModeForResolutionAtIndex

# Function: getModeForResolutionAtIndex()

> **getModeForResolutionAtIndex**(`file`, `index`): `undefined` \| [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5568

Calculates the final resolution mode for an import at some index within a file's imports list. This is generally the explicitly
defined mode of the import if provided, or, if not, the mode of the containing file (with some exceptions: import=require is always commonjs, dynamic import is always esm).
If you have an actual import node, prefer using getModeForUsageLocation on the reference string node.

## Parameters

### file

[`SourceFile`](../interfaces/SourceFile.md)

File to fetch the resolution mode within

### index

`number`

Index into the file's complete resolution list to get the resolution of - this is a concatenation of the file's imports and module augmentations

## Returns

`undefined` \| [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)
