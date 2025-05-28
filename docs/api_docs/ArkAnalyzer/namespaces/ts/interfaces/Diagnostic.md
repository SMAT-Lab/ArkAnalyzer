[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Diagnostic

# Interface: Diagnostic

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2994

## Extends

- [`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md)

## Extended by

- [`DiagnosticWithLocation`](DiagnosticWithLocation.md)

## Properties

### category

> **category**: [`DiagnosticCategory`](../enumerations/DiagnosticCategory.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3002

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`category`](DiagnosticRelatedInformation.md#category)

***

### code

> **code**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3003

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`code`](DiagnosticRelatedInformation.md#code)

***

### file

> **file**: `undefined` \| [`SourceFile`](SourceFile.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3004

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`file`](DiagnosticRelatedInformation.md#file)

***

### length

> **length**: `undefined` \| `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3006

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`length`](DiagnosticRelatedInformation.md#length)

***

### messageText

> **messageText**: `string` \| [`DiagnosticMessageChain`](DiagnosticMessageChain.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3007

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`messageText`](DiagnosticRelatedInformation.md#messagetext)

***

### relatedInformation?

> `optional` **relatedInformation**: [`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2999

***

### reportsDeprecated?

> `optional` **reportsDeprecated**: `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2997

***

### reportsUnnecessary?

> `optional` **reportsUnnecessary**: `object`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2996

May store more in future. For now, this will simply be `true` to indicate when a diagnostic is an unused-identifier diagnostic.

***

### source?

> `optional` **source**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2998

***

### start

> **start**: `undefined` \| `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:3005

#### Inherited from

[`DiagnosticRelatedInformation`](DiagnosticRelatedInformation.md).[`start`](DiagnosticRelatedInformation.md#start)
