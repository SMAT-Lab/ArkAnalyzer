[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / updateProperty

# Variable: ~~updateProperty()~~

> `const` **updateProperty**: \{(`node`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md); (`node`, `decorators`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7530

## Call Signature

> (`node`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

### Parameters

#### node

[`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

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

> (`node`, `decorators`, `modifiers`, `name`, `questionOrExclamationToken`, `type`, `initializer`): [`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

### Parameters

#### node

[`PropertyDeclaration`](../interfaces/PropertyDeclaration.md)

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

Use `factory.updatePropertyDeclaration` or the factory supplied by your transformation context instead.
