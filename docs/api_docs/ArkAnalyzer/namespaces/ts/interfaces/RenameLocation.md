[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / RenameLocation

# Interface: RenameLocation

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6716

## Extends

- [`DocumentSpan`](DocumentSpan.md)

## Properties

### contextSpan?

> `optional` **contextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6713

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

#### Inherited from

[`DocumentSpan`](DocumentSpan.md).[`contextSpan`](DocumentSpan.md#contextspan)

***

### fileName

> **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6702

#### Inherited from

[`DocumentSpan`](DocumentSpan.md).[`fileName`](DocumentSpan.md#filename)

***

### originalContextSpan?

> `optional` **originalContextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6714

#### Inherited from

[`DocumentSpan`](DocumentSpan.md).[`originalContextSpan`](DocumentSpan.md#originalcontextspan)

***

### originalFileName?

> `optional` **originalFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6708

#### Inherited from

[`DocumentSpan`](DocumentSpan.md).[`originalFileName`](DocumentSpan.md#originalfilename)

***

### originalTextSpan?

> `optional` **originalTextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6707

If the span represents a location that was remapped (e.g. via a .d.ts.map file),
then the original filename and span will be specified here

#### Inherited from

[`DocumentSpan`](DocumentSpan.md).[`originalTextSpan`](DocumentSpan.md#originaltextspan)

***

### prefixText?

> `readonly` `optional` **prefixText**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6717

***

### suffixText?

> `readonly` `optional` **suffixText**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6718

***

### textSpan

> **textSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6701

#### Inherited from

[`DocumentSpan`](DocumentSpan.md).[`textSpan`](DocumentSpan.md#textspan)
