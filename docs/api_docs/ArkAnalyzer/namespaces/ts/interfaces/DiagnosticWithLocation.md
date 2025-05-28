[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / DiagnosticWithLocation

# Interface: DiagnosticWithLocation

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3009

## Extends

- [`Diagnostic`](Diagnostic.md)

## Properties

### category

> **category**: [`DiagnosticCategory`](../enumerations/DiagnosticCategory.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3002

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`category`](Diagnostic.md#category)

***

### code

> **code**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3003

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`code`](Diagnostic.md#code)

***

### file

> **file**: [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3010

#### Overrides

[`Diagnostic`](Diagnostic.md).[`file`](Diagnostic.md#file)

***

### length

> **length**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3012

#### Overrides

[`Diagnostic`](Diagnostic.md).[`length`](Diagnostic.md#length)

***

### messageText

> **messageText**: `string` \| [`DiagnosticMessageChain`](DiagnosticMessageChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3007

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`messageText`](Diagnostic.md#messagetext)

***

### relatedInformation?

> `optional` **relatedInformation**: [`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2999

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`relatedInformation`](Diagnostic.md#relatedinformation)

***

### reportsDeprecated?

> `optional` **reportsDeprecated**: `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2997

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`reportsDeprecated`](Diagnostic.md#reportsdeprecated)

***

### reportsUnnecessary?

> `optional` **reportsUnnecessary**: `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2996

May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic.

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`reportsUnnecessary`](Diagnostic.md#reportsunnecessary)

***

### source?

> `optional` **source**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2998

#### Inherited from

[`Diagnostic`](Diagnostic.md).[`source`](Diagnostic.md#source)

***

### start

> **start**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3011

#### Overrides

[`Diagnostic`](Diagnostic.md).[`start`](Diagnostic.md#start)
