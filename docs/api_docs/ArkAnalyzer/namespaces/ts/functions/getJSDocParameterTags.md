[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getJSDocParameterTags

# Function: getJSDocParameterTags()

> **getJSDocParameterTags**(`param`): readonly [`JSDocParameterTag`](../interfaces/JSDocParameterTag.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4749

Gets the JSDoc parameter tags for the node if present.

## Parameters

### param

[`ParameterDeclaration`](../interfaces/ParameterDeclaration.md)

## Returns

readonly [`JSDocParameterTag`](../interfaces/JSDocParameterTag.md)[]

## Remarks

Returns any JSDoc param tag whose name matches the provided
parameter, whether a param tag on a containing function
expression, or a param tag on a variable declaration whose
initializer is the containing function. The tags closest to the
node are returned first, so in the previous example, the param
tag on the containing function expression would be first.

For binding patterns, parameter tags are matched by position.
