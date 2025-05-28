[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createMethod

# Variable: ~~createMethod()~~

> `const` **createMethod**: \{(`modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](../interfaces/MethodDeclaration.md); (`decorators`, `modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](../interfaces/MethodDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7535

## Call Signature

> (`modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](../interfaces/MethodDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`MethodDeclaration`](../interfaces/MethodDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `asteriskToken`, `name`, `questionToken`, `typeParameters`, `parameters`, `type`, `body`): [`MethodDeclaration`](../interfaces/MethodDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### asteriskToken

`undefined` | [`AsteriskToken`](../type-aliases/AsteriskToken.md)

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### questionToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md)

#### typeParameters

`undefined` | readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[]

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`MethodDeclaration`](../interfaces/MethodDeclaration.md)

## Deprecated

Use `factory.createMethodDeclaration` or the factory supplied by your transformation context instead.
