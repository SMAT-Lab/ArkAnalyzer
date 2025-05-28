[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / createMethodSignature

# Variable: ~~createMethodSignature()~~

> `const` **createMethodSignature**: (`typeParameters`, `parameters`, `type`, `name`, `questionToken`) => [`MethodSignature`](../interfaces/MethodSignature.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:8210

## Parameters

### typeParameters

readonly [`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)[] | `undefined`

### parameters

readonly [`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)[]

### type

[`TypeNode`](../interfaces/TypeNode.md) | `undefined`

### name

`string` | [`PropertyName`](../type-aliases/PropertyName.md)

### questionToken

[`QuestionToken`](../type-aliases/QuestionToken.md) | `undefined`

## Returns

[`MethodSignature`](../interfaces/MethodSignature.md)

## Deprecated

Use `factory.createMethodSignature` or the factory supplied by your transformation context instead.
