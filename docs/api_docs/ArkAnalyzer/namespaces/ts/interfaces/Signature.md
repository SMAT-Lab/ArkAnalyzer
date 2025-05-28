[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / Signature

# Interface: Signature

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2936

## Properties

### declaration?

> `optional` **declaration**: [`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md) \| [`JSDocSignature`](JSDocSignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2937

***

### parameters

> **parameters**: readonly [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2939

***

### typeParameters?

> `optional` **typeParameters**: readonly [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:2938

## Methods

### getDeclaration()

> **getDeclaration**(): [`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6148

#### Returns

[`SignatureDeclaration`](../type-aliases/SignatureDeclaration.md)

***

### getDocumentationComment()

> **getDocumentationComment**(`typeChecker`): [`SymbolDisplayPart`](SymbolDisplayPart.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6153

#### Parameters

##### typeChecker

`undefined` | [`TypeChecker`](TypeChecker.md)

#### Returns

[`SymbolDisplayPart`](SymbolDisplayPart.md)[]

***

### getJsDocTags()

> **getJsDocTags**(): [`JSDocTagInfo`](JSDocTagInfo-1.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6154

#### Returns

[`JSDocTagInfo`](JSDocTagInfo-1.md)[]

***

### getParameters()

> **getParameters**(): [`Symbol`](Symbol.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6150

#### Returns

[`Symbol`](Symbol.md)[]

***

### getReturnType()

> **getReturnType**(): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6152

#### Returns

[`Type`](Type.md)

***

### getTypeParameterAtPosition()

> **getTypeParameterAtPosition**(`pos`): [`Type`](Type.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6151

#### Parameters

##### pos

`number`

#### Returns

[`Type`](Type.md)

***

### getTypeParameters()

> **getTypeParameters**(): `undefined` \| [`TypeParameter`](TypeParameter.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:6149

#### Returns

`undefined` \| [`TypeParameter`](TypeParameter.md)[]
