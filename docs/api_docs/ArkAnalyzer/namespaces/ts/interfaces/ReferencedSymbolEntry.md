[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ReferencedSymbolEntry

# Interface: ReferencedSymbolEntry

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6839

## Extends

- [`ReferenceEntry`](ReferenceEntry.md)

## Properties

### contextSpan?

> `optional` **contextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6713

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`contextSpan`](ReferenceEntry.md#contextspan)

***

### fileName

> **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6702

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`fileName`](ReferenceEntry.md#filename)

***

### isDefinition?

> `optional` **isDefinition**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6840

***

### isInString?

> `optional` **isInString**: `true`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6722

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`isInString`](ReferenceEntry.md#isinstring)

***

### isWriteAccess

> **isWriteAccess**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6721

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`isWriteAccess`](ReferenceEntry.md#iswriteaccess)

***

### originalContextSpan?

> `optional` **originalContextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6714

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`originalContextSpan`](ReferenceEntry.md#originalcontextspan)

***

### originalFileName?

> `optional` **originalFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6708

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`originalFileName`](ReferenceEntry.md#originalfilename)

***

### originalTextSpan?

> `optional` **originalTextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6707

If the span represents a location that was remapped (e.g. via a .d.ts.map file),
then the original filename and span will be specified here

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`originalTextSpan`](ReferenceEntry.md#originaltextspan)

***

### textSpan

> **textSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6701

#### Inherited from

[`ReferenceEntry`](ReferenceEntry.md).[`textSpan`](ReferenceEntry.md#textspan)
