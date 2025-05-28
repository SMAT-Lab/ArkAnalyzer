[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateImportTypeNode

# Variable: ~~updateImportTypeNode()~~

> `const` **updateImportTypeNode**: \{(`node`, `argument`, `assertions`, `qualifier`, `typeArguments`, `isTypeOf?`): [`ImportTypeNode`](../interfaces/ImportTypeNode.md); (`node`, `argument`, `qualifier`, `typeArguments`, `isTypeOf?`): [`ImportTypeNode`](../interfaces/ImportTypeNode.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7652

## Call Signature

> (`node`, `argument`, `assertions`, `qualifier`, `typeArguments`, `isTypeOf?`): [`ImportTypeNode`](../interfaces/ImportTypeNode.md)

### Parameters

#### node

[`ImportTypeNode`](../interfaces/ImportTypeNode.md)

#### argument

[`TypeNode`](../interfaces/TypeNode.md)

#### assertions

`undefined` | [`ImportTypeAssertionContainer`](../interfaces/ImportTypeAssertionContainer.md)

#### qualifier

`undefined` | [`EntityName`](../type-aliases/EntityName.md)

#### typeArguments

`undefined` | readonly [`TypeNode`](../interfaces/TypeNode.md)[]

#### isTypeOf?

`boolean`

### Returns

[`ImportTypeNode`](../interfaces/ImportTypeNode.md)

## Call Signature

> (`node`, `argument`, `qualifier`, `typeArguments`, `isTypeOf?`): [`ImportTypeNode`](../interfaces/ImportTypeNode.md)

### Parameters

#### node

[`ImportTypeNode`](../interfaces/ImportTypeNode.md)

#### argument

[`TypeNode`](../interfaces/TypeNode.md)

#### qualifier

`undefined` | [`EntityName`](../type-aliases/EntityName.md)

#### typeArguments

`undefined` | readonly [`TypeNode`](../interfaces/TypeNode.md)[]

#### isTypeOf?

`boolean`

### Returns

[`ImportTypeNode`](../interfaces/ImportTypeNode.md)

## Deprecated

Use `factory.updateImportTypeNode` or the factory supplied by your transformation context instead.
