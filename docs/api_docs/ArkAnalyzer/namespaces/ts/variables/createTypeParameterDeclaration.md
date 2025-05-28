[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createTypeParameterDeclaration

# Variable: ~~createTypeParameterDeclaration()~~

> `const` **createTypeParameterDeclaration**: \{(`modifiers`, `name`, `constraint?`, `defaultType?`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md); (`name`, `constraint?`, `defaultType?`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7501

## Call Signature

> (`modifiers`, `name`, `constraint?`, `defaultType?`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

`string` | [`Identifier`](../interfaces/Identifier.md)

#### constraint?

[`TypeNode`](../interfaces/TypeNode.md)

#### defaultType?

[`TypeNode`](../interfaces/TypeNode.md)

### Returns

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

## Call Signature

> (`name`, `constraint?`, `defaultType?`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

### Parameters

#### name

`string` | [`Identifier`](../interfaces/Identifier.md)

#### constraint?

[`TypeNode`](../interfaces/TypeNode.md)

#### defaultType?

[`TypeNode`](../interfaces/TypeNode.md)

### Returns

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

## Deprecated

Use `factory.createTypeParameterDeclaration` or the factory supplied by your transformation context instead.
