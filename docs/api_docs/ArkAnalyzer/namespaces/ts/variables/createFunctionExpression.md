[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createFunctionExpression

# Variable: ~~createFunctionExpression()~~

> `const` **createFunctionExpression**: (`modifiers`, `asteriskToken`, `name`, `typeParameters`, `parameters`, `type`, `body`) => [`FunctionExpression`](../interfaces/FunctionExpression.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:7733

## Parameters

### modifiers

readonly [`Modifier`](../type-aliases/Modifier.md)[] | `undefined`

### asteriskToken

[`AsteriskToken`](../type-aliases/AsteriskToken.md) | `undefined`

### name

`string` | [`Identifier`](../interfaces/Identifier.md) | `undefined`

### typeParameters

readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[] | `undefined`

### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[] | `undefined`

### type

[`TypeNode`](../interfaces/TypeNode.md) | `undefined`

### body

[`Block`](../interfaces/Block.md)

## Returns

[`FunctionExpression`](../interfaces/FunctionExpression.md)

## Deprecated

Use `factory.createFunctionExpression` or the factory supplied by your transformation context instead.
