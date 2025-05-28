[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getJSDocTypeParameterTags

# Function: getJSDocTypeParameterTags()

> **getJSDocTypeParameterTags**(`param`): readonly [`JSDocTemplateTag`](../interfaces/JSDocTemplateTag.md)[]

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4760

Gets the JSDoc type parameter tags for the node if present.

## Parameters

### param

[`TypeParameterDeclaration`](../interfaces/TypeParameterDeclaration.md)

## Returns

readonly [`JSDocTemplateTag`](../interfaces/JSDocTemplateTag.md)[]

## Remarks

Returns any JSDoc template tag whose names match the provided
parameter, whether a template tag on a containing function
expression, or a template tag on a variable declaration whose
initializer is the containing function. The tags closest to the
node are returned first, so in the previous example, the template
tag on the containing function expression would be first.
