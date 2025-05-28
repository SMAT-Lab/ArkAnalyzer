[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createFunctionDeclaration

# Variable: ~~createFunctionDeclaration()~~

> `const` **createFunctionDeclaration**: \{(`modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md); (`decorators`, `modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7899

## Call Signature

> (`modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

#### name

`undefined` | `string` | [`Identifier`](../interfaces/Identifier.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`): [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

#### name

`undefined` | `string` | [`Identifier`](../interfaces/Identifier.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`FunctionDeclaration`](../interfaces/FunctionDeclaration.md)

## Deprecated

Use `factory.createFunctionDeclaration` or the factory supplied by your transformation context instead.
