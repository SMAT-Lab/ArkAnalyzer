[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createVariableDeclaration

# Variable: ~~createVariableDeclaration()~~

> `const` **createVariableDeclaration**: \{(`name`, `type?`, `initializer?`): [`VariableDeclaration`](../interfaces/VariableDeclaration.md); (`name`, `exclamationToken`, `type`, `initializer`): [`VariableDeclaration`](../interfaces/VariableDeclaration.md); \}

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8263

## Call Signature

> (`name`, `type?`, `initializer?`): [`VariableDeclaration`](../interfaces/VariableDeclaration.md)

### Parameters

#### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

#### type?

[`TypeNode`](../interfaces/TypeNode.md)

#### initializer?

[`Expression`](../interfaces/Expression.md)

### Returns

[`VariableDeclaration`](../interfaces/VariableDeclaration.md)

## Call Signature

> (`name`, `exclamationToken`, `type`, `initializer`): [`VariableDeclaration`](../interfaces/VariableDeclaration.md)

### Parameters

#### name

`string` | [`BindingName`](../type-aliases/BindingName.md)

#### exclamationToken

`undefined` | [`ExclamationToken`](../type-aliases/ExclamationToken.md)

#### type

`undefined` | [`TypeNode`](../interfaces/TypeNode.md)

#### initializer

`undefined` | [`Expression`](../interfaces/Expression.md)

### Returns

[`VariableDeclaration`](../interfaces/VariableDeclaration.md)

## Deprecated

Use `factory.createVariableDeclaration` or the factory supplied by your transformation context instead.
