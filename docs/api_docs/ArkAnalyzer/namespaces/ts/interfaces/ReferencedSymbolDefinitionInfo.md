[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / ReferencedSymbolDefinitionInfo

# Interface: ReferencedSymbolDefinitionInfo

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6832

## Extends

- [`DefinitionInfo`](DefinitionInfo.md)

## Properties

### containerKind

> **containerKind**: [`ScriptElementKind`](../enumerations/ScriptElementKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6824

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`containerKind`](DefinitionInfo.md#containerkind)

***

### containerName

> **containerName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6825

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`containerName`](DefinitionInfo.md#containername)

***

### contextSpan?

> `optional` **contextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6713

If DocumentSpan.textSpan is the span for name of the declaration,
then this is the span for relevant declaration

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`contextSpan`](DefinitionInfo.md#contextspan)

***

### displayParts

> **displayParts**: [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6833

***

### fileName

> **fileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6702

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`fileName`](DefinitionInfo.md#filename)

***

### kind

> **kind**: [`ScriptElementKind`](../enumerations/ScriptElementKind.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6822

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`kind`](DefinitionInfo.md#kind)

***

### name

> **name**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6823

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`name`](DefinitionInfo.md#name)

***

### originalContextSpan?

> `optional` **originalContextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6714

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`originalContextSpan`](DefinitionInfo.md#originalcontextspan)

***

### originalFileName?

> `optional` **originalFileName**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6708

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`originalFileName`](DefinitionInfo.md#originalfilename)

***

### originalTextSpan?

> `optional` **originalTextSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6707

If the span represents a location that was remapped (e.g. via a .d.ts.map file),
then the original filename and span will be specified here

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`originalTextSpan`](DefinitionInfo.md#originaltextspan)

***

### textSpan

> **textSpan**: [`TextSpan`](TextSpan.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6701

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`textSpan`](DefinitionInfo.md#textspan)

***

### unverified?

> `optional` **unverified**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6826

#### Inherited from

[`DefinitionInfo`](DefinitionInfo.md).[`unverified`](DefinitionInfo.md#unverified)
