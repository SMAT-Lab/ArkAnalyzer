[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createParameter

# Variable: ~~createParameter()~~

> `const` **createParameter**: \{(`modifiers`, `dotDotDotToken`, `name`, `questionToken?`, `type?`, `initializer?`): [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md); (`decorators`, `modifiers`, `dotDotDotToken`, `name`, `questionToken?`, `type?`, `initializer?`): [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7511

## Call Signature

> (`modifiers`, `dotDotDotToken`, `name`, `questionToken?`, `type?`, `initializer?`): [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

#### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

#### questionToken?

[`QuestionToken`](../type-aliases/QuestionToken.md)

#### type?

[`TypeNode`](../interfaces/TypeNode.md)

#### initializer?

[`Expression`](../interfaces/Expression.md)

### Returns

[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `dotDotDotToken`, `name`, `questionToken?`, `type?`, `initializer?`): [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### dotDotDotToken

`undefined` | [`DotDotDotToken`](../type-aliases/DotDotDotToken.md)

#### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

#### questionToken?

[`QuestionToken`](../type-aliases/QuestionToken.md)

#### type?

[`TypeNode`](../interfaces/TypeNode.md)

#### initializer?

[`Expression`](../interfaces/Expression.md)

### Returns

[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)

## Deprecated

Use `factory.createParameterDeclaration` or the factory supplied by your transformation context instead.
