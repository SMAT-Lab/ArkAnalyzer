[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateTypeParameterDeclaration

# Variable: ~~updateTypeParameterDeclaration()~~

> `const` **updateTypeParameterDeclaration**: \{(`node`, `modifiers`, `name`, `constraint`, `defaultType`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md); (`node`, `name`, `constraint`, `defaultType`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7506

## Call Signature

> (`node`, `modifiers`, `name`, `constraint`, `defaultType`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

### Parameters

#### node

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

[`Identifier`](../interfaces/Identifier.md)

#### constraint

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### defaultType

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

### Returns

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

## Call Signature

> (`node`, `name`, `constraint`, `defaultType`): [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

### Parameters

#### node

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

#### name

[`Identifier`](../interfaces/Identifier.md)

#### constraint

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### defaultType

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

### Returns

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

## Deprecated

Use `factory.updateTypeParameterDeclaration` or the factory supplied by your transformation context instead.
