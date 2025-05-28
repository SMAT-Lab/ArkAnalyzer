[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createProperty

# Variable: ~~createProperty()~~

> `const` **createProperty**: \{(`modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md); (`decorators`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7525

## Call Signature

> (`modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### questionOrExclamationToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### initializer

`undefined` | [`Expression`](../interfaces/Expression.md)

### Returns

[`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### questionOrExclamationToken

`undefined` | [`QuestionToken`](../type-aliases/QuestionToken.md) | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### initializer

`undefined` | [`Expression`](../interfaces/Expression.md)

### Returns

[`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

## Deprecated

Use `factory.createPropertyDeclaration` or the factory supplied by your transformation context instead.
