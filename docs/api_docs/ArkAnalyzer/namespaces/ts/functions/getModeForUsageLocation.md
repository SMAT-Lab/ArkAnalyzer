[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getModeForUsageLocation

# Function: getModeForUsageLocation()

> **getModeForUsageLocation**(`file`, `usage`): `undefined` \| [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:5578

Calculates the final resolution mode for a given module reference node. This is generally the explicitly provided resolution mode, if
one exists, or the mode of the containing source file. (Excepting import=require, which is always commonjs, and dynamic import, which is always esm).
Notably, this function always returns `undefined` if the containing file has an `undefined` `impliedNodeFormat` - this field is only set when
`moduleResolution` is `node16`+.

## Parameters

### file

The file the import or import-like reference is contained within

#### impliedNodeFormat?

[`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

### usage

[`StringLiteralLike`](../type-aliases/StringLiteralLike.md)

The module reference string

## Returns

`undefined` \| [`CommonJS`](../enumerations/ModuleKind.md#commonjs) \| [`ESNext`](../enumerations/ModuleKind.md#esnext)

The final resolution mode of the import
