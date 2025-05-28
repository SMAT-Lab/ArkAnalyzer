[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Symbol

# Interface: Symbol

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2668

## Properties

### declarations?

> `optional` **declarations**: [`Declaration`](Declaration.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2671

***

### escapedName

> **escapedName**: [`__String`](../type-aliases/String.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2670

***

### exports?

> `optional` **exports**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2674

***

### exportSymbol?

> `optional` **exportSymbol**: `Symbol`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2676

***

### flags

> **flags**: [`SymbolFlags`](../enumerations/SymbolFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2669

***

### globalExports?

> `optional` **globalExports**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2675

***

### members?

> `optional` **members**: [`SymbolTable`](../type-aliases/SymbolTable.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2673

***

### name

> `readonly` **name**: `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6111

***

### valueDeclaration?

> `optional` **valueDeclaration**: [`Declaration`](Declaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2672

## Methods

### getDeclarations()

> **getDeclarations**(): `undefined` \| [`Declaration`](Declaration.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6115

#### Returns

`undefined` \| [`Declaration`](Declaration.md)[]

***

### getDocumentationComment()

> **getDocumentationComment**(`typeChecker`): [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6116

#### Parameters

##### typeChecker

`undefined` | [`TypeChecker`](TypeChecker.md)

#### Returns

[`SymbolDisplayPart`](SymbolDisplayPart.md)[]

***

### getEscapedName()

> **getEscapedName**(): [`__String`](../type-aliases/String.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6113

#### Returns

[`__String`](../type-aliases/String.md)

***

### getFlags()

> **getFlags**(): [`SymbolFlags`](../enumerations/SymbolFlags.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6112

#### Returns

[`SymbolFlags`](../enumerations/SymbolFlags.md)

***

### getJsDocTags()

> **getJsDocTags**(`checker?`): [`JSDocTagInfo`](JSDocTagInfo-1.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6117

#### Parameters

##### checker?

[`TypeChecker`](TypeChecker.md)

#### Returns

[`JSDocTagInfo`](JSDocTagInfo-1.md)[]

***

### getName()

> **getName**(): `string`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6114

#### Returns

`string`
