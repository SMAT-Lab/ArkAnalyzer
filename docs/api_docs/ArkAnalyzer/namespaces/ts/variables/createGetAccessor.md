[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createGetAccessor

# Variable: ~~createGetAccessor()~~

> `const` **createGetAccessor**: \{(`modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md); (`decorators`, `modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7555

## Call Signature

> (`modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md)

### Parameters

#### modifiers

`undefined` | readonly [`ModifierLike`](../type-aliases/ModifierLike.md)[]

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md)

## Call Signature

> (`decorators`, `modifiers`, `name`, `parameters`, `type`, `body`): [`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md)

### Parameters

#### decorators

`undefined` | readonly [`Decorator`](../interfaces/Decorator.md)[]

#### modifiers

`undefined` | readonly [`Modifier`](../type-aliases/Modifier.md)[]

#### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

#### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### body

`undefined` | [`Block`](../interfaces/Block.md)

### Returns

[`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md)

## Deprecated

Use `factory.createGetAccessorDeclaration` or the factory supplied by your transformation context instead.
