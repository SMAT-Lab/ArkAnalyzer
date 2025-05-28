[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / hasJSDocParameterTags

# Function: hasJSDocParameterTags()

> **hasJSDocParameterTags**(`node`): `boolean`

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4767

Return true if the node has JSDoc parameter tags.

## Parameters

### node

[`MethodDeclaration`](../interfaces/MethodDeclaration.md) | [`GetAccessorDeclaration`](../interfaces/GetAccessorDeclaration.md) | [`SetAccessorDeclaration`](../interfaces/SetAccessorDeclaration.md) | [`IndexSignatureDeclaration`](../interfaces/IndexSignatureDeclaration.md) | [`CallSignatureDeclaration`](../interfaces/CallSignatureDeclaration.md) | [`ConstructSignatureDeclaration`](../interfaces/ConstructSignatureDeclaration.md) | [`MethodSignature`](../interfaces/MethodSignature.md) | [`FunctionTypeNode`](../interfaces/FunctionTypeNode.md) | [`ConstructorTypeNode`](../interfaces/ConstructorTypeNode.md) | [`JSDocFunctionType`](../interfaces/JSDocFunctionType.md) | [`FunctionDeclaration`](../interfaces/FunctionDeclaration.md) | [`ConstructorDeclaration`](../interfaces/ConstructorDeclaration.md) | [`FunctionExpression`](../interfaces/FunctionExpression.md) | [`ArrowFunction`](../interfaces/ArrowFunction.md)

## Returns

`boolean`

## Remarks

Includes parameter tags that are not directly on the node,
for example on a variable declaration whose initializer is a function expression.
