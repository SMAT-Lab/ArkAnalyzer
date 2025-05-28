[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / SignatureHelpItem

# Interface: SignatureHelpItem

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6934

Represents a single signature to show in signature help.
The id is used for subsequent calls into the language service to ask questions about the
signature help item in the context of any documents that have been updated.  i.e. after
an edit has happened, while signature help is still active, the host can ask important
questions like 'what parameter is the user currently contained within?'.

## Properties

### documentation

> **documentation**: [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6940

***

### isVariadic

> **isVariadic**: `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6935

***

### parameters

> **parameters**: [`SignatureHelpParameter`](SignatureHelpParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6939

***

### prefixDisplayParts

> **prefixDisplayParts**: [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6936

***

### separatorDisplayParts

> **separatorDisplayParts**: [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6938

***

### suffixDisplayParts

> **suffixDisplayParts**: [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6937

***

### tags

> **tags**: [`JSDocTagInfo`](JSDocTagInfo-1.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6941
