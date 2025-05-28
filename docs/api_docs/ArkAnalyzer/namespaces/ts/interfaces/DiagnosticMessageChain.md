[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / DiagnosticMessageChain

# Interface: DiagnosticMessageChain

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2988

A linked list of formatted diagnostic messages to be used as part of a multiline message.
It is built from the bottom up, leaving the head to be the "main" diagnostic.
While it seems that DiagnosticMessageChain is structurally similar to DiagnosticMessage,
the difference is that messages are all preformatted in DMC.

## Properties

### category

> **category**: [`DiagnosticCategory`](../enumerations/DiagnosticCategory.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2990

***

### code

> **code**: `number`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2991

***

### messageText

> **messageText**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2989

***

### next?

> `optional` **next**: `DiagnosticMessageChain`[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2992
