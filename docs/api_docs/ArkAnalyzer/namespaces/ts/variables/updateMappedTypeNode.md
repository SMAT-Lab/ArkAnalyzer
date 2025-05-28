[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateMappedTypeNode

# Variable: ~~updateMappedTypeNode()~~

> `const` **updateMappedTypeNode**: (`node`, `readonlyToken`, `typeParameter`, `nameType`, `questionToken`, `type`, `members`) => [`MappedTypeNode`](../interfaces/MappedTypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7671

## Parameters

### node

[`MappedTypeNode`](../interfaces/MappedTypeNode.md)

### readonlyToken

[`ReadonlyKeyword`](../type-aliases/ReadonlyKeyword.md) | [`PlusToken`](../type-aliases/PlusToken.md) | [`MinusToken`](../type-aliases/MinusToken.md) | `undefined`

### typeParameter

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

### nameType

[`TypeNode`](../interfaces/TypeNode.md) | `undefined`

### questionToken

[`QuestionToken`](../type-aliases/QuestionToken.md) | [`PlusToken`](../type-aliases/PlusToken.md) | [`MinusToken`](../type-aliases/MinusToken.md) | `undefined`

### type

[`TypeNode`](../interfaces/TypeNode.md) | `undefined`

### members

[`NodeArray`](../interfaces/NodeArray.md)\<[`TypeElement`](../interfaces/TypeElement.md)\> | `undefined`

## Returns

[`MappedTypeNode`](../interfaces/MappedTypeNode.md)

## Deprecated

Use `factory.updateMappedTypeNode` or the factory supplied by your transformation context instead.
