[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createSetAccessor

# Variable: ~~createSetAccessor()~~

> `const` **createSetAccessor**: \{(`modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md); (`decorators`, `modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7565

## Call Signature

> (`modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `name`, `parameters`, `body`): [`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md)

## Deprecated

Use `factory.createSetAccessorDeclaration` or the factory supplied by your transformation context instead.
