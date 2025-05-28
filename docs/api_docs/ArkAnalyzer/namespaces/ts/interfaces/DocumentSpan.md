[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / DocumentSpan

# Interface: DocumentSpan

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6700

## Extended by

- [`RenameLocation`](RenameLocation.md)
- [`ReferenceEntry`](ReferenceEntry.md)
- [`ImplementationLocation`](ImplementationLocation.md)
- [`DefinitionInfo`](DefinitionInfo.md)

## Properties

### contextSpan?

> `optional` **contextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6713

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

***

### fileName

> **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6702

***

### originalContextSpan?

> `optional` **originalContextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6714

***

### originalFileName?

> `optional` **originalFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6708

***

### originalTextSpan?

> `optional` **originalTextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6707

If the span represents a location that was remapped (e.g. via a .d.ts.map file),
then the original filename and span will be specified here

***

### textSpan

> **textSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6701
