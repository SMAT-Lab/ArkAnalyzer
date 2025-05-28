[**ArkAnalyzer**](../../../../README.md)

***

[ArkAnalyzer](../../../../globals.md) / [ts](../README.md) / getJSDocType

# Function: getJSDocType()

> **getJSDocType**(`node`): `undefined` \| [`TypeNode`](../interfaces/TypeNode.md)

Defined in: node\_modules/ohos-typescript/lib/typescript.d.ts:4806

Gets the type node for the node if provided via JSDoc.

## Parameters

### node

[`Node`](../interfaces/Node.md)

## Returns

`undefined` \| [`TypeNode`](../interfaces/TypeNode.md)

## Remarks

The search includes any JSDoc param tag that relates
to the provided parameter, for example a type tag on the
parameter itself, or a param tag on a containing function
expression, or a param tag on a variable declaration whose
initializer is the containing function. The tags closest to the
node are examined first, so in the previous example, the type
tag directly on the node would be returned.
